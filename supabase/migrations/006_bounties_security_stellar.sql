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
