-- Rollback for 029_harden_community_admin_function_draft.sql
-- Classification: INTERNAL
-- DRAFT ONLY. This restores the function and default exposure from migration
-- 026; it deliberately reopens the posture that migration 029 hardens.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM members m
      WHERE m.community_id = p_community_id
        AND m.auth_user_id = auth.uid()::text
        AND m.role IN ('founder', 'admin', 'treasurer')
        AND m.activation_status = 'active'
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_community_admin(text) TO PUBLIC;

COMMIT;

