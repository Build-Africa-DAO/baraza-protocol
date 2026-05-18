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
