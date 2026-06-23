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
