-- 028_payment_attestations_rls_draft.sql
-- Classification: INTERNAL
-- DRAFT ONLY. DO NOT APPLY without explicit maintainer approval.
--
-- Current application code has no direct payment_attestations Data API path.
-- Server-side reconciliation must use service_role. Deliberately create no
-- anon/authenticated policy.

BEGIN;

ALTER TABLE public.payment_attestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment attestations are publicly readable"
  ON public.payment_attestations;
DROP POLICY IF EXISTS "Authenticated users can read payment attestations"
  ON public.payment_attestations;
DROP POLICY IF EXISTS "Authenticated users can write payment attestations"
  ON public.payment_attestations;

COMMIT;

