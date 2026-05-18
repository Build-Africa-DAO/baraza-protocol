-- 001_communities_governance_columns.sql
--
-- Adds chain selection + governance config columns introduced by the
-- network selector and form-data-plumbing passes.
--
-- The application writes/reads these columns from app/src/lib/communities.ts.
-- Without this migration, Supabase mode fails on INSERT (unknown columns) and
-- silently strips the fields on SELECT.

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS chain                  text    NOT NULL DEFAULT 'solana',
  ADD COLUMN IF NOT EXISTS quorum_pct             integer NOT NULL DEFAULT 51,
  ADD COLUMN IF NOT EXISTS approval_threshold_pct integer NOT NULL DEFAULT 66,
  ADD COLUMN IF NOT EXISTS voting_period_days     integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS treasury_policy        text    NOT NULL DEFAULT 'multisig-ready';

-- Constrain the new enum-like columns at the database layer so a misbehaving
-- writer can't sneak in an unsupported value.
ALTER TABLE communities
  ADD CONSTRAINT communities_chain_chk
    CHECK (chain IN ('solana', 'stellar'));

ALTER TABLE communities
  ADD CONSTRAINT communities_treasury_policy_chk
    CHECK (treasury_policy IN ('multisig-ready', 'proposal-only', 'manual-review'));

ALTER TABLE communities
  ADD CONSTRAINT communities_quorum_pct_chk
    CHECK (quorum_pct BETWEEN 1 AND 100);

ALTER TABLE communities
  ADD CONSTRAINT communities_approval_threshold_pct_chk
    CHECK (approval_threshold_pct BETWEEN 1 AND 100);

ALTER TABLE communities
  ADD CONSTRAINT communities_voting_period_days_chk
    CHECK (voting_period_days BETWEEN 1 AND 365);
