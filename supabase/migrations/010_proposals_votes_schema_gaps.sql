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

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS slug               text,
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS governor_address   text,     -- on-chain governor: Base bytes32 deployer or Stellar contract ID
  ADD COLUMN IF NOT EXISTS token_address      text,     -- on-chain token: Base ERC721 or Stellar custom asset
  ADD COLUMN IF NOT EXISTS treasury_address   text,     -- Stellar G-account or EVM treasury proxy
  ADD COLUMN IF NOT EXISTS membership_fee_kes numeric(20, 2),
  ADD COLUMN IF NOT EXISTS created_by         uuid;

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

-- ─── payment_orders ──────────────────────────────────────────────────────────
-- 002 has phone_hash and amount_expected. Adding the Stellar-specific amounts,
-- BRZA allocation, HMAC intent token, and wallet-identity hash used by
-- verify-payment.ts and activate.ts.

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS intent_token   text,          -- HMAC-signed token binding payment to community + amount
  ADD COLUMN IF NOT EXISTS user_id_hash   text,          -- HMAC of wallet address (pre-phone-identity bridge)
  ADD COLUMN IF NOT EXISTS amount_xlm     numeric(20, 7),-- XLM settled to community treasury
  ADD COLUMN IF NOT EXISTS amount_kes     numeric(20, 2),-- KES equivalent (Kotani onramp)
  ADD COLUMN IF NOT EXISTS brza_allocated numeric(20, 7);-- BRZA tokens to mint after reconciliation

CREATE INDEX IF NOT EXISTS payment_orders_user_id_hash_idx
  ON payment_orders (user_id_hash)
  WHERE user_id_hash IS NOT NULL;

-- Dedupe: one pending/confirmed order per intent token (unique bearer).
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_intent_token_unique
  ON payment_orders (intent_token)
  WHERE intent_token IS NOT NULL;

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
  for_votes            integer       NOT NULL DEFAULT 0,
  against_votes        integer       NOT NULL DEFAULT 0,
  abstain_votes        integer       NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS proposals_community_id_idx ON proposals (community_id);
CREATE INDEX IF NOT EXISTS proposals_status_idx       ON proposals (status);
CREATE INDEX IF NOT EXISTS proposals_chain_idx        ON proposals (chain);
CREATE INDEX IF NOT EXISTS proposals_ends_at_idx      ON proposals (ends_at);

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
  proposal_id  text          NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  member_id    text          NOT NULL REFERENCES memberships(member_id) ON DELETE RESTRICT,
  option       text          NOT NULL,
  weight       integer       NOT NULL DEFAULT 1,
  tx_hash      text,          -- on-chain tx hash when vote is submitted to Base/Stellar
  cast_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT votes_option_chk  CHECK (option IN ('yes', 'no', 'abstain')),
  CONSTRAINT votes_weight_chk  CHECK (weight > 0)
);

-- One vote per member per proposal; DB-level backstop for the idempotency
-- check in the vote casting API.
CREATE UNIQUE INDEX IF NOT EXISTS votes_member_proposal_unique
  ON votes (proposal_id, member_id);

CREATE INDEX IF NOT EXISTS votes_proposal_id_idx ON votes (proposal_id);
CREATE INDEX IF NOT EXISTS votes_member_id_idx   ON votes (member_id);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes are publicly readable" ON votes;
CREATE POLICY "Votes are publicly readable"
  ON votes FOR SELECT
  USING (true);
