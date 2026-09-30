-- =============================================================================
-- Migration: 044_launch_pricing_and_pilot_exemptions.sql
-- Subsystem: Dynamic Launch Pricing, Member Activation & Pilot Exemption Engine
-- Standard: S&P 500 Enterprise Fintech / Double-Entry Ledger Invariant Protection
-- Objectives:
--   - Add is_pilot_exempt and platform_fee_bps to public.communities
--   - Add protocol_activated and protocol_activated_at to public.user_profiles
--   - Seed dynamic pricing rules into public.system_config
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Communities Schema Updates (Pilot Exemptions & Fee Customization)
-- ---------------------------------------------------------------------------
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS is_pilot_exempt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS platform_fee_bps INTEGER NOT NULL DEFAULT 150;

COMMENT ON COLUMN public.communities.is_pilot_exempt IS 'Flag indicating exemption from launch fees and platform surcharges (e.g. Canva Creators Kenya pilot).';
COMMENT ON COLUMN public.communities.platform_fee_bps IS 'Community-specific platform fee in basis points (default 150 = 1.50%).';

-- Set Saturday Canva Creators Kenya pilot as explicitly exempt from retroactive community activation fees
UPDATE public.communities
SET is_pilot_exempt = true
WHERE id = 'canva-creators-kenya' OR id ILIKE '%canva%' OR name ILIKE '%canva%';

-- ---------------------------------------------------------------------------
-- 2. User Profiles Schema Updates (Global Protocol Account Activation)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS protocol_activated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS protocol_activated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_profiles_protocol_activated
  ON public.user_profiles(protocol_activated);

COMMENT ON COLUMN public.user_profiles.protocol_activated IS 'Indicates whether member has paid the one-time network-wide KES 100 protocol activation fee upon their first financial transaction.';

-- ---------------------------------------------------------------------------
-- 3. Seed Launch Pricing Configuration into public.system_config
-- ---------------------------------------------------------------------------
INSERT INTO public.system_config (key, value, updated_at)
VALUES (
  'pricing_rules',
  jsonb_build_object(
    'global_platform_fee_bps', 150,
    'community_activation_minor', 25000,
    'member_activation_minor', 10000,
    'carrier_pass_through', true,
    'effective_date', '2026-10-10T00:00:00Z',
    'updated_at', now()
  ),
  now()
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

COMMIT;
