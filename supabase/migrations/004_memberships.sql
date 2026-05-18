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
