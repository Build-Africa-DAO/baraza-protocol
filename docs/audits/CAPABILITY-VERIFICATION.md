# Claimed Capability Verification

**Classification: INTERNAL**

The categories below describe repository evidence at `5181a77`. A test that
exists but does not currently complete successfully is not treated as passing
evidence.

| Capability | Classification | Evidence | Qualification |
|---|---|---|---|
| Stellar 2-of-3 approvals | Exists in code with a passing test | `contracts/stellar/treasury_vault/src/lib.rs:45` defines signer/threshold configuration; `:149` rejects execution below threshold; `:272` starts the full multisig test and `:273` configures threshold 2 with 3 signers; `:281-289` approves with a second signer and verifies transfer | The contract also permits threshold 1 (`:63`), so the product-wide no-single-signer rule is not enforced by this contract. |
| `is_community_admin()` privilege-escalation fix | Exists in code without a database test | `supabase/migrations/026_leverage_foundation.sql:93-110` binds the membership check to `auth.uid()`, an allowed role, and active status | Migration 026 is documented as drafted-only; repository evidence does not prove it is applied to the live project. No SQL integration test was found. |
| Proposal creation on Stellar | Exists in code with a passing test | `contracts/stellar/governance/src/lib.rs:90-127` creates and persists a member proposal; `:320-332` creates one in the lifecycle test | The shared application adapter does not expose this contract method. |
| Proposal body retrieval on Stellar | Exists in code without a body-specific test | Proposal stores `title` and `description` at `contracts/stellar/governance/src/lib.rs:38-49`; `get_proposal` returns the stored object at `:264-265` | The lifecycle test calls the getter at `:352`, but only asserts status/executed at `:353-354`; it does not assert title or full description fidelity. No list method exists. |
| Proposal creation on Solana | Exists in code with a test that currently does not pass end to end | `programs/governance/src/lib.rs:51-90` creates a proposal with `metadata_uri`; client call is `app/src/lib/programs/client.ts:158-179`; smoke calls are `tests/anchor-smoke.mjs:474` and `:487` | The restored smoke run fails earlier at `createCommunity`, so proposal creation was not reached. |
| Proposal retrieval on Solana | Exists in code with a test that currently does not pass end to end | Account fetch is `app/src/lib/programs/client.ts:103-105`; smoke fetch/assertions are `tests/anchor-smoke.mjs:636-643` | Retrieval returns account metadata including a URI, not the proposal body behind that URI, and the failing smoke run never reached these assertions. |
| Founder confirmation before deploy or charge | Exists in code without a focused test | Final create screen states that the payment is confirmed before submission at `app/src/pages/CreateCommunity.tsx:928` and summarizes total charge at `:967-975`; submit logic charges first at `:415-417` and then creates the community | No focused test proves a deployment or charge cannot bypass this UI. The flow creates an application record; it is not evidence of chain deployment confirmation. |
| Cost logging on a deployment path | Does not exist | Repository search found no `estimated_deployment_cost`, `estimated_recurring_cost`, `cost_drivers`, or `cheaper_alternative` field | Existing fee display is not the directive's required routing/deployment cost log. |

## Resulting blockers

- Stellar proposal-body fidelity and non-admin read access need explicit tests.
- Solana proposal creation/retrieval remains unverified at runtime until the
  program-ID/local-validator failure is resolved.
- Founder confirmation needs an enforceable service boundary, not only UI copy.
- Every estimate, reconfiguration, and deployment path still lacks the required
  cost log.

