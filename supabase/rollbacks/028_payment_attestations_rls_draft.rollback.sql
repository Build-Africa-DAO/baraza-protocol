-- Rollback for 028_payment_attestations_rls_draft.sql
-- Classification: INTERNAL
-- DRAFT ONLY. This restores the known pre-migration RLS state.

BEGIN;

ALTER TABLE public.payment_attestations DISABLE ROW LEVEL SECURITY;

COMMIT;

