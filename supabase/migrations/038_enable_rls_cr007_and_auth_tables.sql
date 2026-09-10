-- =============================================================================
-- Migration: 038_enable_rls_cr007_and_auth_tables.sql
-- Subsystem: Defense-in-Depth Database Security Hardening (RLS & Role Quarantine)
-- Standard: S&P 500 Enterprise Fintech / OWASP API Security Top 10 (API1:2023, API3:2023)
-- Target Tables:
--   1. public.steward_mutations (CR-007)
--   2. public.payment_exceptions (CR-007 DLQ)
--   3. public.artizen_campaigns (CR-007)
--   4. public.artizen_settlement_ledger (CR-007)
--   5. public.auth_otp_challenges (Sovereign Auth)
--   6. public.auth_sessions (Sovereign Auth)
--   7. public.notification_outbox (Sovereign Auth)
-- Invariants Enforced:
--   - Zero Public PostgREST Exposure: anon and authenticated roles have zero read/write
--     access to sensitive audit, mutation, exception, session, and OTP tables.
--   - Service Role Monotonic Sovereignty: All mutations and administrative workflows
--     execute strictly through the backend service_role identity.
--   - Public Campaign Discovery: artizen_campaigns allows SELECT to anon/authenticated
--     for open discovery while restricting all INSERT/UPDATE/DELETE strictly to service_role.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Enable Row Level Security (RLS) on All 7 Subsystem Tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.steward_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artizen_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artizen_settlement_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Revoke Permissive Access from Public PostgREST Roles (anon, authenticated)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.steward_mutations FROM anon, authenticated;
REVOKE ALL ON public.payment_exceptions FROM anon, authenticated;
REVOKE ALL ON public.artizen_campaigns FROM anon, authenticated;
REVOKE ALL ON public.artizen_settlement_ledger FROM anon, authenticated;
REVOKE ALL ON public.auth_otp_challenges FROM anon, authenticated;
REVOKE ALL ON public.auth_sessions FROM anon, authenticated;
REVOKE ALL ON public.notification_outbox FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Grant Explicit Table Access to service_role
-- ---------------------------------------------------------------------------
GRANT ALL ON public.steward_mutations TO service_role;
GRANT ALL ON public.payment_exceptions TO service_role;
GRANT ALL ON public.artizen_campaigns TO service_role;
GRANT ALL ON public.artizen_settlement_ledger TO service_role;
GRANT ALL ON public.auth_otp_challenges TO service_role;
GRANT ALL ON public.auth_sessions TO service_role;
GRANT ALL ON public.notification_outbox TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Define Defense-in-Depth RLS Policies
-- ---------------------------------------------------------------------------

-- Table 1: steward_mutations (Strict service_role only)
DROP POLICY IF EXISTS "service_role_all_steward_mutations" ON public.steward_mutations;
CREATE POLICY "service_role_all_steward_mutations"
    ON public.steward_mutations TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "steward_mutations_deny_anon" ON public.steward_mutations;
CREATE POLICY "steward_mutations_deny_anon"
    ON public.steward_mutations FOR ALL TO anon, authenticated
    USING (false);

-- Table 2: payment_exceptions (Strict service_role only)
DROP POLICY IF EXISTS "service_role_all_payment_exceptions" ON public.payment_exceptions;
CREATE POLICY "service_role_all_payment_exceptions"
    ON public.payment_exceptions TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payment_exceptions_deny_anon" ON public.payment_exceptions;
CREATE POLICY "payment_exceptions_deny_anon"
    ON public.payment_exceptions FOR ALL TO anon, authenticated
    USING (false);

-- Table 3: artizen_campaigns (Public SELECT discovery, service_role write)
GRANT SELECT ON public.artizen_campaigns TO anon, authenticated;

DROP POLICY IF EXISTS "service_role_all_artizen_campaigns" ON public.artizen_campaigns;
CREATE POLICY "service_role_all_artizen_campaigns"
    ON public.artizen_campaigns TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Artizen campaigns are publicly readable" ON public.artizen_campaigns;
CREATE POLICY "Artizen campaigns are publicly readable"
    ON public.artizen_campaigns FOR SELECT TO anon, authenticated
    USING (true);

-- Table 4: artizen_settlement_ledger (Strict service_role only)
DROP POLICY IF EXISTS "service_role_all_artizen_settlement_ledger" ON public.artizen_settlement_ledger;
CREATE POLICY "service_role_all_artizen_settlement_ledger"
    ON public.artizen_settlement_ledger TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "artizen_settlement_ledger_deny_anon" ON public.artizen_settlement_ledger;
CREATE POLICY "artizen_settlement_ledger_deny_anon"
    ON public.artizen_settlement_ledger FOR ALL TO anon, authenticated
    USING (false);

-- Table 5: auth_otp_challenges (Strict service_role only)
DROP POLICY IF EXISTS "service_role_all_auth_otp_challenges" ON public.auth_otp_challenges;
CREATE POLICY "service_role_all_auth_otp_challenges"
    ON public.auth_otp_challenges TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_otp_challenges_deny_anon" ON public.auth_otp_challenges;
CREATE POLICY "auth_otp_challenges_deny_anon"
    ON public.auth_otp_challenges FOR ALL TO anon, authenticated
    USING (false);

-- Table 6: auth_sessions (Strict service_role only)
DROP POLICY IF EXISTS "service_role_all_auth_sessions" ON public.auth_sessions;
CREATE POLICY "service_role_all_auth_sessions"
    ON public.auth_sessions TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_sessions_deny_anon" ON public.auth_sessions;
CREATE POLICY "auth_sessions_deny_anon"
    ON public.auth_sessions FOR ALL TO anon, authenticated
    USING (false);

-- Table 7: notification_outbox (Strict service_role only)
DROP POLICY IF EXISTS "service_role_all_notification_outbox" ON public.notification_outbox;
CREATE POLICY "service_role_all_notification_outbox"
    ON public.notification_outbox TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notification_outbox_deny_anon" ON public.notification_outbox;
CREATE POLICY "notification_outbox_deny_anon"
    ON public.notification_outbox FOR ALL TO anon, authenticated
    USING (false);

COMMIT;
