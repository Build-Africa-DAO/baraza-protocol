-- 010_proposals_votes_schema_gaps.sql
--
-- Phase 0.1 canonical migration (NEXT_STEPS.md §0.1).
--
-- 1. Fills schema gaps on communities, memberships, payment_orders
--    (columns referenced by API routes but never migrated).
-- 2. Creates the proposals and votes tables needed for governance flows.
-- 3. Adds missing indexes and RLS policies.
--
-- Run in order after 009_membership_payment_order_unique.sql.
-- Idempotent: all statements use IF NOT EXISTS / IF EXISTS guards.

-- ─── communities ─────────────────────────────────────────────────────────────
-- Base table created before migration 001. Adding governance + identity
-- columns that CreateCommunity.tsx and the communities API need.

-- NOTE: membership fee already lives in communities.membership_fee (used by
-- communities.ts) — deliberately NOT adding a duplicate membership_fee_kes.
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS slug               text,
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS governor_address   text,     -- on-chain governor: Base bytes32 deployer or Stellar contract ID
  ADD COLUMN IF NOT EXISTS token_address      text,     -- on-chain token: Base ERC721 or Stellar custom asset
  ADD COLUMN IF NOT EXISTS treasury_address   text,     -- Stellar G-account or EVM treasury proxy
  ADD COLUMN IF NOT EXISTS created_by         text;     -- wallet address of the creator (text, matching proposals.created_by)

-- Slug must be unique when set; NULL allowed while community is being drafted.
CREATE UNIQUE INDEX IF NOT EXISTS communities_slug_unique
  ON communities (slug)
  WHERE slug IS NOT NULL;

-- ─── memberships ─────────────────────────────────────────────────────────────
-- 004_memberships.sql stores user_id_hash (wallet-derived). Adding the phone
-- identity hash, NFT mint address, and on-chain attestation flag.

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS phone_hash          text,    -- HMAC-peppered phone hash (replaces wallet identity at full launch)
  ADD COLUMN IF NOT EXISTS nft_mint_address    text,    -- Solana NFT mint or Base ERC721 token ID
  ADD COLUMN IF NOT EXISTS on_chain_attested   boolean  NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS memberships_phone_hash_idx
  ON memberships (phone_hash)
  WHERE phone_hash IS NOT NULL;

-- memberships has a public SELECT policy (004). phone_hash is an identity
-- correlator (joins against payment_orders.phone_hash) and must not be
-- anon-readable. RLS is row-level only, so use column-level grants: revoke
-- the table-wide SELECT and re-grant every column except phone_hash.
-- All client queries use explicit column lists, so nothing breaks.
REVOKE SELECT ON memberships FROM anon, authenticated;
GRANT SELECT (
  member_id, community_id, user_id_hash, wallet_address, membership_mint,
  membership_token_account, tier_id, status, voting_weight, joined_at,
  activated_at, expires_at, revoked_at, migrated_from, migrated_to,
  payment_order_id, metadata_uri, nft_mint_address, on_chain_attested
) ON memberships TO anon, authenticated;

-- ─── payment_orders ──────────────────────────────────────────────────────────
-- 002 has phone_hash and amount_expected. Adding the Stellar-specific amounts,
-- BRZA allocation, intent token hash, and wallet-identity hash. These columns
-- are forward-looking: verify-payment.ts/activate.ts must be updated to write
-- them (they currently keep the intent token in the request body only).

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS intent_token_hash text,       -- sha256 of the HMAC-signed intent token. NEVER store the raw bearer.
  ADD COLUMN IF NOT EXISTS user_id_hash   text,          -- HMAC of wallet address (pre-phone-identity bridge)
  ADD COLUMN IF NOT EXISTS amount_xlm     numeric(20, 7),-- XLM settled to community treasury
  ADD COLUMN IF NOT EXISTS amount_kes     numeric(20, 2),-- KES equivalent (Kotani onramp)
  ADD COLUMN IF NOT EXISTS brza_allocated numeric(20, 7);-- BRZA tokens to mint after reconciliation

CREATE INDEX IF NOT EXISTS payment_orders_user_id_hash_idx
  ON payment_orders (user_id_hash)
  WHERE user_id_hash IS NOT NULL;

-- Dedupe: one LIVE order per intent token. Terminal failures release the
-- token so a legitimate retry of the same signed intent can create a new
-- order (a failed order must not burn the token forever).
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_intent_token_unique
  ON payment_orders (intent_token_hash)
  WHERE intent_token_hash IS NOT NULL
    AND status NOT IN ('PAYMENT_EXPIRED', 'PAYMENT_FAILED', 'MINT_FAILED_FINAL', 'REFUND_CONFIRMED');

-- payment_orders has a public SELECT policy (008). Bearer/identity material
-- (activation_secret_hash, phone_hash, intent_token_hash, user_id_hash) must
-- not be anon-readable. Column-level grants: revoke table-wide SELECT and
-- re-grant the safe columns. SELECT_COLUMNS in payments.ts and the
-- knowledgeGraph query use explicit column lists covered below.
REVOKE SELECT ON payment_orders FROM anon, authenticated;
GRANT SELECT (
  order_id, community_id, membership_tier_id, provider, provider_environment,
  provider_reference, wallet_address, amount_expected, amount_received,
  currency, status, expires_at, confirmed_at, mint_signature, refund_id,
  idempotency_key, created_at, updated_at, amount_xlm, amount_kes, brza_allocated
) ON payment_orders TO anon, authenticated;

