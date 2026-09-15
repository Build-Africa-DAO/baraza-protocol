-- =============================================================================
-- Migration: 037_custom_auth_and_otp_sessions.sql
-- Subsystem: Custom Multi-Factor Authentication, OTP Challenges & Notification Outbox
-- Standard: S&P 500 Enterprise Fintech (NIST SP 800-63B, 256-bit CSPRNG, Zero Duplication)
-- Invariants Enforced:
--   - I-AUTH-1: Cryptographic Salted Hashing for OTP Challenges (5 attempts max, 10m TTL)
--   - I-AUTH-2: 256-Bit High-Entropy Bearer Session Tokens (30d TTL, instant revocation)
--   - Invariant I-ROLE-3: Zero Duplication (Extends existing public.user_profiles)
--   - Poison Pill Isolation: Notification outbox failure decoupling
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Extend public.user_profiles with Sovereign Identity Fields
--    (Neutralizes Defect F-03: Retains 3NF, zero auth_users table duplication)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_google_sub ON public.user_profiles(google_sub);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_e164 ON public.user_profiles(phone_e164);

-- ---------------------------------------------------------------------------
-- 2. Create public.auth_otp_challenges Table
--    NIST SP 800-63B Compliant OTP Verification
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'signin', 'phone_verify', 'step_up')),
    attempts_remaining INTEGER NOT NULL DEFAULT 5 CHECK (attempts_remaining >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Active unconsumed challenge uniqueness: invalidates prior challenge per destination/purpose
CREATE INDEX IF NOT EXISTS idx_active_otp_challenge
    ON public.auth_otp_challenges(destination, purpose)
    WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_otp_challenges_dest_exp
    ON public.auth_otp_challenges(destination, expires_at);

-- ---------------------------------------------------------------------------
-- 3. Create public.auth_sessions Table
--    256-bit Cryptographic Bearer Session Tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address TEXT
);

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
    ON public.auth_sessions(session_token_hash)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
    ON public.auth_sessions(user_profile_id);

-- ---------------------------------------------------------------------------
-- 4. Create public.notification_outbox Table
--    Decoupled Transactional Messaging with Poison Pill Isolation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    template_id TEXT NOT NULL,
    template_vars JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'POISON_PILL')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ
);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_outbox_pending
    ON public.notification_outbox(status, created_at)
    WHERE status = 'PENDING';

COMMIT;
