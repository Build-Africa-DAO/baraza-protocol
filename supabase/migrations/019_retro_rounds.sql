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
