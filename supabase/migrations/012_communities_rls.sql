-- 012_communities_rls.sql
--
-- Enable RLS on communities and add access policies.
--
-- SELECT: public (anon key can read communities for the browse/dashboard pages).
-- INSERT/UPDATE/DELETE: service role only — clients must go through
--   /api/communities which uses SUPABASE_SERVICE_ROLE_KEY.
--
-- Idempotent: all statements use IF NOT EXISTS / IF EXISTS guards.

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communities are publicly readable" ON communities;
CREATE POLICY "Communities are publicly readable"
  ON communities FOR SELECT
  USING (true);

-- No anon INSERT/UPDATE/DELETE policy — the API route bypasses RLS via service role key.
