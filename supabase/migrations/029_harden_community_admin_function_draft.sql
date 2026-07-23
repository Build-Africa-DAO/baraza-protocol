-- 029_harden_community_admin_function_draft.sql
-- Classification: INTERNAL
-- DRAFT ONLY. DO NOT APPLY without explicit maintainer approval.
-- PASS 2 LIVE PREFLIGHT: DO NOT APPLY. The target
-- public.is_community_admin(text) does not exist in the live project. Live
-- SECURITY DEFINER functions require a separate definition-by-definition
-- authorization review before a replacement migration can be drafted.
--
-- This function is SECURITY DEFINER because members-table policies call it
-- while querying the same table. Limit exposure and qualify all objects.

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.is_community_admin(text)') IS NULL THEN
    RAISE EXCEPTION
      'public.is_community_admin(text) is absent; verify whether draft migration 026 was applied';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    public.is_admin()
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.members AS m
        WHERE m.community_id = p_community_id
          AND m.auth_user_id = (SELECT auth.uid())::text
          AND m.role IN ('founder', 'admin', 'treasurer')
          AND m.activation_status = 'active'
      )
    );
$$;

REVOKE ALL ON FUNCTION public.is_community_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_community_admin(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_community_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_admin(text) TO service_role;

COMMIT;
