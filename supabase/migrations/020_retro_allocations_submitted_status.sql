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
