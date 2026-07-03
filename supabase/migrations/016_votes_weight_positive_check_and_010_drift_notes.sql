-- 016_votes_weight_positive_check_and_010_drift_notes.sql
--
-- Two purposes, bundled to keep the migration count low:
--
-- 1) Close a silent-corruption hole: votes.weight had no positivity guard, so
--    weight = 0 would silently no-op the tally trigger, and weight < 0 would
--    drive proposals.{for,against,abstain}_votes toward the >= 0 CHECK on
--    proposals and surface as an opaque trigger error instead of a clear
--    constraint violation at insert time.
--
-- 2) Operator notes for the 010 mid-PR rewrite. Migration 010
--    (`010_proposals_votes_schema_gaps.sql`) was substantially rewritten on
--    feat/brza-core after an earlier draft had already been applied to some
--    Supabase projects. Every change in 010 uses `ADD COLUMN IF NOT EXISTS`,
--    so drifted installs silently retain the old column layout AND miss the
--    column-level GRANT / ballot-privacy hardening. See the inline note
--    block below for the delta SQL operators should run if they applied
--    the pre-hardening 010.
--
-- Run after 015 (or 014 if 015 was renumbered out of this branch).
-- Idempotent: every statement is a guarded ADD CONSTRAINT.

-- ─── Operator note: 010 drift recovery (read before running) ────────────────
--
-- If `supabase db push` on this project ever applied an earlier draft of
-- migration 010 (`intent_token text` column, `created_by uuid`, no column
-- GRANT lockdown, no votes RLS DROP), run this delta in psql BEFORE this
-- 016 migration to bring the project to current 010:
--
--   -- 010 column drift
--   ALTER TABLE communities ALTER COLUMN created_by TYPE text USING created_by::text;
--   ALTER TABLE payment_orders DROP COLUMN IF EXISTS intent_token;
--   ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS intent_token_hash text;
--
--   -- 010 grant lockdown (memberships)
--   REVOKE SELECT ON memberships FROM anon, authenticated;
--   GRANT SELECT (
--     member_id, community_id, user_id_hash, wallet_address, membership_mint,
--     membership_token_account, tier_id, status, voting_weight, joined_at,
--     activated_at, expires_at, revoked_at, migrated_from, migrated_to,
--     payment_order_id, metadata_uri, nft_mint_address, on_chain_attested
--   ) ON memberships TO anon, authenticated;
--
--   -- 010 grant lockdown (payment_orders)
--   REVOKE SELECT ON payment_orders FROM anon, authenticated;
--   GRANT SELECT (
--     order_id, community_id, membership_tier_id, provider, provider_environment,
--     provider_reference, wallet_address, amount_expected, amount_received,
--     currency, status, expires_at, confirmed_at, mint_signature, refund_id,
--     idempotency_key, created_at, updated_at, amount_xlm, amount_kes, brza_allocated
--   ) ON payment_orders TO anon, authenticated;
--
--   -- 010 ballot privacy
--   DROP POLICY IF EXISTS "Votes are publicly readable" ON votes;
--
-- On a fresh project (10 ran in its final form), this delta is a no-op.

-- ─── votes.weight > 0 ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'votes_weight_positive_chk'
       AND conrelid = 'votes'::regclass
  ) THEN
    ALTER TABLE votes
      ADD CONSTRAINT votes_weight_positive_chk
      CHECK (weight > 0);
  END IF;
END$$;
