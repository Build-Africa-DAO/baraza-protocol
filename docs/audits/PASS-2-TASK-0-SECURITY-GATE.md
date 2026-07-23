# Pass 2 Task 0 Security Gate

**Classification: INTERNAL**

**Status:** `blocked_pre_apply`

No live SQL was changed. Tasks 1-8 were not started.

## Test baseline

| Stage | Command | Result |
|---|---|---|
| Before live preflight | `npm test -- --run` in `app` | 45 files, 501/501 passed |
| After live preflight | `npm test -- --run` in `app` | 45 files, 501/501 passed |

The Forge baseline was not run because Task 0 does not touch EVM code.

## Live RLS evidence

The premise of drafted migration 028 is stale:

- The live table already has RLS enabled.
- Two authenticated policies exist: one SELECT policy and one INSERT policy.
- The live migration history records a timestamped 028 application, a rollback,
  and a corrected second attempt. These migrations are not present in this
  branch.
- An `anon` role SELECT is denied at the table-privilege boundary.
- An `authenticated` role without matching JWT claims sees zero rows.

The repository draft was not applied because doing so would not reproduce or
record the actual live migration and could misrepresent applied history.

## Live privileged-function evidence

The premise of drafted migration 029 is also stale:

- `public.is_community_admin(text)` does not exist live. The draft deliberately
  aborts when that precondition is false.
- Fifteen live functions use `SECURITY DEFINER`: five callable functions and ten
  trigger functions.
- Four of the five callable functions are executable by `anon`; the remaining
  callable function is executable by authenticated users.
- The trigger functions also retain default execute exposure.
- Supabase security advisors report external-facing warnings for anonymous and
  authenticated execution of these functions.

The live functions differ from migration 026 in name, signature, schema
dependencies, and authorization model. Applying 029 would fail without changing
anything. Broadly revoking grants without reviewing each caller could break
RLS, RPC, onboarding, proposal, notification, reputation, or trigger paths.
The instruction not to fix forward on live therefore requires stopping here.

## Gate verdict

| Requirement | Result |
|---|---|
| RLS enabled on the live payment-attestation mirror | Verified |
| RLS denies unauthenticated access | Verified |
| Existing authenticated policies present | Verified; claim-specific positive-path testing still requires a staging identity |
| Draft migration 028 applied in this pass | Not applied; equivalent live remediation already exists under different migration history |
| Draft migration 029 applied | Blocked; its target function is absent |
| All live `SECURITY DEFINER` authorization correct | Not verified; advisor warnings remain |
| Application regression suite | 501/501 before and 501/501 after |

**Task 0 is not cleared.** Publication and Tasks 1-8 remain blocked.

## Required next action

**INTERNAL — maintainer approval is required to replace drafted migration 029
with a live-schema-derived migration after each privileged function's intended
caller and dependency path is documented.**

The replacement must:

1. preserve functions that are required by RLS or triggers;
2. revoke direct RPC execution from roles that do not need it;
3. use fixed, qualified search paths;
4. include function-specific rollback SQL;
5. run first against staging with authenticated positive/negative identities;
6. rerun security advisors and the 501-test application suite before live apply.

⚠️ PUBLIC-FACING — NEEDS APPROVAL TO CREATE: private GitHub security issue —
track the live migration drift and privileged-function advisor findings.
