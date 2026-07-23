# Supabase Security Remediation Plan

**Classification: INTERNAL**

No SQL in this plan was applied to local, staging, or live Supabase.

## Evidence and dependency inventory

| Item | Repository evidence | Current application dependency |
|---|---|---|
| Payment-attestation mirror | `supabase/migrations/003_payment_attestations.sql:11-44` creates the table without RLS | No application/API reference to the table was found. The migration describes reconciliation/admin use. Future writers/readers must use a server-side service-role path. |
| Community-admin helper | `supabase/migrations/026_leverage_foundation.sql:93-110` defines the only repository `SECURITY DEFINER` function | Member-table policy at `:122-126` calls it. No application query of the draft `members` table was found; current activation paths use `memberships` instead. |
| Current activation code | `app/api/membership/activate.ts:131-163` reads/writes `memberships` with server credentials | Not directly changed by either draft, but must be regression-tested because it is the live membership path. |

Supabase documentation requires RLS on exposed-schema tables created through
SQL and notes that enabling RLS without policies makes publishable-key access
return no rows. The draft intentionally uses that deny-by-default behavior.

## Draft order

1. Capture staging and live policy/grant state with
   `pg_policies`, `information_schema.role_table_grants`, and
   `information_schema.routine_privileges`.
2. Apply `028_payment_attestations_rls_draft.sql` to staging only.
3. Verify all reconciliation and admin paths in staging.
4. Confirm whether migration 026 exists in staging. Do not apply 029 if the
   function is absent; the draft fails deliberately.
5. Apply `029_harden_community_admin_function_draft.sql` to staging.
6. Run role-matrix and application regression tests.
7. Obtain separate explicit approval before either live application.

## Migration 028

Objective: enable RLS on the exposed payment-attestation mirror and leave
`anon`/`authenticated` with no row policy. Service-role requests continue to
bypass RLS.

What may break:

- Any undocumented browser, anon-key, or authenticated Data API read/write will
  stop returning rows or fail.
- An admin dashboard that queries the table directly instead of through a
  server endpoint will stop working.
- A server path using the anon key rather than service role will stop working.

Post-application verification:

1. `relrowsecurity` is true for the table.
2. Anon and authenticated SELECT/INSERT/UPDATE/DELETE are denied.
3. Service-role reconciliation can select and mutate a staging row.
4. No raw provider payload, phone number, or credential appears in logs.
5. Existing payment-order and membership-activation tests still pass.

Rollback: run
`supabase/rollbacks/028_payment_attestations_rls_draft.rollback.sql`. This
restores the known disabled-RLS state and must be treated as a temporary
security regression, not a final resolution.

## Migration 029

Objective: preserve the community-scoped authorization check while fixing the
function search path and removing default `PUBLIC`/`anon` execution. Explicit
execution remains for authenticated and service-role callers.

What may break:

- Any anonymous caller invoking the helper directly will receive a permission
  error.
- If migration 026 was never applied, 029 stops with an exception rather than
  silently creating a function against an unknown schema.
- Member policies may fail if the function owner cannot read `public.members`
  or if live column types differ from the draft.

Post-application verification:

1. `prosecdef` is true and `proconfig` contains
   `search_path=pg_catalog, public`.
2. `PUBLIC` and `anon` have no execute privilege; `authenticated` and
   `service_role` do.
3. Anonymous and inactive members receive false/permission denied as expected.
4. An active ordinary member receives false for admin checks.
5. An active founder/admin/treasurer receives true only for their own
   community.
6. Cross-community checks return false.
7. Member SELECT/UPDATE policies do not recurse and current activation tests
   remain green.
8. Run Supabase database security advisors after staging application.

Rollback: run
`supabase/rollbacks/029_harden_community_admin_function_draft.rollback.sql`.
It restores migration 026's function body and default public execute grant; use
only to recover service while preparing a corrected hardening migration.

## Required approvals

⚠️ PUBLIC-FACING — NEEDS APPROVAL TO CREATE: private security issue — track the
live RLS and privileged-function remediation without exposing implementation
details publicly.

**INTERNAL — separate explicit maintainer approval is required before applying
028 or 029 to staging or live Supabase.**

