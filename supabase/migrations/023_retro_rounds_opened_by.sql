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
