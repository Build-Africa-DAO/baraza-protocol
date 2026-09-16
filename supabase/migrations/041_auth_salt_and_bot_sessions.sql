-- =============================================================================
-- Migration: 041_auth_salt_and_bot_sessions.sql
-- Subsystem: Cryptographic Entropy & Serverless Conversational State
-- Standard: S&P 500 Enterprise Fintech / NIST SP 800-63B / Zero-Trust Distributed Architecture
-- Remediations:
--   - Fix V26: Add per-challenge salt to auth_otp_challenges (anti-rainbow table defense)
--   - Fix V25: Create durable bot_sessions table for serverless WhatsApp conversational state
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Fix V26: Add per-challenge salt to auth_otp_challenges
-- ---------------------------------------------------------------------------
ALTER TABLE public.auth_otp_challenges
  ADD COLUMN IF NOT EXISTS salt TEXT NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------------
-- 2. Fix V25: Create public.bot_sessions Table for Edge Worker Durability
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    phone_number TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session expiration sweeps (15 min TTL maintenance)
CREATE INDEX IF NOT EXISTS idx_bot_sessions_updated_at
    ON public.bot_sessions(updated_at);

-- Enable RLS
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

-- Deny public / anon direct access
DROP POLICY IF EXISTS "bot_sessions_deny_anon" ON public.bot_sessions;
CREATE POLICY "bot_sessions_deny_anon"
    ON public.bot_sessions FOR ALL TO anon, authenticated
    USING (false);

-- Grant full operational privileges to service_role (Edge API webhooks)
DROP POLICY IF EXISTS "service_role_all_bot_sessions" ON public.bot_sessions;
CREATE POLICY "service_role_all_bot_sessions"
    ON public.bot_sessions TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON public.bot_sessions FROM anon, authenticated;
GRANT ALL ON public.bot_sessions TO service_role;

COMMIT;
