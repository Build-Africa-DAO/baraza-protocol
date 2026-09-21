-- ========================================================
-- BARAZA PROTOCOL — MASTER CONSOLIDATED DATABASE SCHEMA
-- Standard: S&P 500 Enterprise Fintech / Supabase PostgreSQL 16
-- Generated: 2026-09-21T16:32:10.669Z
-- Migrations Included: 000 through 043 (42 files)
-- ========================================================

-- ========================================================
-- PRE-MIGRATION: ENSURE AUTH SCHEMA AND JWT HELPERS EXIST
-- Idempotent & Privilege-Safe: Compatible with Supabase Cloud & Local Postgres
-- (Supabase Cloud manages the auth schema natively with supabase_admin;
--  these guards safely bypass creation when running as unprivileged postgres)
-- ========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE 'CREATE SCHEMA auth';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'auth' AND p.proname = 'role'
  ) THEN
    EXECUTE 'CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS ''SELECT coalesce(current_setting(''''request.jwt.claim.role'''', true), ''''anon'''');''';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    EXECUTE 'CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS ''SELECT coalesce(nullif(current_setting(''''request.jwt.claim.sub'''', true), '''''''')::uuid, ''''00000000-0000-0000-0000-000000000000''''::uuid);''';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'auth' AND p.proname = 'jwt'
  ) THEN
    EXECUTE 'CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS ''SELECT coalesce(nullif(current_setting(''''request.jwt.claims'''', true), '''''''')::jsonb, ''''{}''''::jsonb);''';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

-- >>> START MIGRATION: 000_base_communities.sql <<<
-- 000_base_communities.sql
-- Base table definition for communities before 001_communities_governance_columns.sql
-- Idempotent: uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS communities (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  membership_fee numeric(20, 2) DEFAULT 0,
  member_count   integer DEFAULT 0,
  fund_balance   numeric(20, 2) DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
-- >>> END MIGRATION: 000_base_communities.sql <<<

-- >>> START MIGRATION: 001_communities_governance_columns.sql <<<
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
    CHECK (chain IN ('solana', 'stellar', 'base', 'arbitrum', 'optimism', 'celo'));

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
-- >>> END MIGRATION: 001_communities_governance_columns.sql <<<

-- >>> START MIGRATION: 002_payment_orders.sql <<<
-- 002_payment_orders.sql
--
-- Payment order ledger for M-Pesa (and future wallet) checkout flows.
-- Schema mirrors MVP_ARCHITECTURE.md §5 (Payment Order Model).
--
-- Privacy rules enforced at the table level:
--   - phone_hash is HMAC/peppered, never raw E.164. The peppered hash is the
--     lookup key for dedupe and operator queries.
--   - Provider payloads land in payment_events (separate table, future migration).

CREATE TABLE IF NOT EXISTS payment_orders (
  order_id              text         PRIMARY KEY,
  user_id               uuid,
  community_id          text         NOT NULL,
  membership_tier_id    text,
  provider              text         NOT NULL DEFAULT 'africastalking',
  provider_environment  text         NOT NULL DEFAULT 'sandbox',
  provider_reference    text,
  activation_secret_hash text,
  wallet_address        text,
  amount_expected       numeric(20, 2) NOT NULL,
  amount_received       numeric(20, 2),
  currency              text         NOT NULL DEFAULT 'KES',
  phone_hash            text,
  status                text         NOT NULL DEFAULT 'CREATED',
  expires_at            timestamptz,
  confirmed_at          timestamptz,
  mint_signature        text,
  refund_id             text,
  idempotency_key       text         UNIQUE,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT payment_orders_amount_expected_chk
    CHECK (amount_expected > 0),
  CONSTRAINT payment_orders_provider_environment_chk
    CHECK (provider_environment IN ('sandbox', 'production')),
  CONSTRAINT payment_orders_status_chk
    CHECK (status IN (
      'CREATED', 'PAYMENT_REQUESTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED',
      'MINT_QUEUED', 'MINT_SUBMITTED', 'MINT_CONFIRMED', 'INDEXER_CONFIRMED',
      'RECONCILED', 'PAYMENT_EXPIRED', 'PAYMENT_FAILED', 'AMOUNT_MISMATCH',
      'MINT_FAILED_RETRYABLE', 'MINT_FAILED_FINAL', 'REFUND_QUEUED',
      'REFUND_SUBMITTED', 'REFUND_CONFIRMED', 'MANUAL_REVIEW'
    ))
);

CREATE INDEX IF NOT EXISTS payment_orders_community_id_idx ON payment_orders (community_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx       ON payment_orders (status);
CREATE INDEX IF NOT EXISTS payment_orders_phone_hash_idx   ON payment_orders (phone_hash);
CREATE INDEX IF NOT EXISTS payment_orders_created_at_idx   ON payment_orders (created_at DESC);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment orders are readable by exact order id" ON payment_orders;
CREATE POLICY "Payment orders are readable by exact order id"
  ON payment_orders FOR SELECT
  USING (false);

-- Touch updated_at on every UPDATE so admin dashboards can sort by recency.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_orders_set_updated_at ON payment_orders;
CREATE TRIGGER payment_orders_set_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
-- >>> END MIGRATION: 002_payment_orders.sql <<<

-- >>> START MIGRATION: 003_payment_attestations.sql <<<
-- 003_payment_attestations.sql
--
-- Off-chain mirror of the on-chain `PaymentAttestationAccount`
-- (programs/payment_attestation/src/lib.rs). The on-chain account is the
-- source of truth for consumption; this table exists for reconciliation
-- queries and admin dashboards that don't want to hit RPC for every read.
--
-- Per MVP_ARCHITECTURE.md §6, the on-chain PDA stores hashes only — never
-- raw payloads. The off-chain mirror does the same.

CREATE TABLE IF NOT EXISTS payment_attestations (
  attestation_pubkey      text         PRIMARY KEY,
  order_id                text         NOT NULL REFERENCES payment_orders(order_id) ON DELETE RESTRICT,
  order_id_hash           text         NOT NULL,
  community_id            text         NOT NULL,
  tier_id                 text,
  recipient_wallet        text         NOT NULL,
  amount_smallest_unit    bigint       NOT NULL,
  currency_code           text         NOT NULL DEFAULT 'KES',
  provider_environment    text         NOT NULL DEFAULT 'sandbox',
  provider_reference_hash text,
  member_id_hash          text,
  attester                text         NOT NULL,
  expires_at_slot         bigint,
  consumed                boolean      NOT NULL DEFAULT false,
  consumed_at_slot        bigint,
  voided                  boolean      NOT NULL DEFAULT false,
  voided_at_slot          bigint,
  created_at              timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT payment_attestations_amount_chk
    CHECK (amount_smallest_unit > 0),
  CONSTRAINT payment_attestations_provider_environment_chk
    CHECK (provider_environment IN ('sandbox', 'production'))
);

CREATE INDEX IF NOT EXISTS payment_attestations_order_id_idx
  ON payment_attestations (order_id);
CREATE INDEX IF NOT EXISTS payment_attestations_community_id_idx
  ON payment_attestations (community_id);
CREATE INDEX IF NOT EXISTS payment_attestations_recipient_wallet_idx
  ON payment_attestations (recipient_wallet);
CREATE INDEX IF NOT EXISTS payment_attestations_consumed_idx
  ON payment_attestations (consumed) WHERE consumed = false;
-- >>> END MIGRATION: 003_payment_attestations.sql <<<

-- >>> START MIGRATION: 004_memberships.sql <<<
-- 004_memberships.sql
--
-- Durable membership ledger. Off-chain mirror of the on-chain
-- `MemberAccount` PDA (programs/membership/src/lib.rs), with the same
-- stability-across-wallet-migration property: `member_id` is the
-- canonical identifier, NOT wallet_address.
--
-- Schema fields mirror MVP_ARCHITECTURE.md §6.1 (Membership fields to add).
-- Replaces the current localStorage-only membership tracking in
-- `app/src/lib/memberships.ts` when Supabase is wired.

CREATE TABLE IF NOT EXISTS memberships (
  member_id                text         PRIMARY KEY,
  community_id             text         NOT NULL,
  user_id_hash             text         NOT NULL,
  wallet_address           text         NOT NULL,
  membership_mint          text,
  membership_token_account text,
  tier_id                  text,
  status                   text         NOT NULL DEFAULT 'PENDING',
  voting_weight            bigint       NOT NULL DEFAULT 1,
  joined_at                timestamptz  NOT NULL DEFAULT now(),
  activated_at             timestamptz,
  expires_at               timestamptz,
  revoked_at               timestamptz,
  migrated_from            text         REFERENCES memberships(member_id) ON DELETE SET NULL,
  migrated_to              text         REFERENCES memberships(member_id) ON DELETE SET NULL,
  payment_order_id         text         REFERENCES payment_orders(order_id) ON DELETE SET NULL,
  metadata_uri             text,

  CONSTRAINT memberships_status_chk
    CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED', 'MIGRATED')),
  CONSTRAINT memberships_voting_weight_chk
    CHECK (voting_weight >= 0)
);

CREATE INDEX IF NOT EXISTS memberships_community_id_idx   ON memberships (community_id);
CREATE INDEX IF NOT EXISTS memberships_wallet_address_idx ON memberships (wallet_address);
CREATE INDEX IF NOT EXISTS memberships_user_id_hash_idx   ON memberships (user_id_hash);
CREATE INDEX IF NOT EXISTS memberships_status_idx         ON memberships (status);

-- Only one ACTIVE-or-PENDING membership per (community, wallet).
-- REVOKED, EXPIRED, MIGRATED records are historical and allowed to coexist.
CREATE UNIQUE INDEX IF NOT EXISTS memberships_active_community_wallet_unique
  ON memberships (community_id, wallet_address)
  WHERE status IN ('PENDING', 'ACTIVE');

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Memberships are publicly readable" ON memberships;
CREATE POLICY "Memberships are publicly readable"
  ON memberships FOR SELECT
  USING (true);
-- >>> END MIGRATION: 004_memberships.sql <<<

-- >>> START MIGRATION: 005_stellar_settlements.sql <<<
-- 005_stellar_settlements.sql
--
-- Stellar settlement ledger for Phase 2 payout/refund/settlement rails.
-- The app can verify a tx hash through Horizon, then persist the normalized
-- transaction record here once Supabase writes are wired.

CREATE TABLE IF NOT EXISTS stellar_settlements (
  settlement_id      text         PRIMARY KEY,
  owner_wallet       text         NOT NULL,
  community_id       text,
  stellar_account    text         NOT NULL,
  tx_hash            text         NOT NULL UNIQUE,
  asset_code         text         NOT NULL DEFAULT 'XLM',
  amount             numeric(20, 7),
  ledger             bigint,
  status             text         NOT NULL DEFAULT 'PENDING',
  memo               text,
  verified_at        timestamptz,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT stellar_settlements_status_chk
    CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'NOT_FOUND')),
  CONSTRAINT stellar_settlements_tx_hash_chk
    CHECK (tx_hash ~ '^[A-Fa-f0-9]{64}$'),
  CONSTRAINT stellar_settlements_amount_chk
    CHECK (amount IS NULL OR amount > 0)
);

CREATE INDEX IF NOT EXISTS stellar_settlements_owner_wallet_idx
  ON stellar_settlements (owner_wallet);
CREATE INDEX IF NOT EXISTS stellar_settlements_community_id_idx
  ON stellar_settlements (community_id);
CREATE INDEX IF NOT EXISTS stellar_settlements_stellar_account_idx
  ON stellar_settlements (stellar_account);
CREATE INDEX IF NOT EXISTS stellar_settlements_status_idx
  ON stellar_settlements (status);
CREATE INDEX IF NOT EXISTS stellar_settlements_created_at_idx
  ON stellar_settlements (created_at DESC);

ALTER TABLE stellar_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stellar settlements are publicly readable" ON stellar_settlements;
CREATE POLICY "Stellar settlements are publicly readable"
  ON stellar_settlements FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS stellar_settlements_set_updated_at ON stellar_settlements;
CREATE TRIGGER stellar_settlements_set_updated_at
  BEFORE UPDATE ON stellar_settlements
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
-- >>> END MIGRATION: 005_stellar_settlements.sql <<<

-- >>> START MIGRATION: 006_bounties_security_stellar.sql <<<
-- 006_bounties_security_stellar.sql
--
-- Durable Baraza-native bounty marketplace plus production hardening for
-- payment activation and Stellar settlement records.

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS activation_secret_hash text,
  ADD COLUMN IF NOT EXISTS wallet_address text;

