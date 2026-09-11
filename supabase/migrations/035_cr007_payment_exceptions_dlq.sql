-- =============================================================================
-- Migration: 035_cr007_payment_exceptions_dlq.sql
-- Subsystem: Payment Exceptions Dead Letter Queue (DLQ) & Two-Phase Resolution
-- Standard: S&P 500 Enterprise Fintech (Idempotent Ingestion, Monotonic Locking)
-- Invariants Enforced:
--   - I8: DLQ Isolation & Idempotent Ingestion (Non-existent or orphaned orders)
--   - Partial Unique Index: Zero duplicate key crashes on webhook retries
--   - Dijkstra Monotonic Locking: payment_exceptions -> payment_orders
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create public.payment_exceptions Table (DLQ)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL
        CHECK (provider IN ('kotani', 'paystack', 'minisend', 'swypt', 'stellar', 'solana')),
    payload JSONB NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'ABANDONED')),
    resolution_action TEXT
        CHECK (resolution_action IN ('RETRY_MATCH', 'MANUAL_REFUND', 'FORCE_FAIL', 'DISCARD')),
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_exceptions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Indices for Fast Operator Triage & Idempotent Webhook Replay Protection
-- ---------------------------------------------------------------------------
-- Prevents duplicate unhandled exceptions for the same pending order/provider pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_payment_exception
    ON public.payment_exceptions(order_id, provider)
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_payment_exceptions_status_created
    ON public.payment_exceptions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_exceptions_order_id
    ON public.payment_exceptions(order_id);

-- ---------------------------------------------------------------------------
-- 3. Stored Procedure: resolve_payment_exception_atomic
--    Dijkstra Hierarchy: payment_exceptions (4) -> payment_orders (3)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_payment_exception_atomic(
    p_exception_id UUID,
    p_action TEXT,
    p_target_order_id TEXT,
    p_operator TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exc RECORD;
    v_order RECORD;
BEGIN
    -- Monotonic hierarchy step 1: Lock exception record
    SELECT * INTO v_exc
    FROM public.payment_exceptions
    WHERE id = p_exception_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EXCEPTION_NOT_FOUND: Exception % does not exist', p_exception_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_exc.status <> 'PENDING' AND v_exc.status <> 'INVESTIGATING' THEN
        RAISE EXCEPTION 'EXCEPTION_ALREADY_RESOLVED: Exception status is %', v_exc.status
            USING ERRCODE = '22000';
    END IF;

    IF p_action NOT IN ('RETRY_MATCH', 'MANUAL_REFUND', 'FORCE_FAIL', 'DISCARD') THEN
        RAISE EXCEPTION 'INVALID_RESOLUTION_ACTION: Action % is not supported', p_action
            USING ERRCODE = '22023';
    END IF;

    -- Monotonic hierarchy step 2: Lock and update target payment_order if action requires mutation
    IF p_action IN ('RETRY_MATCH', 'FORCE_FAIL', 'MANUAL_REFUND') AND p_target_order_id IS NOT NULL THEN
        SELECT * INTO v_order
        FROM public.payment_orders
        WHERE order_id = p_target_order_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'TARGET_ORDER_NOT_FOUND: Target payment order % does not exist', p_target_order_id
                USING ERRCODE = 'P0002';
        END IF;

        IF p_action = 'RETRY_MATCH' THEN
            UPDATE public.payment_orders
            SET status = 'PAYMENT_CONFIRMED',
                updated_at = clock_timestamp()
            WHERE order_id = p_target_order_id;
        ELSIF p_action = 'FORCE_FAIL' THEN
            UPDATE public.payment_orders
            SET status = 'PAYMENT_FAILED',
                failure_reason = 'Operator force fail via DLQ exception resolution',
                updated_at = clock_timestamp()
            WHERE order_id = p_target_order_id;
        ELSIF p_action = 'MANUAL_REFUND' THEN
            UPDATE public.payment_orders
            SET status = 'REFUNDED',
                updated_at = clock_timestamp()
            WHERE order_id = p_target_order_id;
        END IF;
    END IF;

    -- Update exception record to RESOLVED
    UPDATE public.payment_exceptions
    SET status = 'RESOLVED',
        resolution_action = p_action,
        resolved_by = p_operator,
        resolved_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = p_exception_id;

    RETURN jsonb_build_object(
        'success', true,
        'exception_id', p_exception_id,
        'action', p_action,
        'target_order_id', p_target_order_id,
        'resolved_by', p_operator,
        'resolved_at', clock_timestamp()
    );
END;
$$;

COMMIT;
