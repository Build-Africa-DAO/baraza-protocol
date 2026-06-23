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