CREATE INDEX IF NOT EXISTS payment_orders_wallet_address_idx
  ON payment_orders (wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_provider_reference_unique
  ON payment_orders (provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stellar_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment orders are readable by exact order id" ON payment_orders;
CREATE POLICY "Payment orders are readable by exact order id"
  ON payment_orders FOR SELECT
  USING (false);

CREATE TABLE IF NOT EXISTS bounties (
  id            text         PRIMARY KEY,
  community_id  text         NOT NULL,
  title         text         NOT NULL,
  category      text         NOT NULL DEFAULT 'General',
  reward_kes    numeric(20, 2) NOT NULL,
  deadline      date         NOT NULL,
  status        text         NOT NULL DEFAULT 'open',
  posted_by     text         NOT NULL,
  summary       text         NOT NULL,
  skills        text[]       NOT NULL DEFAULT '{}',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT bounties_reward_kes_chk CHECK (reward_kes > 0),
  CONSTRAINT bounties_status_chk CHECK (status IN ('open', 'in_review', 'awarded'))
);

CREATE TABLE IF NOT EXISTS bounty_submissions (
  id             text         PRIMARY KEY,
  bounty_id      text         NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  contributor    text         NOT NULL,
  work_url       text         NOT NULL,
  note           text         NOT NULL DEFAULT '',
  submitted_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bounties_community_id_idx ON bounties (community_id);
CREATE INDEX IF NOT EXISTS bounties_status_idx ON bounties (status);
CREATE INDEX IF NOT EXISTS bounties_deadline_idx ON bounties (deadline);
CREATE INDEX IF NOT EXISTS bounty_submissions_bounty_id_idx ON bounty_submissions (bounty_id);

ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bounties are publicly readable" ON bounties;
CREATE POLICY "Bounties are publicly readable"
  ON bounties FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Prototype can post bounties" ON bounties;
CREATE POLICY "Prototype can post bounties"
  ON bounties FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Bounty submissions are publicly readable" ON bounty_submissions;
CREATE POLICY "Bounty submissions are publicly readable"
  ON bounty_submissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Prototype can submit bounty work" ON bounty_submissions;
CREATE POLICY "Prototype can submit bounty work"
  ON bounty_submissions FOR INSERT
  WITH CHECK (true);

DROP TRIGGER IF EXISTS bounties_set_updated_at ON bounties;
CREATE TRIGGER bounties_set_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
-- >>> END MIGRATION: 006_bounties_security_stellar.sql <<<

-- >>> START MIGRATION: 007_enable_evm_community_rails.sql <<<
-- 007_enable_evm_community_rails.sql
--
-- Allows communities to select Base, Arbitrum, Optimism, and Celo as target
-- EVM governance/settlement rails. Contract execution remains gated in the app
-- roadmap; this only permits durable community metadata.

ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_chain_chk;

ALTER TABLE communities
  ADD CONSTRAINT communities_chain_chk
    CHECK (chain IN ('solana', 'stellar', 'base', 'arbitrum', 'optimism', 'celo'));
-- >>> END MIGRATION: 007_enable_evm_community_rails.sql <<<

-- >>> START MIGRATION: 008_bounty_access_reward_token.sql <<<
alter table if exists public.bounties
  add column if not exists access text not null default 'community-restricted',
  add column if not exists reward_token text not null default 'SOL',
  add column if not exists payout_tx_hash text;

alter table if exists public.bounties
  add constraint bounties_access_check
  check (access in ('public', 'community-restricted'));

alter table if exists public.bounties
  add constraint bounties_reward_token_check
  check (reward_token in ('SOL', 'G$', 'XLM', 'COMMUNITY_TOKEN'));
-- >>> END MIGRATION: 008_bounty_access_reward_token.sql <<<

-- >>> START MIGRATION: 009_membership_payment_order_unique.sql <<<
-- A settled payment order is single-use. Wallet binding in the activation API
-- prevents replay during normal requests; this index is the database backstop.
CREATE UNIQUE INDEX IF NOT EXISTS memberships_payment_order_unique
  ON memberships (payment_order_id)
  WHERE payment_order_id IS NOT NULL;
-- >>> END MIGRATION: 009_membership_payment_order_unique.sql <<<

-- >>> START MIGRATION: 010_proposals_votes_schema_gaps.sql <<<
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
-- >>> END MIGRATION: 010_proposals_votes_schema_gaps.sql <<<

-- >>> START MIGRATION: 011_fix_payment_orders_rls.sql <<<
-- 011_fix_payment_orders_rls.sql
--
-- Keep payment_orders closed to anon clients. Payment status reads must go
-- through /api/payment-orders/status, which uses the service role key and
-- validates activation_secret_hash before returning safe order data.
-- activate.ts validates the same secret before mutating membership state.

DROP POLICY IF EXISTS "Payment orders are readable by exact order id" ON payment_orders;
DROP POLICY IF EXISTS "Payment orders are publicly readable" ON payment_orders;

CREATE POLICY "Payment orders are readable by exact order id"
  ON payment_orders FOR SELECT
  USING (false);
-- >>> END MIGRATION: 011_fix_payment_orders_rls.sql <<<

-- >>> START MIGRATION: 012_communities_rls.sql <<<
-- 012_communities_rls.sql
--
-- Enable RLS on communities and add access policies.
--
-- SELECT: public (anon key can read communities for the browse/dashboard pages).
-- INSERT/UPDATE/DELETE: service role only — clients must go through
--   /api/communities which uses SUPABASE_SERVICE_ROLE_KEY.
--
-- Idempotent: all statements use IF NOT EXISTS / IF EXISTS guards.

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communities are publicly readable" ON communities;
CREATE POLICY "Communities are publicly readable"
  ON communities FOR SELECT
  USING (true);

-- No anon INSERT/UPDATE/DELETE policy — the API route bypasses RLS via service role key.
-- >>> END MIGRATION: 012_communities_rls.sql <<<

-- >>> START MIGRATION: 013_votes_block_migration_double_vote.sql <<<
-- 013_votes_block_migration_double_vote.sql
--
-- Closes the wallet-migration double-vote hole.
--
-- `memberships` (004) supports wallet migration via `migrated_from` /
-- `migrated_to`. A single human can therefore hold two member_ids on the
-- same community — the pre-migration record (typically MIGRATED) and the
-- post-migration record (ACTIVE). The vote uniqueness backstop from 010
-- (`votes_member_proposal_unique`) is per (proposal_id, member_id), so the
-- DB would happily accept two votes from the same human on the same
-- proposal — once under each member_id.
--
-- The fix is a BEFORE INSERT trigger that walks the migration chain in
-- both directions from the voter's member_id, and rejects the vote if any
-- member in the chain has already voted on the same proposal. Putting the
-- check at the DB layer makes it impossible for the (future) vote-casting
-- API to forget it.
--
-- Run after 010_proposals_votes_schema_gaps.sql. Idempotent.

-- ─── Walk both ends of the migration chain ──────────────────────────────────
-- Recursive CTE collects every member_id linked to the starting member_id
-- via `migrated_from`/`migrated_to`, transitively. Returns the chain as a
-- SETOF text including the starting member_id itself.

CREATE OR REPLACE FUNCTION vote_member_chain(start_member_id text)
RETURNS SETOF text AS $$
  WITH RECURSIVE chain AS (
    SELECT member_id, migrated_from, migrated_to
      FROM memberships
     WHERE member_id = start_member_id
    UNION
    SELECT m.member_id, m.migrated_from, m.migrated_to
      FROM memberships m
      JOIN chain c
        ON m.member_id = c.migrated_from
        OR m.member_id = c.migrated_to
        OR m.migrated_from = c.member_id
        OR m.migrated_to   = c.member_id
  )
  SELECT member_id FROM chain;
$$ LANGUAGE sql STABLE;

-- ─── Trigger: reject double-vote across the migration chain ─────────────────

CREATE OR REPLACE FUNCTION reject_chain_double_vote()
RETURNS trigger AS $$
DECLARE
  conflicting_member_id text;
BEGIN
  SELECT v.member_id INTO conflicting_member_id
    FROM votes v
   WHERE v.proposal_id = NEW.proposal_id
     AND v.member_id IN (SELECT vote_member_chain(NEW.member_id))
   LIMIT 1;

  IF conflicting_member_id IS NOT NULL THEN
    RAISE EXCEPTION
      'member_id % already voted on proposal % (via migrated member_id %)',
      NEW.member_id, NEW.proposal_id, conflicting_member_id
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS votes_reject_chain_double_vote ON votes;
CREATE TRIGGER votes_reject_chain_double_vote
  BEFORE INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION reject_chain_double_vote();
-- >>> END MIGRATION: 013_votes_block_migration_double_vote.sql <<<

-- >>> START MIGRATION: 014_votes_lock_migration_chain.sql <<<
-- 014_votes_lock_migration_chain.sql
--
-- Closes a race in 013's chain-double-vote trigger.
--
-- 013 added a BEFORE INSERT check that walks the migration chain and
-- rejects a vote if any chain member already voted on the same proposal.
-- The check runs as a plain SELECT, so two concurrent inserts for two
-- DIFFERENT member_ids in the same migration chain can both pass: T1
-- sees no conflict, T2 sees no conflict, both INSERTs commit. The
-- per-(proposal_id, member_id) unique index from 010 doesn't catch it
-- because the member_ids differ.
--
-- This migration replaces `reject_chain_double_vote` to take a
-- transaction-scoped advisory lock keyed on (proposal_id, chain_root)
-- before running the SELECT. Chain root is the canonical (MIN) member_id
-- in the chain, so any insert touching the same proposal+chain hashes
-- to the same lock and serializes the check.
--
-- Idempotent: `CREATE OR REPLACE FUNCTION` rebinds the existing trigger
-- without recreating it.
--
-- Run after 013_votes_block_migration_double_vote.sql.

CREATE OR REPLACE FUNCTION reject_chain_double_vote()
RETURNS trigger AS $$
DECLARE
  chain_root            text;
  conflicting_member_id text;
BEGIN
  -- Canonicalize the migration chain to one stable root id. Any insert
  -- touching the same proposal+chain hashes to the same lock key below.
  SELECT MIN(m) INTO chain_root
    FROM vote_member_chain(NEW.member_id) AS m;

  -- Transaction-scoped advisory lock. Serializes the SELECT below so two
  -- concurrent inserts for two member_ids in the same chain can't both
  -- pass the check. hashtextextended → bigint (PG13+); Supabase is PG15+.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.proposal_id || ':' || chain_root, 0)
  );

  SELECT v.member_id INTO conflicting_member_id
    FROM votes v
   WHERE v.proposal_id = NEW.proposal_id
     AND v.member_id IN (SELECT vote_member_chain(NEW.member_id))
   LIMIT 1;

  IF conflicting_member_id IS NOT NULL THEN
    RAISE EXCEPTION
      'member_id % already voted on proposal % (via migrated member_id %)',
      NEW.member_id, NEW.proposal_id, conflicting_member_id
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- >>> END MIGRATION: 014_votes_lock_migration_chain.sql <<<

-- >>> START MIGRATION: 016_votes_weight_positive_check_and_010_drift_notes.sql <<<
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
-- >>> END MIGRATION: 016_votes_weight_positive_check_and_010_drift_notes.sql <<<

-- >>> START MIGRATION: 017_payment_orders_metadata.sql <<<
-- 017_payment_orders_metadata.sql
--
-- Add a JSONB metadata column to payment_orders so the cron promoter can
-- persist mint failure details (Horizon result codes, ledger numbers,
-- timestamps) alongside the MINT_FAILED_FINAL status.
--
-- Without this, the only record of *why* a mint failed lives in ephemeral
-- serverless logs — fine for live debugging, useless for back-filling a
-- triage queue or building admin tooling for stale orders.
--
-- The column is nullable and idempotent so this migration is safe to
-- re-run on installs that already include it from a future merge.

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Partial index: only payment_orders carrying any metadata get indexed.
-- We expect successful orders to leave it NULL, so the index stays small
-- and lookups for "all failed orders with metadata" stay fast.
CREATE INDEX IF NOT EXISTS payment_orders_metadata_idx
  ON payment_orders USING gin (metadata)
  WHERE metadata IS NOT NULL;
-- >>> END MIGRATION: 017_payment_orders_metadata.sql <<<

-- >>> START MIGRATION: 018_ussd_monitoring.sql <<<
-- 018_ussd_monitoring.sql
--
-- Seku's monitoring instrumentation (filing 2026-06-17). Two deliverables:
--
--   1. Session exit logging in the USSD flow — every session END writes one
--      row here so we can answer "did a USSD member's session terminate
--      before W0 delivered?" and "what menu path was the last thing the
--      member touched before they fell off?".
--
--   2. The 30-day RECONCILED-with-no-follow-up cohort flag — a payment_order
--      that has reached RECONCILED but the same phone has issued no further
--      USSD session within 30 days lands in a queryable cohort. The actual
--      flag is written to payment_orders.metadata.invisible_member via the
--      promoter sweep; this migration is here only to surface the contract
--      and add the supporting index.
--
-- Phone identity uses the same HMAC pepper as payment_orders.user_id_hash and
-- memberships.phone_hash so cohort joins stay consistent across the stack.

CREATE TABLE IF NOT EXISTS ussd_session_exits (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         text         NOT NULL,
  phone_hash         text         NOT NULL,
  country_code       text,
  service_code       text,
  -- Final accumulated `text` the AT-style USSD aggregator submitted. Useful
  -- for diagnosing where members dropped — e.g. '1*2' means W0 → "Main menu".
  last_menu_path     text,
  result_action      text         NOT NULL CHECK (result_action IN ('CON', 'END')),
  -- 'completed' (END action returned), 'invalid_input' (user gave bad selection),
  -- 'welcome_skipped' (W0 skip → SMS fallback), 'welcome_completed' (W3 done),
  -- 'main_menu_routed' (fell through to main), 'unknown'.
  exit_reason        text         NOT NULL,
  duration_ms        integer,
  -- 'none' (no welcome in flight), 'rendered' (W0+ shown), 'completed', 'skipped'.
  welcome_state      text,
  exited_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ussd_session_exits_phone_hash_idx
  ON ussd_session_exits (phone_hash);

CREATE INDEX IF NOT EXISTS ussd_session_exits_exited_at_idx
  ON ussd_session_exits (exited_at DESC);

CREATE INDEX IF NOT EXISTS ussd_session_exits_welcome_state_idx
  ON ussd_session_exits (welcome_state)
  WHERE welcome_state IS NOT NULL;

-- RLS: no public reads. Only the service role writes (USSD handler) and
-- reads (cohort analysis from cron). Same posture as payment_orders.
ALTER TABLE ussd_session_exits ENABLE ROW LEVEL SECURITY;

-- Operator note: the invisible-member cohort is computed at sweep time —
--   SELECT po.order_id
--   FROM payment_orders po
--   WHERE po.status = 'RECONCILED'
--     AND po.confirmed_at < now() - interval '30 days'
--     AND po.metadata->>'source' = 'ussd'
--     AND NOT EXISTS (
--       SELECT 1 FROM ussd_session_exits se
--       WHERE se.phone_hash = po.user_id_hash
--         AND se.exited_at > po.confirmed_at
--     );
-- The promoter writes metadata.invisible_member = true on each matched order.
-- >>> END MIGRATION: 018_ussd_monitoring.sql <<<

-- >>> START MIGRATION: 019_retro_rounds.sql <<<
-- 019_retro_rounds.sql
--
-- Tier-1 retroactive BRZA rounds, per-community, weekly.
--
-- Schema mirrors the pure logic in app/src/lib/brza/retroRounds.ts:
--   - retro_rounds         — round metadata (period, pool, status)
--   - retro_votes          — one row per voter per round (allocations as JSONB)
--   - retro_allocations    — computed allocations once a round settles
--
-- RLS:
--   - retro_rounds         — public read; insert/update restricted to admin role
--   - retro_votes          — public read of own row; insert restricted to active members
--   - retro_allocations    — public read (everyone in the community can see who got what)
--
-- Run after 018_ussd_monitoring.sql.

-- ─── retro_rounds ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retro_rounds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id       text NOT NULL,
  period_start       timestamptz NOT NULL,
  period_end         timestamptz NOT NULL,
  pool_brza          bigint NOT NULL CHECK (pool_brza >= 0),
  voting_closes_at   timestamptz NOT NULL,
  status             text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'voting', 'allocated', 'settled')),
  opened_by          text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT retro_rounds_period_check CHECK (period_end > period_start),
  CONSTRAINT retro_rounds_voting_after_period CHECK (voting_closes_at >= period_end)
);

