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

DROP TRIGGER IF EXISTS stellar_settlements_set_updated_at ON stellar_settlements;
CREATE TRIGGER stellar_settlements_set_updated_at
  BEFORE UPDATE ON stellar_settlements
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
