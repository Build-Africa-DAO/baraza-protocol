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
