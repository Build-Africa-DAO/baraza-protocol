-- =============================================================================
-- Migration: 040_reconcile_schema_fractures.sql
-- Subsystem: Schema Synchronization, General Ledger Immutability & Concurrency
-- Standard: S&P 500 Enterprise Fintech / NIST SP 800-63B / Double-Entry Invariant I4
-- Remediations:
--   - Fix V11: Add 'clearing_settlement' to journal_entries_reference_type_check
--   - Fix V15: Add 'secretary' to members_role_chk & scope auth_user_id uniqueness
--   - Fix V15: Bidirectional sync trigger from memberships -> members
--   - Fix I4:  Append-only immutability trigger on journal_entries (prohibit UPDATE/DELETE)
--   - Fix V2:  Atomic community fund balance increment function (prevent lost updates)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Fix V11: Expand journal_entries reference_type check
-- ---------------------------------------------------------------------------
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_reference_type_check;

ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_reference_type_check CHECK (
  reference_type IN (
    'dues_ingress',
    'governance_payout',
    'retropgf_settlement',
    'escrow_clearing',
    'clearing_settlement',
    'compensatory_reversal',
    'fee_collection',
    'fx_slippage_clearing',
    'reversal_loss_reserve'
  )
);

-- ---------------------------------------------------------------------------
-- 2. Fix V15: Expand members_role_chk & Rescope auth_user_id Index
-- ---------------------------------------------------------------------------
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_chk;

ALTER TABLE public.members ADD CONSTRAINT members_role_chk CHECK (
  role IN ('founder', 'admin', 'treasurer', 'secretary', 'member')
);

-- Rescope global auth_user_id unique index to per-community uniqueness
DROP INDEX IF EXISTS public.members_auth_user_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS members_community_auth_user_unique
  ON public.members (community_id, auth_user_id);

-- Make phone_hash optional on members table if not available at activation
ALTER TABLE public.members ALTER COLUMN phone_hash DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Fix V15: Bidirectional Synchronization from memberships -> members
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_membership_to_member()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.members (
    member_id,
    auth_user_id,
    community_id,
    phone_hash,
    wallet_address,
    role,
    activation_status,
    activation_payment_ref,
    activated_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.member_id,
    COALESCE(NEW.user_id_hash, NEW.wallet_address),
    NEW.community_id,
    NEW.phone_hash,
    NEW.wallet_address,
    'member',
    LOWER(NEW.status),
    NEW.payment_order_id,
    NEW.activated_at,
    COALESCE(NEW.joined_at, now()),
    now()
  )
  ON CONFLICT (member_id) DO UPDATE SET
    wallet_address = EXCLUDED.wallet_address,
    activation_status = EXCLUDED.activation_status,
    activated_at = EXCLUDED.activated_at,
    phone_hash = COALESCE(EXCLUDED.phone_hash, public.members.phone_hash),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_membership_to_member ON public.memberships;

CREATE TRIGGER trg_sync_membership_to_member
  AFTER INSERT OR UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_membership_to_member();

-- Backfill any existing memberships into members
INSERT INTO public.members (
  member_id,
  auth_user_id,
  community_id,
  phone_hash,
  wallet_address,
  role,
  activation_status,
  activation_payment_ref,
  activated_at,
  created_at,
  updated_at
)
SELECT
  m.member_id,
  COALESCE(m.user_id_hash, m.wallet_address),
  m.community_id,
  m.phone_hash,
  m.wallet_address,
  'member',
  LOWER(m.status),
  m.payment_order_id,
  m.activated_at,
  COALESCE(m.joined_at, now()),
  now()
FROM public.memberships m
ON CONFLICT (member_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Fix I4: Append-Only Immutability on General Ledger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_journal_entries_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Journal entries are immutable double-entry records. UPDATE and DELETE operations are strictly prohibited (Invariant I4).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_journal_entries_mutation ON public.journal_entries;

CREATE TRIGGER trg_prevent_journal_entries_mutation
  BEFORE UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_journal_entries_mutation();

-- ---------------------------------------------------------------------------
-- 5. Fix V2: Atomic Community Fund Balance Increment Function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_community_fund_balance(
  p_community_id text,
  p_amount numeric
)
RETURNS numeric AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  UPDATE public.communities
  SET fund_balance = COALESCE(fund_balance, 0) + p_amount,
      updated_at = now()
  WHERE id = p_community_id
  RETURNING fund_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_community_fund_balance(text, numeric) TO service_role;

COMMIT;