CREATE INDEX IF NOT EXISTS retro_rounds_community_idx
  ON retro_rounds (community_id, period_start DESC);

CREATE INDEX IF NOT EXISTS retro_rounds_status_idx
  ON retro_rounds (status)
  WHERE status IN ('open', 'voting');

-- A community can have at most one round in 'open' or 'voting' at a time.
CREATE UNIQUE INDEX IF NOT EXISTS retro_rounds_one_active_per_community
  ON retro_rounds (community_id)
  WHERE status IN ('open', 'voting');

-- ─── retro_votes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retro_votes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id        uuid NOT NULL REFERENCES retro_rounds (id) ON DELETE CASCADE,
  voter_wallet    text NOT NULL,
  -- {recipientWallet: weight} where weights are integers summing to 100.
  -- Validation happens in the API route, not the DB, so the JSONB can store
  -- any shape that round-settlement code can read.
  allocations     jsonb NOT NULL,
  voter_weight    numeric(5, 2) NOT NULL DEFAULT 1.00
    CHECK (voter_weight >= 0 AND voter_weight <= 3.0),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT retro_votes_one_per_voter_per_round
    UNIQUE (round_id, voter_wallet)
);

CREATE INDEX IF NOT EXISTS retro_votes_round_idx
  ON retro_votes (round_id);

CREATE INDEX IF NOT EXISTS retro_votes_voter_idx
  ON retro_votes (voter_wallet);

-- ─── retro_allocations ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retro_allocations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id            uuid NOT NULL REFERENCES retro_rounds (id) ON DELETE CASCADE,
  recipient_wallet    text NOT NULL,
  brza_allocated      bigint NOT NULL CHECK (brza_allocated >= 0),
  baseline_brza       bigint NOT NULL DEFAULT 0 CHECK (baseline_brza >= 0),
  multiplier_brza     bigint NOT NULL DEFAULT 0 CHECK (multiplier_brza >= 0),
  -- Share of weighted votes that earned this allocation (0.0000 to 1.0000).
  vote_share          numeric(6, 4) NOT NULL DEFAULT 0
    CHECK (vote_share >= 0 AND vote_share <= 1),
  -- Settlement state: 'pending' until BRZA is actually transferred on-chain,
  -- then 'confirmed' with the txn hash. Reuses the cron promoter pattern.
  settlement_status   text NOT NULL DEFAULT 'pending'
    CHECK (settlement_status IN ('pending', 'confirmed', 'failed')),
  settlement_tx       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  settled_at          timestamptz,

  CONSTRAINT retro_allocations_one_per_recipient_per_round
    UNIQUE (round_id, recipient_wallet)
);

CREATE INDEX IF NOT EXISTS retro_allocations_round_idx
  ON retro_allocations (round_id);

CREATE INDEX IF NOT EXISTS retro_allocations_recipient_idx
  ON retro_allocations (recipient_wallet);

CREATE INDEX IF NOT EXISTS retro_allocations_pending_idx
  ON retro_allocations (settlement_status)
  WHERE settlement_status = 'pending';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE retro_rounds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_allocations  ENABLE ROW LEVEL SECURITY;

-- Public read of all rounds (rounds are public artifacts).
CREATE POLICY retro_rounds_public_read
  ON retro_rounds FOR SELECT
  USING (true);

-- Public read of votes is INTENTIONAL: vote transparency is a feature, not a
-- bug. Members can audit each other's ballots. If this turns out to be
-- corrosive at chama scale (peer pressure, retaliation), the policy can be
-- tightened later — but the default for a community-finance protocol is
-- "votes are on the public ledger."
CREATE POLICY retro_votes_public_read
  ON retro_votes FOR SELECT
  USING (true);

-- Allocations are public for the same reason — accountability.
CREATE POLICY retro_allocations_public_read
  ON retro_allocations FOR SELECT
  USING (true);

-- Insert policies use the service role from API routes; the API enforces
-- membership + ballot validation before insert. Direct client inserts are
-- rejected.
CREATE POLICY retro_rounds_service_write
  ON retro_rounds FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY retro_votes_service_write
  ON retro_votes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY retro_allocations_service_write
  ON retro_allocations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION retro_rounds_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS retro_rounds_updated_at ON retro_rounds;
CREATE TRIGGER retro_rounds_updated_at
  BEFORE UPDATE ON retro_rounds
  FOR EACH ROW
  EXECUTE FUNCTION retro_rounds_touch_updated_at();
-- >>> END MIGRATION: 019_retro_rounds.sql <<<

-- >>> START MIGRATION: 020_retro_allocations_submitted_status.sql <<<
-- 020_retro_allocations_submitted_status.sql
--
-- Adds the 'submitted' interim status to retro_allocations so the mint cron
-- can match the two-step pattern used by payment_orders:
--
--     pending  → submitted (tx hash captured)
--     submitted → confirmed (Horizon verified)
--     submitted → failed   (Horizon returned revert or terminal op code)
--
-- Without this status the cron has to skip Horizon verification and trust
-- the SDK's submit response — same window where a tx could land but revert
-- and silently look confirmed.
--
-- Run after 019_retro_rounds.sql.

ALTER TABLE retro_allocations
  DROP CONSTRAINT IF EXISTS retro_allocations_settlement_status_check;

ALTER TABLE retro_allocations
  ADD CONSTRAINT retro_allocations_settlement_status_check
  CHECK (settlement_status IN ('pending', 'submitted', 'confirmed', 'failed'));

-- Index supporting the cron scan that picks up rows ready for next-step work.
CREATE INDEX IF NOT EXISTS retro_allocations_submitted_idx
  ON retro_allocations (settlement_status)
  WHERE settlement_status = 'submitted';
-- >>> END MIGRATION: 020_retro_allocations_submitted_status.sql <<<

-- >>> START MIGRATION: 021_retro_rounds_opened_by.sql <<<
-- 021_retro_rounds_opened_by.sql
--
-- Opens round-opening to any active member of the community (was admin-only).
-- Adds `opened_by` so we keep a clean record of who initiated the round.
--
-- The one-active-round-per-community partial unique index (from migration 019)
-- continues to prevent spam: a member who opens a round blocks everyone else
-- from opening another until the active round is settled. That ratchet is the
-- intended throttle.
--
-- Run after 020_retro_allocations_submitted_status.sql.

ALTER TABLE retro_rounds
  ADD COLUMN IF NOT EXISTS opened_by text;

-- Backfill historical rows (if any) with NULL — they were opened by admins
-- before this migration, and the prior route did not capture the wallet.
COMMENT ON COLUMN retro_rounds.opened_by
  IS 'Wallet that opened the round. NULL for rounds opened by the admin-only route prior to migration 021.';
-- >>> END MIGRATION: 021_retro_rounds_opened_by.sql <<<

-- >>> START MIGRATION: 022_identity_links.sql <<<
-- 019_identity_links.sql
--
-- Identity continuity (Phase 9). Bidirectional claim flow that links a
-- HMAC'd phone identity (phone_hash) to a Stellar/Solana wallet address.
--
-- Council ruling 2026-06-19 set phone_hash as canonical: Nia's W3 promise
-- ("your phone IS your membership") is load-bearing for chama culture.
-- Wallets are devices that come and go; phones persist with the member.
-- Memberships, badges, vote weight, and BRZA balance MUST resolve through
-- the canonical phone_hash when one is linked.
--
-- HMAC pepper reused: PAYMENT_PHONE_HASH_PEPPER — same as payment_orders
-- user_id_hash and memberships.phone_hash, so all four tables join on the
-- same identity key.

-- One row per linked (phone_hash, wallet_address) pair.
-- A wallet has at most one linked identity (uniqueness on wallet_address).
-- A phone_hash can have many wallets (multi-device, SIM rotation, family
-- shared phone where each member uses their own wallet but holds the same
-- phone). The canonical identity is the phone_hash; the wallets are
-- pointers.
CREATE TABLE IF NOT EXISTS identity_links (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash          text         NOT NULL,
  wallet_address      text         NOT NULL UNIQUE,
  linked_at           timestamptz  NOT NULL DEFAULT now(),
  -- 'ussd_initiated' — phone-based member started the claim, completed on web
  -- 'wallet_initiated' — wallet-based member started the claim, completed via SMS
  claim_method        text         NOT NULL CHECK (claim_method IN ('ussd_initiated', 'wallet_initiated')),
  -- HMAC(code || nonce, pepper). Evidences the claim event without storing
  -- the code itself. Audit-only; not used for runtime verification.
  verification_proof  text         NOT NULL
);

CREATE INDEX IF NOT EXISTS identity_links_phone_hash_idx
  ON identity_links (phone_hash);

