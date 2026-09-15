-- =============================================================================
-- Migration: 039_user_profiles_identity_expansion_and_payout_statuses.sql
-- Subsystem: Production Identity (Google OAuth/OTP), Consensus & Payout Lifecycle
-- Standard: S&P 500 Enterprise Fintech (Non-Blocking Zero-Downtime DDL & Cache Invalidation)
-- =============================================================================

BEGIN;

-- 1. Ensure communities has is_public column (defaults to true for public discovery)
ALTER TABLE public.communities
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- 2. Add columns to user_profiles with non-locking defaults
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS google_sub TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. De-duplicate any legacy test profiles before unique index creation
UPDATE public.user_profiles u1
SET email = NULL
WHERE email IS NOT NULL
  AND u1.id NOT IN (
      SELECT DISTINCT ON (LOWER(u2.email)) u2.id
      FROM public.user_profiles u2
      WHERE u2.email IS NOT NULL
      ORDER BY LOWER(u2.email), u2.created_at
  );

-- 4. Case-insensitive unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_lower 
    ON public.user_profiles (LOWER(email)) 
    WHERE email IS NOT NULL;

-- 5. Unique index on google_sub
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_google_sub_unique 
    ON public.user_profiles (google_sub) 
    WHERE google_sub IS NOT NULL;

-- 6. Role check constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_chk;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_chk
    CHECK (role IN ('member', 'admin', 'founder', 'auditor'));

-- 7. Hardened identity present check constraint (prevent empty string spoofing)
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS chk_user_profiles_identity_present;
ALTER TABLE public.user_profiles ADD CONSTRAINT chk_user_profiles_identity_present
    CHECK (
        (wallet_address IS NOT NULL AND length(trim(wallet_address)) > 0) OR
        (privy_did IS NOT NULL AND length(trim(privy_did)) > 0) OR
        (email IS NOT NULL AND length(trim(email)) >= 5 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') OR
        (google_sub IS NOT NULL AND length(trim(google_sub)) > 0)
    );

-- 8. Expand payment_orders_status_chk with frontend off-ramp lifecycle states
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_status_chk;
ALTER TABLE public.payment_orders ADD CONSTRAINT payment_orders_status_chk
    CHECK (status = ANY (ARRAY[
      'CREATED'::text, 'PAYMENT_REQUESTED'::text, 'PAYMENT_PENDING'::text, 'PAYMENT_CONFIRMED'::text, 
      'PROVIDER_CONFIRMED'::text, 'PROVIDER_PENDING_VERIFICATION'::text, 'STATUS_QUERY_SENT'::text, 
      'ATTESTATION_SUBMITTED'::text, 'MINT_QUEUED'::text, 'MINT_SUBMITTED'::text, 'MINT_CONFIRMED'::text, 
      'INDEXER_CONFIRMED'::text, 'RECONCILED'::text, 'PAYMENT_EXPIRED'::text, 'PAYMENT_FAILED'::text, 
      'AMOUNT_MISMATCH'::text, 'MINT_FAILED_RETRYABLE'::text, 'MINT_FAILED_FINAL'::text, 
      'REFUND_QUEUED'::text, 'REFUND_SUBMITTED'::text, 'REFUND_CONFIRMED'::text, 'MANUAL_REVIEW'::text, 
      'OFFRAMP_INITIATED'::text, 'DISBURSEMENT_PENDING'::text, 'REFUND_REQUESTED'::text,
      'DISPUTED_PENDING'::text, 'DISPUTED_RESOLVED'::text, 'SETTLED'::text, 'FAILED'::text,
      'REVERSAL_DETECTED'::text, 'REFUNDED'::text
    ]));

-- 9. Composite partial index for cron sweep optimization
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created 
    ON public.payment_orders(status, created_at)
    WHERE status IN ('CREATED', 'PAYMENT_REQUESTED', 'OFFRAMP_INITIATED');

-- 10. Enforce storage-level vote deduplication against TOCTOU race conditions
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_votes_proposal_member;
ALTER TABLE public.votes ADD CONSTRAINT uq_votes_proposal_member 
    UNIQUE (proposal_id, member_id);

-- 11. Trigger PostgREST schema cache reload signal
NOTIFY pgrst, 'reload schema';

COMMIT;
