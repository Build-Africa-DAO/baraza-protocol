-- =============================================================================
-- Migration: 036_cr007_artizen_campaigns_reconciliation.sql
-- Subsystem: Artizen Campaign Management, Conservation Ledger & SASRA Liquidity Guard
-- Standard: S&P 500 Enterprise Fintech (BigInt Precision, Dijkstra Locking)
-- Invariants Enforced:
--   - I5: Zero-Drift Split Conservation (total_raised == platform_fee + treasury_net)
--   - I-SASRA-1: Section 24 Statutory Liquidity Reserve Guard (SLR >= 15%)
--   - 64-bit Numeric Bounds: 0 <= total_raised <= 10^15 minor units
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create public.artizen_campaigns Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artizen_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    total_raised_minor NUMERIC(38, 0) NOT NULL DEFAULT 0
        CHECK (total_raised_minor >= 0 AND total_raised_minor <= 1000000000000000),
    platform_fee_bps INTEGER NOT NULL DEFAULT 500
        CHECK (platform_fee_bps >= 0 AND platform_fee_bps <= 5000),
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PENDING_SETTLEMENT', 'SETTLED', 'CANCELLED')),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Create public.artizen_settlement_ledger Table
--    Strict Invariant I5: platform_fee_minor + treasury_net_minor == total_raised_minor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artizen_settlement_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.artizen_campaigns(id) ON DELETE CASCADE,
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    total_raised_minor NUMERIC(38, 0) NOT NULL,
    platform_fee_minor NUMERIC(38, 0) NOT NULL,
    treasury_net_minor NUMERIC(38, 0) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    settlement_tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Invariant I5: Mathematical Zero-Drift Check
    CONSTRAINT chk_artizen_split_conservation
        CHECK (total_raised_minor = platform_fee_minor + treasury_net_minor)
);

CREATE INDEX IF NOT EXISTS idx_artizen_campaigns_community ON public.artizen_campaigns(community_id, status);
CREATE INDEX IF NOT EXISTS idx_artizen_settlement_campaign ON public.artizen_settlement_ledger(campaign_id);

-- ---------------------------------------------------------------------------
-- 3. Stored Procedure: artizen_settle_campaign_atomic
--    Dijkstra Hierarchy: communities (1) -> artizen_campaigns (2)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.artizen_settle_campaign_atomic(
    p_campaign_id UUID,
    p_operator TEXT,
    p_tx_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign RECORD;
    v_community RECORD;
    v_fee NUMERIC(38, 0);
    v_net NUMERIC(38, 0);
    v_required_reserve NUMERIC(38, 0);
BEGIN
    -- Dijkstra step 1: Lock parent community first
    SELECT c.* INTO v_community
    FROM public.communities c
    JOIN public.artizen_campaigns ac ON ac.community_id = c.id
    WHERE ac.id = p_campaign_id
    FOR UPDATE OF c;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'COMMUNITY_NOT_FOUND: Associated community for campaign % does not exist', p_campaign_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Dijkstra step 2: Lock campaign
    SELECT * INTO v_campaign
    FROM public.artizen_campaigns
    WHERE id = p_campaign_id
    FOR UPDATE;

    IF v_campaign.status <> 'ACTIVE' AND v_campaign.status <> 'PENDING_SETTLEMENT' THEN
        RAISE EXCEPTION 'CAMPAIGN_NOT_SETTLEABLE: Campaign status is %', v_campaign.status
            USING ERRCODE = '22000';
    END IF;

    -- Mathematical Split Computation (Zero-Drift Floor Division)
    v_fee := FLOOR((v_campaign.total_raised_minor * v_campaign.platform_fee_bps)::numeric / 10000);
    v_net := v_campaign.total_raised_minor - v_fee;

    -- Invariant I-SASRA-1: Statutory Liquidity Reserve Guard (SLR >= 15%)
    IF v_community.withdrawable_deposits_minor > 0 THEN
        v_required_reserve := FLOOR((v_community.withdrawable_deposits_minor::numeric * v_community.minimum_reserve_ratio_bps)::numeric / 10000);
        -- If post-settlement liquidity would breach statutory reserve
        IF v_net < v_required_reserve THEN
            RAISE EXCEPTION 'SASRA_RESERVE_VIOLATION: Liquidity falls below statutory reserve requirement (% minor units required, % available)',
                v_required_reserve, v_net
                USING ERRCODE = '54000';
        END IF;
    END IF;

    -- Insert into settlement ledger (guaranteed by chk_artizen_split_conservation)
    INSERT INTO public.artizen_settlement_ledger (
        campaign_id,
        community_id,
        total_raised_minor,
        platform_fee_minor,
        treasury_net_minor,
        currency,
        settlement_tx_hash
    ) VALUES (
        p_campaign_id,
        v_campaign.community_id,
        v_campaign.total_raised_minor,
        v_fee,
        v_net,
        'KES',
        p_tx_hash
    );

    -- Mark campaign as SETTLED
    UPDATE public.artizen_campaigns
    SET status = 'SETTLED',
        settled_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = p_campaign_id;

    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', p_campaign_id,
        'community_id', v_campaign.community_id,
        'total_raised_minor', v_campaign.total_raised_minor,
        'platform_fee_minor', v_fee,
        'treasury_net_minor', v_net,
        'tx_hash', p_tx_hash,
        'settled_at', clock_timestamp()
    );
END;
$$;

COMMIT;