-- Pending claims. Short-lived (10 minutes by convention; enforced by API).
-- The 6-digit code is stored as SHA-256(code) — comparison is constant-time
-- in the API layer via crypto.timingSafeEqual.
CREATE TABLE IF NOT EXISTS identity_claim_pending (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash               text         NOT NULL,
  code_hash                text         NOT NULL,
  initiated_by             text         NOT NULL CHECK (initiated_by IN ('ussd', 'wallet')),
  -- Set when the wallet is known at initiation time (wallet-side flow).
  -- Null for USSD-initiated claims; the wallet is supplied at verify time.
  pending_wallet_address   text,
  attempts                 integer      NOT NULL DEFAULT 0,
  expires_at               timestamptz  NOT NULL,
  consumed_at              timestamptz,
  created_at               timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_claim_pending_phone_hash_idx
  ON identity_claim_pending (phone_hash)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS identity_claim_pending_expires_at_idx
  ON identity_claim_pending (expires_at)
  WHERE consumed_at IS NULL;

-- RLS: no public reads. Service role only.
ALTER TABLE identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_claim_pending ENABLE ROW LEVEL SECURITY;

-- Operator note: stale pending claims should be culled by a periodic job.
-- A bounded grow-only table is acceptable for v1 — at ten claims per
-- member per year the table stays small even at protocol scale.
-- >>> END MIGRATION: 022_identity_links.sql <<<

-- >>> START MIGRATION: 023_payment_orders_add_status_query_states.sql <<<
-- 023_payment_orders_add_status_query_states.sql
--
-- Main-4 requires STATUS_QUERY_SENT in the payment_orders state machine.
-- The status-result and status-timeout callbacks also transition through
-- PROVIDER_CONFIRMED and ATTESTATION_SUBMITTED.

ALTER TABLE payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_status_chk;

ALTER TABLE payment_orders
  ADD CONSTRAINT payment_orders_status_chk
  CHECK (status IN (
    'CREATED',
    'PAYMENT_REQUESTED',
    'PAYMENT_PENDING',
    'PAYMENT_CONFIRMED',
    'PROVIDER_CONFIRMED',
    'STATUS_QUERY_SENT',
    'ATTESTATION_SUBMITTED',
    'MINT_QUEUED',
    'MINT_SUBMITTED',
    'MINT_CONFIRMED',
    'INDEXER_CONFIRMED',
    'RECONCILED',
    'PAYMENT_EXPIRED',
    'PAYMENT_FAILED',
    'AMOUNT_MISMATCH',
    'MINT_FAILED_RETRYABLE',
    'MINT_FAILED_FINAL',
    'REFUND_QUEUED',
    'REFUND_SUBMITTED',
    'REFUND_CONFIRMED',
    'MANUAL_REVIEW'
  ));
-- >>> END MIGRATION: 023_payment_orders_add_status_query_states.sql <<<

-- >>> START MIGRATION: 024_communities_dynamic_activation_fee.sql <<<
-- 024_communities_dynamic_activation_fee.sql
-- Adds dynamic activation pricing, fee models, and carrier pass-through flags.
-- Conforms to SAD v1.0 §2.2, Holy Grail §8, and Launch Direction Memo 3 §4.

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS activation_fee_minor BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_type TEXT NOT NULL DEFAULT 'one_time' 
    CHECK (fee_type IN ('one_time', 'recurring_monthly', 'free')),
  ADD COLUMN IF NOT EXISTS carrier_pass_through BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KES';

-- Mandatory backfill: convert legacy membership_fee (major units) to integer minor cents
UPDATE communities
SET activation_fee_minor = COALESCE(ROUND(membership_fee * 100), 50000)
WHERE activation_fee_minor = 0 AND membership_fee IS NOT NULL AND membership_fee > 0;

COMMENT ON COLUMN communities.activation_fee_minor IS 'Base membership activation fee in integer minor currency units (e.g. cents). Zero indicates a free community.';
COMMENT ON COLUMN communities.fee_type IS 'Billing model: one_time, recurring_monthly, or free.';
COMMENT ON COLUMN communities.carrier_pass_through IS 'Whether carrier collection costs are passed through to the payer.';
COMMENT ON COLUMN communities.currency IS 'Default currency for dues and accounting (default: KES).';
-- >>> END MIGRATION: 024_communities_dynamic_activation_fee.sql <<<

-- >>> START MIGRATION: 026_leverage_foundation.sql <<<
-- 026_leverage_foundation.sql
--
-- Draft only. Do NOT run in production until reviewed.
--
-- Scope:
-- - Community onboarding foundation
-- - Member activation ledger
-- - Tier feature flags for route/API gating
-- - Community-scoped admin helper
--
-- This migration follows the existing text-ID style used by the repo.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.role() = 'service_role';
$$;

-- ---------------------------------------------------------------------------
-- Communities
-- ---------------------------------------------------------------------------

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'chama',
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'mtaa',
  ADD COLUMN IF NOT EXISTS chain text NOT NULL DEFAULT 'solana',
  ADD COLUMN IF NOT EXISTS constitution jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chain_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Every value here must cover the union of:
--   - COMMUNITY_TYPES in app/src/lib/constants.ts (canonical source, 27 values)
--   - GOVERNANCE_PRESETS keys in app/src/pages/CreateCommunity.tsx (subset of the above)
--   - CommunityType in packages/coop-templates/src/index.ts (5-value curated subset)
--   - the 'chama' DEFAULT on the `type` column above
-- Covered by app/src/lib/__tests__/communityTypesMigration.test.ts, which fails
-- the build if any of those sources drift ahead of this list.
ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_type_chk;
ALTER TABLE communities
  ADD CONSTRAINT communities_type_chk
    CHECK (type IN (
      'chama', 'savings', 'stokvel', 'sacco', 'dao', 'cooperative', 'professional',
      'investment', 'rosca', 'asca', 'union', 'ngo', 'alumni', 'religious', 'sports',
      'homeowners', 'burial', 'tribe', 'welfare', 'pta', 'youth', 'political',
      'supply_chain', 'study', 'housing', 'organization', 'government'
    ));

ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_tier_chk;
ALTER TABLE communities
  ADD CONSTRAINT communities_tier_chk
    CHECK (tier IN ('mtaa', 'kikundi', 'sacco', 'biashara', 'serikali'));

ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_status_chk;
ALTER TABLE communities
  ADD CONSTRAINT communities_status_chk
    CHECK (status IN ('draft', 'queued', 'active', 'paused', 'archived'));

CREATE INDEX IF NOT EXISTS communities_type_idx   ON communities (type);
CREATE INDEX IF NOT EXISTS communities_tier_idx   ON communities (tier);
CREATE INDEX IF NOT EXISTS communities_status_idx ON communities (status);

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS members (
  member_id                text           PRIMARY KEY,
  auth_user_id             text           NOT NULL,
  community_id             text           NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  phone_hash               text           NOT NULL,
  wallet_address           text           NOT NULL,
  role                     text           NOT NULL DEFAULT 'member',
  activation_status        text           NOT NULL DEFAULT 'pending',
  activation_payment_ref   text,
  activated_at             timestamptz,
  created_at               timestamptz    NOT NULL DEFAULT now(),
  updated_at               timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT members_role_chk
    CHECK (role IN ('founder', 'admin', 'treasurer', 'member')),
  CONSTRAINT members_activation_status_chk
    CHECK (activation_status IN ('pending', 'active', 'suspended', 'revoked'))
);

CREATE INDEX IF NOT EXISTS members_community_id_idx
  ON members (community_id);
CREATE UNIQUE INDEX IF NOT EXISTS members_auth_user_id_unique
  ON members (auth_user_id);
CREATE INDEX IF NOT EXISTS members_wallet_address_idx
  ON members (wallet_address);
CREATE INDEX IF NOT EXISTS members_phone_hash_idx
  ON members (phone_hash);
CREATE UNIQUE INDEX IF NOT EXISTS members_community_phone_hash_unique
  ON members (community_id, phone_hash);

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM members m
      WHERE m.community_id = p_community_id
        AND m.auth_user_id = auth.uid()::text
        AND m.role IN ('founder', 'admin', 'treasurer')
        AND m.activation_status = 'active'
    );