-- ─── proposals ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  id                   text          PRIMARY KEY,
  community_id         text          NOT NULL,
  title                text          NOT NULL,
  description          text          NOT NULL DEFAULT '',
  kind                 text          NOT NULL DEFAULT 'general',
  status               text          NOT NULL DEFAULT 'draft',
  on_chain_proposal_id text,          -- bytes32 (Base Governor) or Soroban contract key (Stellar)
  chain                text          NOT NULL DEFAULT 'stellar',
  created_by           text,          -- wallet address of the proposer
  starts_at            timestamptz,
  ends_at              timestamptz,
  for_votes            bigint        NOT NULL DEFAULT 0,
  against_votes        bigint        NOT NULL DEFAULT 0,
  abstain_votes        bigint        NOT NULL DEFAULT 0,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT proposals_status_chk
    CHECK (status IN ('draft', 'pending', 'active', 'passed', 'failed', 'queued', 'executed', 'cancelled')),
  CONSTRAINT proposals_chain_chk
    CHECK (chain IN ('solana', 'stellar', 'base', 'arbitrum', 'optimism', 'celo')),
  CONSTRAINT proposals_kind_chk
    CHECK (kind IN ('general', 'treasury', 'membership', 'parameter', 'emergency')),
  CONSTRAINT proposals_vote_counts_chk
    CHECK (for_votes >= 0 AND against_votes >= 0 AND abstain_votes >= 0)
);

-- (community_id, status) matches the dominant query shape: "active proposals
-- for this community". The leading column also serves bare community_id
-- lookups. status/chain alone are low-cardinality and not worth indexes.
CREATE INDEX IF NOT EXISTS proposals_community_status_idx ON proposals (community_id, status);
CREATE INDEX IF NOT EXISTS proposals_ends_at_idx          ON proposals (ends_at);

-- Fast lookup when syncing on-chain state back to Supabase (Base/Stellar cron).
CREATE UNIQUE INDEX IF NOT EXISTS proposals_on_chain_id_unique
  ON proposals (community_id, on_chain_proposal_id)
  WHERE on_chain_proposal_id IS NOT NULL;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proposals are publicly readable" ON proposals;
CREATE POLICY "Proposals are publicly readable"
  ON proposals FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS proposals_set_updated_at ON proposals;
CREATE TRIGGER proposals_set_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ─── votes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS votes (
  id           text          PRIMARY KEY,
  -- RESTRICT, not CASCADE: deleting a proposal must never silently erase
  -- the vote audit trail.
  proposal_id  text          NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
  member_id    text          NOT NULL REFERENCES memberships(member_id) ON DELETE RESTRICT,
  option       text          NOT NULL,
  -- bigint to match memberships.voting_weight (bigint in 004).
  weight       bigint        NOT NULL DEFAULT 1,
  tx_hash      text,          -- on-chain tx hash when vote is submitted to Base/Stellar
  cast_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT votes_option_chk  CHECK (option IN ('yes', 'no', 'abstain')),
  CONSTRAINT votes_weight_chk  CHECK (weight > 0)
);

-- One vote per member per proposal; DB-level backstop for the idempotency
-- check in the vote casting API. Its leading column also serves all
-- proposal_id lookups (no separate proposal_id index needed).
CREATE UNIQUE INDEX IF NOT EXISTS votes_member_proposal_unique
  ON votes (proposal_id, member_id);

CREATE INDEX IF NOT EXISTS votes_member_id_idx   ON votes (member_id);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Ballot privacy: individual votes are NOT publicly readable. With the anon
-- key shipped in the client bundle, a public SELECT policy would let anyone
-- see how every member voted (member_id joins to the public memberships
-- table) — including while voting is open. Only the service role reads
-- votes; public consumers get aggregate tallies from proposals.
DROP POLICY IF EXISTS "Votes are publicly readable" ON votes;

-- ─── tally integrity ─────────────────────────────────────────────────────────
-- Maintain proposals.for_votes/against_votes/abstain_votes from the votes
-- table inside the same transaction as the vote write. Avoids the
-- read-modify-write race where concurrent votes lose increments.

CREATE OR REPLACE FUNCTION apply_vote_tally()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE proposals SET
      for_votes     = for_votes     + CASE WHEN NEW.option = 'yes'     THEN NEW.weight ELSE 0 END,
      against_votes = against_votes + CASE WHEN NEW.option = 'no'      THEN NEW.weight ELSE 0 END,
      abstain_votes = abstain_votes + CASE WHEN NEW.option = 'abstain' THEN NEW.weight ELSE 0 END
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE proposals SET
      for_votes     = for_votes     - CASE WHEN OLD.option = 'yes'     THEN OLD.weight ELSE 0 END,
      against_votes = against_votes - CASE WHEN OLD.option = 'no'      THEN OLD.weight ELSE 0 END,
      abstain_votes = abstain_votes - CASE WHEN OLD.option = 'abstain' THEN OLD.weight ELSE 0 END
    WHERE id = OLD.proposal_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS votes_apply_tally ON votes;
CREATE TRIGGER votes_apply_tally
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION apply_vote_tally();

-- Votes are immutable: block UPDATE so tallies cannot drift.
CREATE OR REPLACE FUNCTION reject_vote_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'votes are immutable — delete and re-insert to change a vote';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS votes_reject_update ON votes;
CREATE TRIGGER votes_reject_update
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION reject_vote_update();
