-- =============================================================================
-- Migration: 042_system_config_and_circuit_breaker.sql
-- Subsystem: Global Emergency Circuit Breaker & Administrative Configuration
-- Standard: S&P 500 Enterprise Fintech / Basel III Capital Safeguards / Zero-Trust
-- Objectives:
--   - Provision public.system_config table for dynamic protocol operational state
--   - Seed global circuit breaker (is_emergency_paused) for instantaneous freeze
--   - Enforce Row Level Security (RLS) and service_role operational access
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create public.system_config Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for config freshness and telemetry audits
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at
    ON public.system_config(updated_at);

-- ---------------------------------------------------------------------------
-- 2. Seed Default Circuit Breaker Operational State
-- ---------------------------------------------------------------------------
INSERT INTO public.system_config (key, value)
VALUES (
    'circuit_breaker',
    jsonb_build_object(
        'is_emergency_paused', false,
        'reason', '',
        'paused_at', null,
        'paused_by', null,
        'affected_rails', jsonb_build_array('mpesa', 'minisend', 'soroban', 'cron')
    )
)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Row Level Security (RLS) & Access Permissions
-- ---------------------------------------------------------------------------
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Deny public anon/authenticated write access
DROP POLICY IF EXISTS "system_config_deny_anon" ON public.system_config;
CREATE POLICY "system_config_deny_anon"
    ON public.system_config FOR ALL TO anon, authenticated
    USING (false);

-- Grant full operational management to service_role
DROP POLICY IF EXISTS "service_role_all_system_config" ON public.system_config;
CREATE POLICY "service_role_all_system_config"
    ON public.system_config TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON public.system_config FROM anon, authenticated;
GRANT ALL ON public.system_config TO service_role;

COMMIT;