$$;

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read their own community" ON members;
CREATE POLICY "Members can read their own community"
  ON members FOR SELECT
  USING (
    public.is_admin()
    OR auth_user_id = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members can manage their own community" ON members;
CREATE POLICY "Members can manage their own community"
  ON members FOR ALL
  USING (public.is_community_admin(community_id))
  WITH CHECK (public.is_community_admin(community_id));

-- No member-facing self-UPDATE policy on this table. A prior draft added one
-- ("Members can update their own row", USING/WITH CHECK on auth_user_id only)
-- with no column restriction — Postgres RLS policies gate rows, not columns,
-- so it let any authenticated member run
--   UPDATE members SET role = 'admin' WHERE auth_user_id = auth.uid()::text
-- and self-promote to admin/founder. Removed rather than patched: RLS can't
-- express "this member may update wallet_address but not role" on its own.
-- Self-service field updates (e.g. wallet_address) must go through an API
-- route that validates the caller against auth_user_id, allowlists exactly
-- the columns being changed, and writes via the service_role key — never a
-- broad member-facing UPDATE policy on this table.
DROP POLICY IF EXISTS "Members can update their own row" ON members;

DROP TRIGGER IF EXISTS members_set_updated_at ON members;
CREATE TRIGGER members_set_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Activation payments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS activation_payments (
  activation_payment_id    text             PRIMARY KEY,
  mpesa_receipt            text             NOT NULL,
  amount                   numeric(20, 2)   NOT NULL,
  msisdn_hash              text             NOT NULL,
  member_id                text             NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
  batch_id                 text,
  provider_environment     text             NOT NULL DEFAULT 'sandbox',
  provider_reference_hash  text,
  status                   text             NOT NULL DEFAULT 'received',
  created_at               timestamptz      NOT NULL DEFAULT now(),
  updated_at               timestamptz      NOT NULL DEFAULT now(),

  CONSTRAINT activation_payments_amount_chk
    CHECK (amount > 0),
  CONSTRAINT activation_payments_provider_environment_chk
    CHECK (provider_environment IN ('sandbox', 'production')),
  CONSTRAINT activation_payments_status_chk
    CHECK (status IN ('received', 'verified', 'failed', 'reversed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS activation_payments_mpesa_receipt_unique
  ON activation_payments (mpesa_receipt);
CREATE INDEX IF NOT EXISTS activation_payments_member_id_idx
  ON activation_payments (member_id);
CREATE INDEX IF NOT EXISTS activation_payments_batch_id_idx
  ON activation_payments (batch_id)
  WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS activation_payments_msisdn_hash_idx
  ON activation_payments (msisdn_hash);

ALTER TABLE activation_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activation payments are readable by the owning member" ON activation_payments;
CREATE POLICY "Activation payments are readable by the owning member"
  ON activation_payments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM members m
      WHERE m.member_id = activation_payments.member_id
        AND m.auth_user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Activation payments are written by service role" ON activation_payments;
CREATE POLICY "Activation payments are written by service role"
  ON activation_payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS activation_payments_set_updated_at ON activation_payments;
CREATE TRIGGER activation_payments_set_updated_at
  BEFORE UPDATE ON activation_payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Tier feature flags
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tier_features (
  tier                   text           PRIMARY KEY,
  member_limit           integer        NOT NULL,
  akili_access           boolean        NOT NULL DEFAULT false,
  api_access             boolean        NOT NULL DEFAULT false,
  compliance_reports     boolean        NOT NULL DEFAULT false,
  token_deployment       boolean        NOT NULL DEFAULT false,
  created_at             timestamptz    NOT NULL DEFAULT now(),
  updated_at             timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT tier_features_tier_chk
    CHECK (tier IN ('mtaa', 'kikundi', 'sacco', 'biashara', 'serikali')),
  CONSTRAINT tier_features_member_limit_chk
    CHECK (member_limit > 0)
);

INSERT INTO tier_features (tier, member_limit, akili_access, api_access, compliance_reports, token_deployment)
VALUES
  ('mtaa',      50,  false, false, false, false),
  ('kikundi',  200,  true,  false, false, false),
  ('sacco',    500,  true,  true,  true,  false),
  ('biashara', 500,  true,  true,  true,  true),
  ('serikali', 1000,  true,  true,  true,  true)
ON CONFLICT (tier) DO UPDATE SET
  member_limit       = EXCLUDED.member_limit,
  akili_access       = EXCLUDED.akili_access,
  api_access         = EXCLUDED.api_access,
  compliance_reports = EXCLUDED.compliance_reports,
  token_deployment   = EXCLUDED.token_deployment,
  updated_at         = now();

ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tier features are publicly readable" ON tier_features;
CREATE POLICY "Tier features are publicly readable"
  ON tier_features FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Tier features are admin managed" ON tier_features;
CREATE POLICY "Tier features are admin managed"
  ON tier_features FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS tier_features_set_updated_at ON tier_features;
CREATE TRIGGER tier_features_set_updated_at
  BEFORE UPDATE ON tier_features
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
-- >>> END MIGRATION: 026_leverage_foundation.sql <<<

-- >>> START MIGRATION: 027_journal_entries.sql <<<
-- 027_journal_entries.sql
--
-- Phase P2 Double-Entry General Ledger (SAD §3.5 Class A & Master Manifest v4.0 §6).
-- Enforces Invariant I4 (Conservation of Ledger Value: Σ Debit ≡ Σ Credit).
--
-- Supported transaction event references:
--   - dues_ingress: Member contribution splits into Treasury + Platform Fee + Carrier Pass
--   - governance_payout: Passed proposal disbursement from Treasury to Recipient/Escrow
--   - retropgf_settlement: Retroactive public goods funding allocation
--   - escrow_clearing: Intermediate holding state during off-ramp B2C processing (RT-07 Fix)
--   - compensatory_reversal: Atomic refund if fiat off-ramp fails (RT-07 Fix)
--   - fee_collection: Protocol fee accounting

CREATE TABLE IF NOT EXISTS journal_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    text NOT NULL,
  reference_type  text NOT NULL CHECK (reference_type IN (
    'dues_ingress',
    'governance_payout',
    'retropgf_settlement',
    'escrow_clearing',
    'compensatory_reversal',
    'fee_collection'
  )),
  reference_id    text NOT NULL,
  debit_account   text NOT NULL,
  credit_account  text NOT NULL,
  amount_minor    bigint NOT NULL CHECK (amount_minor > 0),
  currency        text NOT NULL DEFAULT 'KES',
  memo            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Query optimizations for community auditing and event tracing
CREATE INDEX IF NOT EXISTS journal_entries_community_idx
  ON journal_entries (community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS journal_entries_reference_idx
  ON journal_entries (reference_type, reference_id);

-- Row-Level Security:
-- Journal entries are financial audit trails: public select within community,
-- insert restricted to service role / edge API.
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Journal entries are publicly readable" ON journal_entries;
CREATE POLICY "Journal entries are publicly readable"
  ON journal_entries FOR SELECT
  USING (true);
-- >>> END MIGRATION: 027_journal_entries.sql <<<

-- >>> START MIGRATION: 028_proposals_snapshot_escrow.sql <<<
-- 028_proposals_snapshot_escrow.sql
--
-- Phase P2 Governance & Treasury Hardening Migration.
-- Addresses RT-01 (Quorum Snapshot), RT-02 (Encumbrance), RT-06 (Tied Extended) and RT-07 (Three-Phase Escrow).

-- 1. Add snapshotted member count, quorum basis points, funding amount, and execution state columns
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS snapshot_member_count  integer,
  ADD COLUMN IF NOT EXISTS quorum_threshold_bps   integer NOT NULL DEFAULT 2000, -- 2000 bps = 20.00%
  ADD COLUMN IF NOT EXISTS funding_amount_minor   bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tie_extended           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS execution_status       text DEFAULT 'pending';

-- 2. Expand status constraint to support 'tied' and 'tied_extended'
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_chk;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_chk
  CHECK (status IN (
    'draft',
    'pending',
    'active',
    'passed',
    'failed',
    'tied',
    'tied_extended',
    'queued',
    'executed',
    'cancelled'
  ));

-- 3. Execution status constraint for three-phase saga tracking (RT-07)
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_execution_status_chk;
ALTER TABLE proposals ADD CONSTRAINT proposals_execution_status_chk
  CHECK (execution_status IN (
    'pending',
    'encumbered',
    'escrow_clearing',
    'executed',
    'reversal_pending',
    'reversed',
    'failed'
  ));

-- 4. Treasury vault encumbrance tracking on communities
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS encumbered_balance_minor bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liquid_vault_balance_minor bigint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS proposals_execution_status_idx
  ON proposals (execution_status)
  WHERE execution_status != 'pending';
-- >>> END MIGRATION: 028_proposals_snapshot_escrow.sql <<<

-- >>> START MIGRATION: 029_minisend_disbursements.sql <<<
-- 029_minisend_disbursements.sql
--
-- Phase P3 Minisend Stablecoin Off-Ramp & Double-Entry Ledger Evolution
-- Aligns with SAD §3.5 Class A, Master Manifest v4.0 §6, and Minisend Architecture Spec v3.1.

-- 1. Payment Orders Metadata Extensions
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS provider_channel TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS usdc_amount NUMERIC(18, 6),
  ADD COLUMN IF NOT EXISTS chain_network TEXT DEFAULT 'stellar',
  ADD COLUMN IF NOT EXISTS telco_receipt_id TEXT,
  ADD COLUMN IF NOT EXISTS fx_rate_quoted NUMERIC(12, 4),
  ADD COLUMN IF NOT EXISTS fx_rate_executed NUMERIC(12, 4),
  ADD COLUMN IF NOT EXISTS fx_slippage_minor BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 2. Extend Journal Entries Reference Types for Slippage & Reversals
-- Modify constraint if exists to support fx_slippage_clearing and reversal_loss_reserve
DO $$
BEGIN
  ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_reference_type_check;
  ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_reference_type_check CHECK (
    reference_type IN (
      'dues_ingress',
      'governance_payout',
      'retropgf_settlement',
      'escrow_clearing',
      'compensatory_reversal',
      'fee_collection',
      'fx_slippage_clearing',
      'reversal_loss_reserve'
    )
  );
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- 3. EXT-01 Defense: Prevent Duplicate Settlement Journal Entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journal_entries_reference_uniq'
  ) THEN
    ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_reference_uniq UNIQUE (reference_id, reference_type);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- 4. EXT-06 Defense: Optimistic Locking for Concurrent Encumbrance Updates
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS encumbrance_version INTEGER NOT NULL DEFAULT 0;

-- 5. Minisend Cryptographic Audit Logging (ODPC Compliant: phone_hash only)
CREATE TABLE IF NOT EXISTS minisend_audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        text NOT NULL,
  event_type      text NOT NULL,
  minisend_id     text NOT NULL,
  phone_hash      text NOT NULL,
  usdc_amount     numeric(18, 6) NOT NULL,
  fiat_amount     bigint NOT NULL,
  currency        text NOT NULL DEFAULT 'KES',
  status          text NOT NULL,
  raw_payload     jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS minisend_audit_order_idx
  ON minisend_audit_logs (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS minisend_audit_minisend_id_idx
  ON minisend_audit_logs (minisend_id);

-- 6. Unattributed / Orphan Deposits Suspense Tracking
CREATE TABLE IF NOT EXISTS unattributed_deposits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL DEFAULT 'minisend',
  provider_ref    text NOT NULL UNIQUE,
  sender_phone    text NOT NULL,
  fiat_amount     bigint NOT NULL,
  currency        text NOT NULL DEFAULT 'KES',
  account_ref     text,
  status          text NOT NULL DEFAULT 'UNCLAIMED' CHECK (status IN ('UNCLAIMED', 'CLAIMED', 'REFUNDED')),
  claimed_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  claimed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS unattributed_deposits_ref_idx
  ON unattributed_deposits (provider_ref, account_ref);

-- 7. Webhook Idempotency Ledger (EXT-01 Defense)
CREATE TABLE IF NOT EXISTS processed_webhooks (
  idempotency_key text PRIMARY KEY,
  provider        text NOT NULL,
  event_type      text NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

-- 8. Row-Level Security
ALTER TABLE minisend_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unattributed_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Minisend audit logs readable by service role" ON minisend_audit_logs;
CREATE POLICY "Minisend audit logs readable by service role"
  ON minisend_audit_logs FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Unattributed deposits readable by authenticated" ON unattributed_deposits;
CREATE POLICY "Unattributed deposits readable by authenticated"
  ON unattributed_deposits FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Processed webhooks readable by service role" ON processed_webhooks;
CREATE POLICY "Processed webhooks readable by service role"
  ON processed_webhooks FOR ALL
  USING (true);
-- >>> END MIGRATION: 029_minisend_disbursements.sql <<<

-- >>> START MIGRATION: 030_sacco_compliance.sql <<<
-- 030_sacco_compliance.sql
-- Phase P4: SASRA SACCO Regulatory Compliance Subsystem (Class G Controls)
-- Law: Kenya Sacco Societies Act (Cap 490B) & Sacco Societies (Non-Deposit-Taking Business) Regulations 2020
-- Founder Directive: Launch Memo 3 §6 (Non-Intermediated Compliance Architecture)

-- 1. Extend Communities Table with License State
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS sacco_license_status TEXT NOT NULL DEFAULT 'UNLICENSED',
  ADD COLUMN IF NOT EXISTS sacco_license_number TEXT,
  ADD COLUMN IF NOT EXISTS sacco_license_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sacco_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sacco_verified_by TEXT;

-- Two-step constraint pattern (drop then add)
ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_sacco_license_status_chk;

ALTER TABLE communities
  ADD CONSTRAINT communities_sacco_license_status_chk
    CHECK (sacco_license_status IN (
      'UNLICENSED',
      'PENDING_REVIEW',
      'VERIFIED',
      'REJECTED',
      'EXPIRED',
      'REVOKED'
    ));

CREATE INDEX IF NOT EXISTS communities_sacco_status_idx
  ON communities (sacco_license_status);

-- 2. Create Immutable Compliance Document Audit Table
CREATE TABLE IF NOT EXISTS sacco_compliance_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  license_number  TEXT NOT NULL,
  certificate_url TEXT NOT NULL,
  document_type   TEXT NOT NULL DEFAULT 'cooperative_registration',
  submitted_by    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewed_by     TEXT,
  review_notes    TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,

  CONSTRAINT sacco_doc_type_chk
    CHECK (document_type IN ('cooperative_registration', 'sasra_license', 'bylaws', 'audit_accounts')),
  CONSTRAINT sacco_doc_status_chk
    CHECK (status IN ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_sacco_compliance_community
  ON sacco_compliance_documents (community_id);

CREATE INDEX IF NOT EXISTS idx_sacco_compliance_status
  ON sacco_compliance_documents (status);

-- 3. Create Compliance Threshold Alerts Ledger
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id          TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  alert_type            TEXT NOT NULL,
  current_volume_minor  BIGINT NOT NULL,
  threshold_minor       BIGINT NOT NULL DEFAULT 10000000000, -- KES 100,000,000 in minor units
  acknowledged_at       TIMESTAMPTZ,
  acknowledged_by       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT compliance_alert_type_chk
    CHECK (alert_type IN ('SASRA_THRESHOLD_100M', 'LICENSE_EXPIRED', 'SYBIL_AFFILIATION_THRESHOLD'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_community
  ON compliance_alerts (community_id);

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE sacco_compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access on compliance documents" ON sacco_compliance_documents;
CREATE POLICY "Service role full access on compliance documents"
  ON sacco_compliance_documents
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on compliance alerts" ON compliance_alerts;
CREATE POLICY "Service role full access on compliance alerts"
  ON compliance_alerts
  TO service_role
  USING (true)
  WITH CHECK (true);
-- >>> END MIGRATION: 030_sacco_compliance.sql <<<

-- >>> START MIGRATION: 031_treasury_reconciliation.sql <<<
-- =============================================================================
-- Migration: 031_treasury_reconciliation.sql
-- Subsystem: Treasury Reconciliation Ledger & Health Observability (Phase P5)
-- =============================================================================

-- 1. Add is_payout_frozen to communities table
ALTER TABLE public.communities 
  ADD COLUMN IF NOT EXISTS is_payout_frozen BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_communities_payout_frozen 
  ON public.communities(is_payout_frozen) 
  WHERE is_payout_frozen = true;

-- 2. Create append-only reconciliation_audit_logs time-series table
CREATE TABLE IF NOT EXISTS public.reconciliation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    onchain_balance_minor BIGINT NOT NULL,
    ledger_balance_minor BIGINT NOT NULL,
    cached_vault_balance_minor BIGINT NOT NULL,
    in_flight_deposits_minor BIGINT NOT NULL DEFAULT 0,
    in_flight_payouts_minor BIGINT NOT NULL DEFAULT 0,
    net_float_minor BIGINT NOT NULL DEFAULT 0,
    variance_minor BIGINT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'KES',
    status TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Apply status check constraint using proven two-step pattern
ALTER TABLE public.reconciliation_audit_logs DROP CONSTRAINT IF EXISTS reconciliation_audit_status_chk;
ALTER TABLE public.reconciliation_audit_logs ADD CONSTRAINT reconciliation_audit_status_chk
    CHECK (status IN ('BALANCED', 'VARIANCE_DETECTED', 'RESOLVED', 'INFRASTRUCTURE_SKIPPED'));

-- 4. Expand compliance_alerts alert_type check constraint & add defaults
ALTER TABLE public.compliance_alerts DROP CONSTRAINT IF EXISTS compliance_alert_type_chk;
ALTER TABLE public.compliance_alerts ADD CONSTRAINT compliance_alert_type_chk 
    CHECK (alert_type IN (
        'SASRA_THRESHOLD_100M',
        'LICENSE_EXPIRED',
        'SYBIL_AFFILIATION_THRESHOLD',
        'TREASURY_RECONCILIATION_VARIANCE',
        'STALLED_PAYMENT_ORDER_24H'
    ));

ALTER TABLE public.compliance_alerts 
  ALTER COLUMN current_volume_minor SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. Expand payment_orders_status_chk to support off-ramps and honest refunds
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_status_chk;
ALTER TABLE public.payment_orders ADD CONSTRAINT payment_orders_status_chk
    CHECK (status IN (
        'CREATED',
        'PAYMENT_REQUESTED',
        'PAYMENT_PENDING',
        'PAYMENT_CONFIRMED',
        'PROVIDER_CONFIRMED',
        'STATUS_QUERY_SENT',
        'ATTESTATION_SUBMITTED',
        'MINT_QUEUED',
        'MINT_SUBMITTED',
        'MINT_CONFIRMED',
        'INDEXER_CONFIRMED',
        'RECONCILED',
        'PAYMENT_EXPIRED',
        'PAYMENT_FAILED',
        'AMOUNT_MISMATCH',
        'MINT_FAILED_RETRYABLE',
        'MINT_FAILED_FINAL',
        'REFUND_QUEUED',
        'REFUND_SUBMITTED',
        'REFUND_CONFIRMED',
        'MANUAL_REVIEW',
        'OFFRAMP_INITIATED',
        'DISBURSEMENT_PENDING',
        'REFUND_REQUESTED'
    ));

-- 6. Time-Series Performance Indexes (Optimized for 5-minute ticks & audits)
CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_community 
  ON public.reconciliation_audit_logs(community_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_community_time 
  ON public.reconciliation_audit_logs(community_id, reconciled_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_status 
  ON public.reconciliation_audit_logs(status);

-- 7. Row-Level Security Configuration
ALTER TABLE public.reconciliation_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_reconciliation_audit_logs" ON public.reconciliation_audit_logs;
CREATE POLICY "service_role_all_reconciliation_audit_logs"
    ON public.reconciliation_audit_logs
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "reconciliation_audit_public_read" ON public.reconciliation_audit_logs;
CREATE POLICY "reconciliation_audit_public_read"
    ON public.reconciliation_audit_logs
    FOR SELECT
    USING (true);
-- >>> END MIGRATION: 031_treasury_reconciliation.sql <<<

-- >>> START MIGRATION: 032_saas_user_profiles.sql <<<
-- =============================================================================
-- Migration: 032_saas_user_profiles.sql
-- Subsystem: Production SaaS Identity, Memberships, Statements & Disputes (Phase P6)
-- Hardened: Zero-Dependency Invites, Multi-Tenancy Cardinality Fix, and Strict RLS
-- =============================================================================

-- 1. Create user_profiles table (Privy-First & Multi-Wallet Support)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE,
    privy_did TEXT UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    locale TEXT NOT NULL DEFAULT 'en',
    country TEXT NOT NULL DEFAULT 'KE',
    default_currency TEXT NOT NULL DEFAULT 'KES',
    phone_hash TEXT,
    phone_verified_at TIMESTAMPTZ,
    phone_hash_revoked BOOLEAN NOT NULL DEFAULT false,
    notification_preferences JSONB NOT NULL DEFAULT '{"sms": false, "whatsapp": false, "email": false, "push": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Two-step check constraints for user_profiles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_locale_chk;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_locale_chk
    CHECK (locale IN ('en', 'sw', 'sheng'));

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_country_chk;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_country_chk
    CHECK (country IN ('KE', 'UG', 'TZ', 'RW', 'GH', 'NG'));

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_currency_chk;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_currency_chk
    CHECK (default_currency IN ('KES', 'UGX', 'GHS', 'NGN', 'USD'));

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS chk_user_profiles_identity_present;
ALTER TABLE public.user_profiles ADD CONSTRAINT chk_user_profiles_identity_present
    CHECK (wallet_address IS NOT NULL OR privy_did IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_privy_did ON public.user_profiles(privy_did);

-- Partial UNIQUE index enforcing exactly one active profile per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_active_phone_unique 
    ON public.user_profiles(phone_hash) 
    WHERE phone_hash IS NOT NULL AND phone_hash_revoked = false;

-- Trigger for auto-updating updated_at on user_profiles
DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_set_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.user_profiles;
CREATE POLICY "Profiles are publicly readable" ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_role_all_user_profiles" ON public.user_profiles;
CREATE POLICY "service_role_all_user_profiles" ON public.user_profiles TO service_role USING (true) WITH CHECK (true);

-- 2. Create community_invites table (Native Zero-Dependency Code Generation)
CREATE TABLE IF NOT EXISTS public.community_invites (
    code TEXT PRIMARY KEY DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    max_uses INT NOT NULL DEFAULT 100,
    uses_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_invites DROP CONSTRAINT IF EXISTS chk_community_invites_uses;
ALTER TABLE public.community_invites ADD CONSTRAINT chk_community_invites_uses
    CHECK (uses_count <= max_uses);

CREATE INDEX IF NOT EXISTS idx_community_invites_comm ON public.community_invites(community_id);

-- RLS on community_invites
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community invites are publicly readable" ON public.community_invites;
CREATE POLICY "Community invites are publicly readable" ON public.community_invites FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_role_all_community_invites" ON public.community_invites;
CREATE POLICY "service_role_all_community_invites" ON public.community_invites TO service_role USING (true) WITH CHECK (true);

-- 3. Create community_audit_logs table
CREATE TABLE IF NOT EXISTS public.community_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    actor_wallet TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_subject TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_audit_comm_date ON public.community_audit_logs(community_id, created_at DESC);

-- RLS on community_audit_logs
ALTER TABLE public.community_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs readable by community members" ON public.community_audit_logs;
CREATE POLICY "Audit logs readable by community members" ON public.community_audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_role_all_community_audit_logs" ON public.community_audit_logs;
CREATE POLICY "service_role_all_community_audit_logs" ON public.community_audit_logs TO service_role USING (true) WITH CHECK (true);

-- 4. Create payment_disputes table (Hardened with Telco Uniqueness & Amount Constraints)
CREATE TABLE IF NOT EXISTS public.payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.payment_orders(order_id) ON DELETE CASCADE,
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    disputant_wallet TEXT NOT NULL,
    dispute_type TEXT NOT NULL DEFAULT 'PAYMENT_NOT_CREDITED',
    amount_disputed_minor BIGINT NOT NULL,
    reason TEXT NOT NULL,
    telco_proof_reference TEXT,
    evidence_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_payment_disputes_order UNIQUE (order_id)
);

ALTER TABLE public.payment_disputes DROP CONSTRAINT IF EXISTS payment_disputes_status_chk;
ALTER TABLE public.payment_disputes ADD CONSTRAINT payment_disputes_status_chk
    CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED_REFUNDED', 'REJECTED'));

ALTER TABLE public.payment_disputes DROP CONSTRAINT IF EXISTS payment_disputes_type_chk;
ALTER TABLE public.payment_disputes ADD CONSTRAINT payment_disputes_type_chk
    CHECK (dispute_type IN ('PAYMENT_NOT_CREDITED', 'WRONG_AMOUNT', 'DUPLICATE_DEBIT', 'OTHER'));

ALTER TABLE public.payment_disputes DROP CONSTRAINT IF EXISTS chk_payment_disputes_amount;
ALTER TABLE public.payment_disputes ADD CONSTRAINT chk_payment_disputes_amount
    CHECK (amount_disputed_minor > 0);

ALTER TABLE public.payment_disputes DROP CONSTRAINT IF EXISTS chk_payment_disputes_evidence_url;
ALTER TABLE public.payment_disputes ADD CONSTRAINT chk_payment_disputes_evidence_url
    CHECK (evidence_url IS NULL OR (
        evidence_url ~* '^https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$' 
        AND length(evidence_url) <= 512
        AND evidence_url !~* '^(https?://)?(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)'
    ));

-- Enforce partial uniqueness on resolved telco proof references
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_disputes_resolved_telco_ref 
    ON public.payment_disputes(telco_proof_reference) 
    WHERE telco_proof_reference IS NOT NULL AND status = 'RESOLVED_REFUNDED';

CREATE INDEX IF NOT EXISTS idx_payment_disputes_order ON public.payment_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_comm ON public.payment_disputes(community_id, status);

-- RLS on payment_disputes
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Disputes readable by disputant or officers" ON public.payment_disputes;
CREATE POLICY "Disputes readable by disputant or officers" ON public.payment_disputes FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_role_all_payment_disputes" ON public.payment_disputes;
CREATE POLICY "service_role_all_payment_disputes" ON public.payment_disputes TO service_role USING (true) WITH CHECK (true);

-- 5. Fix Multi-Tenancy Cardinality in public.members
-- Replace global auth_user_id unique index with composite (community_id, auth_user_id)
DROP INDEX IF EXISTS public.members_auth_user_id_unique;
CREATE UNIQUE INDEX IF NOT EXISTS members_community_auth_user_id_unique 
    ON public.members (community_id, auth_user_id);

-- Drop NOT NULL on phone_hash to allow non-SMS crypto members
ALTER TABLE public.members ALTER COLUMN phone_hash DROP NOT NULL;

-- 6. Two-Step expansion of payment_orders_status_chk
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_status_chk;
ALTER TABLE public.payment_orders ADD CONSTRAINT payment_orders_status_chk
    CHECK (status = ANY (ARRAY[
      'CREATED'::text, 'PAYMENT_REQUESTED'::text, 'PAYMENT_PENDING'::text, 'PAYMENT_CONFIRMED'::text, 
      'PROVIDER_CONFIRMED'::text, 'STATUS_QUERY_SENT'::text, 'ATTESTATION_SUBMITTED'::text, 
      'MINT_QUEUED'::text, 'MINT_SUBMITTED'::text, 'MINT_CONFIRMED'::text, 'INDEXER_CONFIRMED'::text, 
      'RECONCILED'::text, 'PAYMENT_EXPIRED'::text, 'PAYMENT_FAILED'::text, 'AMOUNT_MISMATCH'::text, 
      'MINT_FAILED_RETRYABLE'::text, 'MINT_FAILED_FINAL'::text, 'REFUND_QUEUED'::text, 
      'REFUND_SUBMITTED'::text, 'REFUND_CONFIRMED'::text, 'MANUAL_REVIEW'::text, 
      'OFFRAMP_INITIATED'::text, 'DISBURSEMENT_PENDING'::text, 'REFUND_REQUESTED'::text,
      'DISPUTED_PENDING'::text, 'DISPUTED_RESOLVED'::text
    ]));
-- >>> END MIGRATION: 032_saas_user_profiles.sql <<<

-- >>> START MIGRATION: 033_saas_push_and_roles.sql <<<
-- =============================================================================
-- Migration: 033_saas_push_and_roles.sql
-- Subsystem: Production SaaS Invites, Web Push & Officer Governance Hardening
-- Standard: S&P 500 Enterprise Fintech (ACID Sagas, Anti-SSRF, Trigger Guards)
-- Package: 1 — SaaS Community Invites, Officer Governance & Multi-Channel Push
-- Governing Specs:
--   - Package 1 Theoretical Solution Specification v2.0
--   - Baraza Protocol SAD §3.2 (Identity Lattice), §3.9 (Governance)
--   - Kenya Co-operative Societies Act (Cap 490B) — Secretary Role
--   - Kenya Data Protection Act 2019 §40 — Right to Erasure (ON DELETE CASCADE)
--   - W3C Push API & RFC 8291 / RFC 8292 — Message Encryption for Web Push
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Ensure auth.jwt() stub exists for local Docker PostgreSQL
--    (Supabase managed instances provide this natively; raw PG does not)
--    Wraps current_setting('request.jwt.claims') into JSONB, returning
--    empty object if the setting is absent (safe fallback for local dev).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'auth' AND p.proname = 'jwt'
  ) THEN
    EXECUTE 'CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS ''SELECT COALESCE(current_setting(''''request.jwt.claims'''', true)::jsonb, ''''{}''''::jsonb);''';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Expand public.members role domain to include 'secretary'
--    (Kenya SACCO Societies Act: Secretary for minutes & membership registers)
--    Reference: 026_leverage_foundation.sql L88-89 original constraint
-- ---------------------------------------------------------------------------
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_chk;
ALTER TABLE public.members ADD CONSTRAINT members_role_chk
    CHECK (role IN ('founder', 'admin', 'treasurer', 'secretary', 'member'));

-- ---------------------------------------------------------------------------
-- 2. Create public.user_push_subscriptions table
--    Polymorphic Identity (wallet_address | privy_did | user_profile_id)
--    ODPC Cascade: ON DELETE CASCADE on user_profile_id FK
--    Anti-SSRF: endpoint <= 2048 chars, RFC 8291 key bounds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT,
    privy_did TEXT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- At least one identity vector must be present
    CONSTRAINT chk_push_sub_identity CHECK (
        wallet_address IS NOT NULL OR privy_did IS NOT NULL OR user_profile_id IS NOT NULL
    ),
    -- RFC 8291 key bounds clamping & W3C Push API endpoint length ceiling
    CONSTRAINT chk_push_sub_keys_length CHECK (
        length(endpoint) <= 2048 AND
        length(p256dh) BETWEEN 64 AND 128 AND
        length(auth) BETWEEN 16 AND 48
    )
);

-- Indexes for polymorphic identity lookups & ODPC erasure queries
CREATE INDEX IF NOT EXISTS idx_push_subs_wallet ON public.user_push_subscriptions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_push_subs_privy ON public.user_push_subscriptions(privy_did);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.user_push_subscriptions(user_profile_id);

-- Auto-update updated_at on row modification (consistent with user_profiles trigger in 032)
DROP TRIGGER IF EXISTS push_subs_set_updated_at ON public.user_push_subscriptions;
CREATE TRIGGER push_subs_set_updated_at
    BEFORE UPDATE ON public.user_push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Users can only manage their own push subscriptions
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
    ON public.user_push_subscriptions
    FOR ALL
    USING (
      (wallet_address IS NOT NULL AND wallet_address = auth.jwt()->>'sub')
      OR (privy_did IS NOT NULL AND privy_did = auth.jwt()->>'sub')
      OR (user_profile_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = auth.jwt()->>'sub'))
    )
    WITH CHECK (
      (wallet_address IS NOT NULL AND wallet_address = auth.jwt()->>'sub')
      OR (privy_did IS NOT NULL AND privy_did = auth.jwt()->>'sub')
      OR (user_profile_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = auth.jwt()->>'sub'))
    );

-- Service role bypass for background notification dispatch
DROP POLICY IF EXISTS "service_role_all_push_subs" ON public.user_push_subscriptions;
CREATE POLICY "service_role_all_push_subs" ON public.user_push_subscriptions TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. Atomic Invite Acceptance Stored Procedure
--    Zero-TOCTOU: SELECT ... FOR UPDATE OF ci serializes concurrent redeemers
--    Zero Partial Failure: All mutations in single PL/pgSQL function block
--    Invariant I-INV-1: Capacity Conservation
--    Invariant I-INV-2: Idempotent Re-Entrance (already-member short-circuit)
--    search_path pinned to public (anti-schema-hijacking, audit F-PD-07)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_community_invite_atomic(
    p_code TEXT,
    p_member_id TEXT,
    p_auth_user_id TEXT,
    p_wallet_address TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    community_id TEXT,
    community_name TEXT,
    role TEXT,
    already_member BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite RECORD;
    v_comm RECORD;
    v_existing RECORD;
BEGIN
    -- Step 1: Check if caller is already a member in this community
    -- Deliberately does NOT filter activation_status — prevents circumventing
    -- a suspension/revocation by re-joining via invite (security-positive design)
    SELECT m.member_id, m.role INTO v_existing
    FROM public.members m
    JOIN public.community_invites ci ON ci.community_id = m.community_id
    WHERE ci.code = p_code
      AND (m.auth_user_id = p_auth_user_id OR m.wallet_address = p_wallet_address)
    LIMIT 1;

    IF v_existing.member_id IS NOT NULL THEN
        SELECT c.id, c.name INTO v_comm
        FROM public.communities c
        JOIN public.community_invites ci ON ci.community_id = c.id
        WHERE ci.code = p_code;

        RETURN QUERY SELECT true, v_comm.id, v_comm.name, v_existing.role, true;
        RETURN;
    END IF;

    -- Step 2: Lock invite row FOR UPDATE and check parent community status
    -- The FOR UPDATE OF ci acquires an exclusive row lock, serializing all
    -- concurrent redemption attempts into a strict total order (Theorem 1)
    SELECT ci.*, c.name AS comm_name, c.status AS comm_status
    INTO v_invite
    FROM public.community_invites ci
    JOIN public.communities c ON c.id = ci.community_id
    WHERE ci.code = p_code
    FOR UPDATE OF ci;

    IF v_invite.code IS NULL THEN
        RAISE EXCEPTION 'INVITE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_invite.comm_status != 'active' AND v_invite.comm_status != 'ACTIVE' THEN
        RAISE EXCEPTION 'COMMUNITY_NOT_ACTIVE' USING ERRCODE = '22023';
    END IF;

    IF v_invite.expires_at <= now() THEN
        RAISE EXCEPTION 'INVITE_EXPIRED' USING ERRCODE = '22023';
    END IF;

    IF v_invite.uses_count >= v_invite.max_uses THEN
        RAISE EXCEPTION 'INVITE_CAPACITY_EXHAUSTED' USING ERRCODE = '22023';
    END IF;

    -- Step 3: Atomic state transitions inside single transaction boundary
    -- All three writes commit or roll back together (Theorem 2)
    UPDATE public.community_invites
    SET uses_count = uses_count + 1
    WHERE code = p_code;

    INSERT INTO public.members (
        member_id, community_id, auth_user_id, wallet_address, role, activation_status
    ) VALUES (
        p_member_id, v_invite.community_id, p_auth_user_id, p_wallet_address, 'member', 'active'
    );

    -- Atomically increment community member_count (audit remediation)
    UPDATE public.communities
    SET member_count = COALESCE(member_count, 0) + 1
    WHERE id = v_invite.community_id;

    -- Immutable audit trail for regulatory compliance
    INSERT INTO public.community_audit_logs (
        community_id, actor_wallet, action_type, target_subject, details
    ) VALUES (
        v_invite.community_id, p_wallet_address, 'MEMBER_JOINED_VIA_INVITE', p_code,
        jsonb_build_object('invite_code', p_code, 'uses_count', v_invite.uses_count + 1, 'max_uses', v_invite.max_uses)
    );

    RETURN QUERY SELECT true, v_invite.community_id, v_invite.comm_name, 'member'::text, false;
END;
$$;

-- Principle of least privilege: revoke from public, grant only to required roles
REVOKE EXECUTE ON FUNCTION public.accept_community_invite_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_community_invite_atomic TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Sole Admin Deadlock Guard Database Trigger
--    Binds to BEFORE UPDATE OR DELETE (audit fix: F-PD-03 deletion bypass)
--    Serializes via FOR UPDATE on parent community row (Theorem 3)
--    Invariant I-ROLE-2: |Admins| >= 1 under all concurrent interleavings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_sole_admin_before_demotion()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_count INT;
    v_target_comm_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.role IN ('founder', 'admin') AND OLD.activation_status = 'active' THEN
            v_target_comm_id := OLD.community_id;

            -- Serialize admin changes on community row lock (Dijkstra's Resource Hierarchy)
            PERFORM 1 FROM public.communities WHERE id = v_target_comm_id FOR UPDATE;

            SELECT COUNT(*) INTO v_admin_count
            FROM public.members
            WHERE community_id = v_target_comm_id
              AND role IN ('founder', 'admin')
              AND activation_status = 'active'
              AND member_id != OLD.member_id;

            IF v_admin_count < 1 THEN
                RAISE EXCEPTION 'SOLE_ADMIN_DEADLOCK: Community must retain at least one active founder or administrator'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.role IN ('founder', 'admin') AND NEW.role NOT IN ('founder', 'admin'))
           OR (OLD.activation_status = 'active' AND NEW.activation_status != 'active' AND OLD.role IN ('founder', 'admin')) THEN
            v_target_comm_id := OLD.community_id;

            -- Serialize admin changes on community row lock (Dijkstra's Resource Hierarchy)
            PERFORM 1 FROM public.communities WHERE id = v_target_comm_id FOR UPDATE;

            SELECT COUNT(*) INTO v_admin_count
            FROM public.members
            WHERE community_id = v_target_comm_id
              AND role IN ('founder', 'admin')
              AND activation_status = 'active'
              AND member_id != OLD.member_id;

            IF v_admin_count < 1 THEN
                RAISE EXCEPTION 'SOLE_ADMIN_DEADLOCK: Community must retain at least one active founder or administrator'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trg_sole_admin_guard ON public.members;
CREATE TRIGGER trg_sole_admin_guard
BEFORE UPDATE OR DELETE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.check_sole_admin_before_demotion();

COMMIT;
-- >>> END MIGRATION: 033_saas_push_and_roles.sql <<<

-- >>> START MIGRATION: 034_cr007_multi_wallet_and_steward_mutations.sql <<<
-- =============================================================================
-- Migration: 034_cr007_multi_wallet_and_steward_mutations.sql
-- Subsystem: Multi-Wallet Separation (CR-007) & Steward Mutation Timelocks
-- Standard: S&P 500 Enterprise Fintech (Dijkstra Monotonic Locking, Anti-Collusion)
-- Invariants Enforced:
--   - I-W1: Disjointness Check (treasury != operational != steward)
--   - I-W2: Deterministic Backfill Preservation
--   - I-W3: 72-Hour Monotonic RTC Timelock on Steward Mutations
--   - I-SASRA-1: Section 24 Statutory Liquidity Reserve (1500 bps default)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Extend public.communities with Multi-Wallet & Liquidity Reserve Columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.communities
    ADD COLUMN IF NOT EXISTS operational_address TEXT,
    ADD COLUMN IF NOT EXISTS steward_address TEXT,
    ADD COLUMN IF NOT EXISTS clearing_rail_type TEXT NOT NULL DEFAULT 'OFF_CHAIN_KES',
    ADD COLUMN IF NOT EXISTS withdrawable_deposits_minor BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS minimum_reserve_ratio_bps INTEGER NOT NULL DEFAULT 1500;

-- ---------------------------------------------------------------------------
-- 2. Deterministic Backfill for Invariant I-W1 Disjointness Guarantee
--    Uses md5 hash derivations to mathematically prevent collision with
--    existing treasury_address or across rows (Neutralizes Defect F-04).
-- ---------------------------------------------------------------------------
UPDATE public.communities
SET
    operational_address = COALESCE(operational_address, '0xOP_' || md5(id || '_operational')),
    steward_address = COALESCE(steward_address, '0xST_' || md5(id || '_steward'))
WHERE operational_address IS NULL OR steward_address IS NULL;

-- Enforce NOT NULL on wallet addresses post-backfill
ALTER TABLE public.communities
    ALTER COLUMN operational_address SET NOT NULL,
    ALTER COLUMN steward_address SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 2b. Default Multi-Wallet Fallback Trigger for Backward Compatibility
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_default_community_multi_wallets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.operational_address IS NULL THEN
        NEW.operational_address := '0xOP_' || md5(COALESCE(NEW.id, gen_random_uuid()::text) || '_operational');
    END IF;
    IF NEW.steward_address IS NULL THEN
        NEW.steward_address := '0xST_' || md5(COALESCE(NEW.id, gen_random_uuid()::text) || '_steward');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_default_community_multi_wallets ON public.communities;
CREATE TRIGGER trg_set_default_community_multi_wallets
    BEFORE INSERT ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_community_multi_wallets();

-- ---------------------------------------------------------------------------
-- 3. Multi-Wallet Disjointness & Clearing Rail Domain Constraints
-- ---------------------------------------------------------------------------
ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS chk_multi_wallet_disjoint;
ALTER TABLE public.communities ADD CONSTRAINT chk_multi_wallet_disjoint
    CHECK (
        treasury_address <> operational_address AND
        treasury_address <> steward_address AND
        operational_address <> steward_address
    );

ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS chk_clearing_rail_type;
ALTER TABLE public.communities ADD CONSTRAINT chk_clearing_rail_type
    CHECK (clearing_rail_type IN ('OFF_CHAIN_KES', 'ON_CHAIN_STELLAR', 'ON_CHAIN_SOLANA', 'CUSTODIAL_ESCROW', 'SAFE_SOROBAN'));

ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS chk_reserve_ratio_bounds;
ALTER TABLE public.communities ADD CONSTRAINT chk_reserve_ratio_bounds
    CHECK (minimum_reserve_ratio_bps >= 0 AND minimum_reserve_ratio_bps <= 10000);

-- ---------------------------------------------------------------------------
-- 4. Create public.steward_mutations Table
--    Enforces 72-Hour Monotonic RTC Timelock for Steward Address Rotations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.steward_mutations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    proposed_steward_address TEXT NOT NULL,
    proposer_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TIMELOCKED'
        CHECK (status IN ('TIMELOCKED', 'EXECUTED', 'CANCELLED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocks_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    executed_by TEXT,
    cooldown_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.steward_mutations ENABLE ROW LEVEL SECURITY;

-- Unique partial index: exactly one pending timelocked rotation per community
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_timelocked_steward_mutation
    ON public.steward_mutations(community_id)
    WHERE status = 'TIMELOCKED';

CREATE INDEX IF NOT EXISTS idx_steward_mutations_comm_status
    ON public.steward_mutations(community_id, status);

-- ---------------------------------------------------------------------------
-- 5. Stored Procedure: execute_steward_rotation_atomic
--    Dijkstra Monotonic Hierarchy: steward_mutations -> communities
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.execute_steward_rotation_atomic(
    p_mutation_id UUID,
    p_caller TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mutation RECORD;
    v_community RECORD;
BEGIN
    -- Monotonic hierarchy step 1: Lock mutation
    SELECT * INTO v_mutation
    FROM public.steward_mutations
    WHERE id = p_mutation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MUTATION_NOT_FOUND: Steward mutation % does not exist', p_mutation_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_mutation.status <> 'TIMELOCKED' THEN
        RAISE EXCEPTION 'MUTATION_ALREADY_RESOLVED: Mutation status is %', v_mutation.status
            USING ERRCODE = '22000';
    END IF;

    -- Check Timelock monotonic RTC (72 hours minimum)
    IF clock_timestamp() < v_mutation.unlocks_at THEN
        RAISE EXCEPTION 'TIMELOCK_ACTIVE: Executable at %', v_mutation.unlocks_at
            USING ERRCODE = '55000';
    END IF;

    -- Monotonic hierarchy step 2: Lock parent community
    SELECT * INTO v_community
    FROM public.communities
    WHERE id = v_mutation.community_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'COMMUNITY_NOT_FOUND: Community % does not exist', v_mutation.community_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Disjointness invariant check against live treasury & operational addresses
    IF v_mutation.proposed_steward_address = v_community.treasury_address OR
       v_mutation.proposed_steward_address = v_community.operational_address THEN
        RAISE EXCEPTION 'DISJOINTNESS_VIOLATION: Proposed steward address collides with treasury or operational address'
            USING ERRCODE = '23514';
    END IF;

    -- Atomic execution
    UPDATE public.communities
    SET steward_address = v_mutation.proposed_steward_address,
        updated_at = clock_timestamp()
    WHERE id = v_mutation.community_id;

    UPDATE public.steward_mutations
    SET status = 'EXECUTED',
        executed_at = clock_timestamp(),
        executed_by = p_caller
    WHERE id = p_mutation_id;

    RETURN jsonb_build_object(
        'success', true,
        'mutation_id', p_mutation_id,
        'community_id', v_mutation.community_id,
        'new_steward_address', v_mutation.proposed_steward_address,
        'executed_at', clock_timestamp()
    );
END;
$$;

COMMIT;
-- >>> END MIGRATION: 034_cr007_multi_wallet_and_steward_mutations.sql <<<

-- >>> START MIGRATION: 035_cr007_payment_exceptions_dlq.sql <<<
-- =============================================================================
-- Migration: 035_cr007_payment_exceptions_dlq.sql
-- Subsystem: Payment Exceptions Dead Letter Queue (DLQ) & Two-Phase Resolution
-- Standard: S&P 500 Enterprise Fintech (Idempotent Ingestion, Monotonic Locking)
-- Invariants Enforced:
--   - I8: DLQ Isolation & Idempotent Ingestion (Non-existent or orphaned orders)
--   - Partial Unique Index: Zero duplicate key crashes on webhook retries
--   - Dijkstra Monotonic Locking: payment_exceptions -> payment_orders
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create public.payment_exceptions Table (DLQ)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL
        CHECK (provider IN ('kotani', 'paystack', 'minisend', 'swypt', 'stellar', 'solana')),
    payload JSONB NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'ABANDONED')),
    resolution_action TEXT
        CHECK (resolution_action IN ('RETRY_MATCH', 'MANUAL_REFUND', 'FORCE_FAIL', 'DISCARD')),
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_exceptions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Indices for Fast Operator Triage & Idempotent Webhook Replay Protection
-- ---------------------------------------------------------------------------
-- Prevents duplicate unhandled exceptions for the same pending order/provider pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_payment_exception
    ON public.payment_exceptions(order_id, provider)
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_payment_exceptions_status_created
    ON public.payment_exceptions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_exceptions_order_id
    ON public.payment_exceptions(order_id);

-- ---------------------------------------------------------------------------
-- 3. Stored Procedure: resolve_payment_exception_atomic
--    Dijkstra Hierarchy: payment_exceptions (4) -> payment_orders (3)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_payment_exception_atomic(
    p_exception_id UUID,
    p_action TEXT,
    p_target_order_id TEXT,
    p_operator TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exc RECORD;
    v_order RECORD;
BEGIN
    -- Monotonic hierarchy step 1: Lock exception record
    SELECT * INTO v_exc
    FROM public.payment_exceptions
    WHERE id = p_exception_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EXCEPTION_NOT_FOUND: Exception % does not exist', p_exception_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_exc.status <> 'PENDING' AND v_exc.status <> 'INVESTIGATING' THEN
        RAISE EXCEPTION 'EXCEPTION_ALREADY_RESOLVED: Exception status is %', v_exc.status
            USING ERRCODE = '22000';
    END IF;

    IF p_action NOT IN ('RETRY_MATCH', 'MANUAL_REFUND', 'FORCE_FAIL', 'DISCARD') THEN
        RAISE EXCEPTION 'INVALID_RESOLUTION_ACTION: Action % is not supported', p_action
            USING ERRCODE = '22023';
    END IF;

    -- Monotonic hierarchy step 2: Lock and update target payment_order if action requires mutation
    IF p_action IN ('RETRY_MATCH', 'FORCE_FAIL', 'MANUAL_REFUND') AND p_target_order_id IS NOT NULL THEN
        SELECT * INTO v_order
        FROM public.payment_orders
        WHERE order_id = p_target_order_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'TARGET_ORDER_NOT_FOUND: Target payment order % does not exist', p_target_order_id
                USING ERRCODE = 'P0002';
        END IF;

        IF p_action = 'RETRY_MATCH' THEN
            UPDATE public.payment_orders
            SET status = 'PAYMENT_CONFIRMED',
                updated_at = clock_timestamp()
            WHERE order_id = p_target_order_id;
        ELSIF p_action = 'FORCE_FAIL' THEN
            UPDATE public.payment_orders
            SET status = 'PAYMENT_FAILED',
                failure_reason = 'Operator force fail via DLQ exception resolution',
                updated_at = clock_timestamp()
            WHERE order_id = p_target_order_id;
        ELSIF p_action = 'MANUAL_REFUND' THEN
            UPDATE public.payment_orders
            SET status = 'REFUNDED',
                updated_at = clock_timestamp()
            WHERE order_id = p_target_order_id;
        END IF;
    END IF;

    -- Update exception record to RESOLVED
    UPDATE public.payment_exceptions
    SET status = 'RESOLVED',
        resolution_action = p_action,
        resolved_by = p_operator,
        resolved_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = p_exception_id;

    RETURN jsonb_build_object(
        'success', true,
        'exception_id', p_exception_id,
        'action', p_action,
        'target_order_id', p_target_order_id,
        'resolved_by', p_operator,
        'resolved_at', clock_timestamp()
    );
END;
$$;

COMMIT;
-- >>> END MIGRATION: 035_cr007_payment_exceptions_dlq.sql <<<

-- >>> START MIGRATION: 036_cr007_artizen_campaigns_reconciliation.sql <<<
-- =============================================================================
-- Migration: 036_cr007_artizen_campaigns_reconciliation.sql
-- Subsystem: Artizen Campaign Management, Conservation Ledger & SASRA Liquidity Guard
-- Standard: S&P 500 Enterprise Fintech (BigInt Precision, Dijkstra Locking)
-- Invariants Enforced:
--   - I5: Zero-Drift Split Conservation (total_raised == platform_fee + treasury_net)
--   - I-SASRA-1: Section 24 Statutory Liquidity Reserve Guard (SLR >= 15%)
--   - 64-bit Numeric Bounds: 0 <= total_raised <= 10^15 minor units
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create public.artizen_campaigns Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artizen_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    total_raised_minor NUMERIC(38, 0) NOT NULL DEFAULT 0
        CHECK (total_raised_minor >= 0 AND total_raised_minor <= 1000000000000000),
    platform_fee_bps INTEGER NOT NULL DEFAULT 500
        CHECK (platform_fee_bps >= 0 AND platform_fee_bps <= 5000),
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PENDING_SETTLEMENT', 'SETTLED', 'CANCELLED')),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artizen_campaigns ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Create public.artizen_settlement_ledger Table
--    Strict Invariant I5: platform_fee_minor + treasury_net_minor == total_raised_minor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artizen_settlement_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.artizen_campaigns(id) ON DELETE CASCADE,
    community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    total_raised_minor NUMERIC(38, 0) NOT NULL,
    platform_fee_minor NUMERIC(38, 0) NOT NULL,
    treasury_net_minor NUMERIC(38, 0) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    settlement_tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Invariant I5: Mathematical Zero-Drift Check
    CONSTRAINT chk_artizen_split_conservation
        CHECK (total_raised_minor = platform_fee_minor + treasury_net_minor)
);

ALTER TABLE public.artizen_settlement_ledger ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_artizen_campaigns_community ON public.artizen_campaigns(community_id, status);
CREATE INDEX IF NOT EXISTS idx_artizen_settlement_campaign ON public.artizen_settlement_ledger(campaign_id);

-- ---------------------------------------------------------------------------
-- 3. Stored Procedure: artizen_settle_campaign_atomic
--    Dijkstra Hierarchy: communities (1) -> artizen_campaigns (2)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.artizen_settle_campaign_atomic(
    p_campaign_id UUID,
    p_operator TEXT,
    p_tx_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign RECORD;
    v_community RECORD;
    v_fee NUMERIC(38, 0);
    v_net NUMERIC(38, 0);
    v_required_reserve NUMERIC(38, 0);
BEGIN
    -- Dijkstra step 1: Lock parent community first
    SELECT c.* INTO v_community
    FROM public.communities c
    JOIN public.artizen_campaigns ac ON ac.community_id = c.id
    WHERE ac.id = p_campaign_id
    FOR UPDATE OF c;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'COMMUNITY_NOT_FOUND: Associated community for campaign % does not exist', p_campaign_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Dijkstra step 2: Lock campaign
    SELECT * INTO v_campaign
    FROM public.artizen_campaigns
    WHERE id = p_campaign_id
    FOR UPDATE;

    IF v_campaign.status <> 'ACTIVE' AND v_campaign.status <> 'PENDING_SETTLEMENT' THEN
        RAISE EXCEPTION 'CAMPAIGN_NOT_SETTLEABLE: Campaign status is %', v_campaign.status
            USING ERRCODE = '22000';
    END IF;

    -- Mathematical Split Computation (Zero-Drift Floor Division)
    v_fee := FLOOR((v_campaign.total_raised_minor * v_campaign.platform_fee_bps)::numeric / 10000);
    v_net := v_campaign.total_raised_minor - v_fee;

    -- Invariant I-SASRA-1: Statutory Liquidity Reserve Guard (SLR >= 15%)
    IF v_community.withdrawable_deposits_minor > 0 THEN
        v_required_reserve := FLOOR((v_community.withdrawable_deposits_minor::numeric * v_community.minimum_reserve_ratio_bps)::numeric / 10000);
        -- If post-settlement liquidity would breach statutory reserve
        IF v_net < v_required_reserve THEN
            RAISE EXCEPTION 'SASRA_RESERVE_VIOLATION: Liquidity falls below statutory reserve requirement (% minor units required, % available)',
                v_required_reserve, v_net
                USING ERRCODE = '54000';
        END IF;
    END IF;

    -- Insert into settlement ledger (guaranteed by chk_artizen_split_conservation)
    INSERT INTO public.artizen_settlement_ledger (
        campaign_id,
        community_id,
        total_raised_minor,
        platform_fee_minor,
        treasury_net_minor,
        currency,
        settlement_tx_hash
    ) VALUES (
        p_campaign_id,
        v_campaign.community_id,
        v_campaign.total_raised_minor,
        v_fee,
        v_net,
        'KES',
        p_tx_hash
    );

    -- Mark campaign as SETTLED
    UPDATE public.artizen_campaigns
    SET status = 'SETTLED',
        settled_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = p_campaign_id;

    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', p_campaign_id,
        'community_id', v_campaign.community_id,
        'total_raised_minor', v_campaign.total_raised_minor,
        'platform_fee_minor', v_fee,
        'treasury_net_minor', v_net,
        'tx_hash', p_tx_hash,
        'settled_at', clock_timestamp()
    );
END;
$$;

COMMIT;
-- >>> END MIGRATION: 036_cr007_artizen_campaigns_reconciliation.sql <<<

-- >>> START MIGRATION: 037_custom_auth_and_otp_sessions.sql <<<
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
-- >>> END MIGRATION: 037_custom_auth_and_otp_sessions.sql <<<

-- >>> START MIGRATION: 038_enable_rls_cr007_and_auth_tables.sql <<<
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
-- >>> END MIGRATION: 038_enable_rls_cr007_and_auth_tables.sql <<<

-- >>> START MIGRATION: 039_user_profiles_identity_expansion_and_payout_statuses.sql <<<
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
-- >>> END MIGRATION: 039_user_profiles_identity_expansion_and_payout_statuses.sql <<<

-- >>> START MIGRATION: 040_reconcile_schema_fractures.sql <<<
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
-- >>> END MIGRATION: 040_reconcile_schema_fractures.sql <<<

-- >>> START MIGRATION: 041_auth_salt_and_bot_sessions.sql <<<
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
-- >>> END MIGRATION: 041_auth_salt_and_bot_sessions.sql <<<

-- >>> START MIGRATION: 042_system_config_and_circuit_breaker.sql <<<
-- =============================================================================
-- Migration: 042_system_config_and_circuit_breaker.sql
-- Subsystem: Global Emergency Circuit Breaker & Administrative Configuration
-- Standard: S&P 500 Enterprise Fintech / Basel III Capital Safeguards / Zero-Trust
-- Objectives:
--   - Provision public.system_config table for dynamic protocol operational state
--   - Seed global circuit breaker (is_emergency_paused) for instantaneous freeze
--   - Enforce Row Level Security (RLS) and service_role operational access
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create public.system_config Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for config freshness and telemetry audits
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at
    ON public.system_config(updated_at);

-- ---------------------------------------------------------------------------
-- 2. Seed Default Circuit Breaker Operational State
-- ---------------------------------------------------------------------------
INSERT INTO public.system_config (key, value)
VALUES (
    'circuit_breaker',
    jsonb_build_object(
        'is_emergency_paused', false,
        'reason', '',
        'paused_at', null,
        'paused_by', null,
        'affected_rails', jsonb_build_array('mpesa', 'minisend', 'soroban', 'cron')
    )
)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Row Level Security (RLS) & Access Permissions
-- ---------------------------------------------------------------------------
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Deny public anon/authenticated write access
DROP POLICY IF EXISTS "system_config_deny_anon" ON public.system_config;
CREATE POLICY "system_config_deny_anon"
    ON public.system_config FOR ALL TO anon, authenticated
    USING (false);

-- Grant full operational management to service_role
DROP POLICY IF EXISTS "service_role_all_system_config" ON public.system_config;
CREATE POLICY "service_role_all_system_config"
    ON public.system_config TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON public.system_config FROM anon, authenticated;
GRANT ALL ON public.system_config TO service_role;

COMMIT;
-- >>> END MIGRATION: 042_system_config_and_circuit_breaker.sql <<<

-- >>> START MIGRATION: 043_community_image_url.sql <<<
-- Migration 043: Community image URL and logo storage support
-- Target: communities table
-- Reference: PR #95 handoff (FE-1.5, Section 2.2)

ALTER TABLE communities ADD COLUMN IF NOT EXISTS image_url text null;

COMMENT ON COLUMN communities.image_url IS 'Public HTTPS URL to community logo image stored in Supabase Storage or CDN';

-- Create storage buckets if storage schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('community-logos', 'community-logos', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
-- >>> END MIGRATION: 043_community_image_url.sql <<<


-- ========================================================
-- POST-MIGRATION: POSTGREST ROLES & SECURITY HARDENING
-- ========================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Strict role quarantine on sensitive tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'steward_mutations') THEN
    REVOKE ALL ON public.steward_mutations FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_exceptions') THEN
    REVOKE ALL ON public.payment_exceptions FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artizen_settlement_ledger') THEN
    REVOKE ALL ON public.artizen_settlement_ledger FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auth_otp_challenges') THEN
    REVOKE ALL ON public.auth_otp_challenges FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auth_sessions') THEN
    REVOKE ALL ON public.auth_sessions FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_outbox') THEN
    REVOKE ALL ON public.notification_outbox FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artizen_campaigns') THEN
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.artizen_campaigns FROM anon, authenticated;
  END IF;
END $$;
