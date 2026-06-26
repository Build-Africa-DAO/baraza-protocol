# Baraza Open Tasks and Research Update

Last updated: 2026-06-09
Repo: `Azizudinly/baraza-protocol`

---

## New Open Items — 2026-06-09 (Source 4 repo audit + BAD governance extraction)

### Architecture

13. **`app/api/agent/chat.ts` does not exist** — Asha is currently a client-side keyword-matcher in `AshaChat.tsx`. No backend API route routes to Claude or any LLM. To wire Asha to a real Claude backend, create `app/api/agent/chat.ts` as a Vercel Function using `@anthropic-ai/sdk` with a Baraza governance system prompt. Akili agent definitions (pending Notion paste — see item 14) should go into that system prompt.

14. **Akili AI agent definitions (Notion-blocked)** — User's Notion page at `https://app.notion.com/p/3797722eef3b81efb1e3f71dbc30b2d8` contains "different AIs agents of akili" definitions that could not be fetched (private Notion, auth required). Action: export the page to markdown and paste it into a PULL_PROMPT session, or grant Firecrawl access via Notion integration.

15. **`docs/CONTRACT_INTEGRATION.md` does not exist** — This file was a target for BuilderOSS DAO tooling extraction (PULL_PROMPT Source 3B). BuilderOSS was not available locally. Action: clone `BuilderOSS` repo manually if DAO SDK contract interfaces are needed, then create this file from the extract.

16. **Delegation APY source** — PRD §18.2 now specifies 0.5–2% delegation APY sourced from `communityRewards` pool. The emission mechanics for this are not yet coded. Requires: (a) decision on exact APY rate, (b) Solana program or off-chain distribution cron to calculate and distribute rewards to delegates.

17. **Time-weighted voting multiplier implementation** — PRD §18.2 now specifies snapshot-based 30/90/180-day hold multipliers for protocol-track voting. This requires an on-chain or indexer-backed balance history lookup. Decide: Stellar Horizon account history polling vs Solana program account state vs off-chain snapshot cron.

### Stale / Reconciled

- `supabase/migrations/011_fix_payment_orders_rls.sql` header comment previously said `010_fix_payment_orders_rls.sql` — **fixed directly** on 2026-06-09.
- `app/docs/NEXT_STEPS.md` Open Questions item 3 stated no `/api/ussd` handler exists — **fixed directly**; `app/api/ussd/index.ts` now correctly noted as existing.

---

## New Open Items — 2026-06-08 (from Notion + NotebookLM pull)

### Critical / Blocking

1. **Token allocation discrepancy** — The Notion product spec allocation table sums to 1,100,000,000 (110% of supply), not 1,000,000,000. This must be reconciled before any allocation is changed in `app/src/lib/brza/constants.ts`. Current constants remain authoritative until resolved. Buckets in conflict: Ecosystem & Grants 17%, Community Rewards 18%, Events 5%, Reserve 5%, Liquidity Pool 10%. *Status check 2026-06-19: still open, Notion-side fix; see `docs/TOKENOMICS_AUDIT_REPORT.md` for the cross-repo confirmation that constants.ts is authoritative.*

2. **VASP registration (Kenya Virtual Asset Service Providers Act 2025)** — The Kenya VASP Act is live. BRZA token issuance on Stellar mainnet likely requires VASP registration. TODO: engage legal counsel before mainnet token launch. Do not issue BRZA on mainnet without completing this.

3. **Privy vs Web3Auth** — MPC wallet provider decision blocks Sprint 1 wallet implementation. Both embed a wallet into phone-number onboarding. Decision owner: Aziz. Privy has better Stellar support; Web3Auth has stronger East Africa coverage.

4. **Stellar issuer keypair** — Not yet created. Required before testnet BRZA issuance. Create via `stellar-sdk` Keypair.random(), fund on testnet via Friendbot, then set `VITE_BRZA_ISSUER_ADDRESS` + `VITE_BRZA_DISTRIBUTOR_ADDRESS` in Vercel.

### High Priority

5. **Safaricom Daraja API business account** — Business account not yet applied for. Required for production M-Pesa (Paybill number issuance). In the interim, Kotani Pay handles M-Pesa → XLM. Daraja application must be started at least 4–6 weeks before intended launch.

6. **Smart contract audit** — Sec3 recommended ($20K–$30K, 6-week queue). Not yet booked. Required before mainnet token issuance and treasury operations. Action: book Sec3 engagement immediately.

### Regulatory / Compliance

7. **SASRA compliance module** — Required for all `sacco` community types. Must include: member register, loan book, share capital report, annual returns filing, Deposit Guarantee Fund hook. See `app/docs/PRD.md` section 18.1.

8. **Cooperative Societies Act compliance** — Applies to `cooperative` and `supply_chain` community types. Registered society number field + AGM vote record + audited accounts attachment.

9. **SACCO Amendment Bill 2025 (Deposit Guarantee Fund)** — Bill in progress. Build compliance hook but do not activate until bill passes. See `app/docs/PRD.md` section 18.1.

### Research / Architecture

10. **BuilderOSS reference** — `C:\Users\USER\Downloads\BAD-reference\BuilderOSS` does not exist locally. Clone manually if DAO tooling or contract interfaces are needed. No live GitHub fetch.

11. **M-Pesa Paybill model** — Baraza owns one M-Pesa paybill number; communities identified by account code (not separate paybills). Architecture implication: `community_code` must be unique, indexed, and collision-resistant. Verify this is enforced in Supabase schema.

12. **Allbridge integration threshold** — BRZA bridge to Solana via Allbridge activates at $200K TVL in Stellar pool. No action until that milestone.

---

## Previous Open Items — 2026-06-06 (original state)

Date: 2026-06-06
Repo: `Azizudinly/baraza-protocol`
Branch: `fix/app-vercel-config`

## Executive Summary

Baraza is closest to a Stellar-first testnet review. The active product loop is: create community, collect dues through Stellar XLM or Kotani M-Pesa to Stellar treasury, verify/reconcile payment orders, activate membership, then govern through proposals and votes.

The main open work is not new feature ideation. It is production hardening and testnet readiness: real environment configuration, Supabase migrations, Stellar treasury smoke testing, Solana devnet deployment, and replacing demo payment promotion with real mint/indexer evidence.

## GitHub State

- Remote: `https://github.com/Azizudinly/baraza-protocol`
- Default branch: `main`
- Current branch: `fix/app-vercel-config`
- Open issues: none found through `gh issue list`
- Open pull requests: PR #5, `fix: update app/vercel.json - daily cron, full security headers, function timeouts`

## Immediate Open Tasks

1. Verify the root Vercel deployment config.
   - Current change moves deployment config to root `vercel.json`.
   - Local `vercel build --yes` could not be completed in the current unlinked workspace.
   - Confirm in Vercel that `/api/*` routes are deployed from `app/api/*`, non-API routes rewrite to `/index.html`, and the cron schedule is registered.

2. Run Supabase migrations in order.
   - Required before durable payment, membership, bounty, and admin state can be trusted.
   - Current migration list now includes `010_fix_payment_orders_rls.sql`.
   - Keep `payment_orders` closed to anon reads; status reads should go through `/api/payment-orders/status` with `x-activation-secret`.

3. Configure production/testnet Vercel environment variables.
   - Required server variables include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `STELLAR_TREASURY_ACCOUNT`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, and Kotani credentials.
   - Frontend variables include Stellar, BRZA, Supabase anon, Solana RPC, and deployed Solana program IDs.

4. Fund and test a Stellar testnet treasury account.
   - Set `STELLAR_TREASURY_ACCOUNT`.
   - Send a native XLM testnet payment to the treasury.
   - Verify with `/api/stellar/verify-payment`.
   - Confirm a persisted `PAYMENT_CONFIRMED` order when Supabase is configured.

5. Replace the demo cron promoter before production.
   - `/api/cron/promote-orders` is still a demo step-counter.
   - Production must use real BRZA mint submission, mint confirmation, and Stellar/indexer confirmation before `INDEXER_CONFIRMED` or `RECONCILED`.

6. Deploy Solana programs to devnet.
   - Install/verify Solana CLI.
   - Change `Anchor.toml` provider cluster from localnet to devnet for deployment.
   - Deploy the five Anchor programs.
   - Set all `VITE_*_PROGRAM_ID` values in Vercel.
   - Keep treasury withdrawals disabled during public review.

7. Finish governance and membership CPI gaps.
   - `programs/governance/src/lib.rs` still has TODOs for membership actions and rule changes.
   - `programs/community_registry/src/lib.rs` still needs `bump_member_count` restricted to membership CPI.
   - `programs/payment_attestation` must be wired to Supabase payment orders before on-chain membership is canonical.

8. Hand treasury release authority to a multisig-controlled authority.
   - Treasury vault release authority must be handed to a Squads vault PDA or equivalent controlled authority.
   - Do not set `withdrawals_enabled = true` until the handoff and devnet execution are tested.

9. Replace placeholder identity hashing in membership activation.
   - `user_id_hash` currently uses a wallet placeholder.
   - Production should use the HMAC-peppered phone/user identity from auth.

10. Connect GoodDollar/Celo and EVM rails only after the Stellar/Solana path is stable.
    - GoodDollar needs Alfajores token and identity addresses.
    - EVM/Base governance still needs deployed addresses, wallet signing paths, and proposal ID bridging.

## Research Notes

- Stellar remains the practical first settlement rail. The repo now clearly separates active Stellar G-account/Horizon/Kotani settlement from experimental Soroban prototypes under `contracts/stellar`.
- Solana is the governance layer, but public write actions remain preview-blocked until devnet deployments and program IDs are configured.
- Supabase remains optional by design, but any durable payment flow needs migrations and service-role-backed API reads/writes.
- The current RLS direction is safer after cleanup: payment status is not publicly readable through the anon key and requires the activation secret through the status API.
- NotebookLM should treat `README.md`, `docs/KNOWLEDGE_GRAPH.md`, `docs/TESTNET_CONTRACT_API_REVIEW.md`, `app/docs/DEPLOYMENT.md`, and this update as the current source bundle.

## Stale or Conflicting Information to Clean Next

- `app/docs/NEXT_STEPS.md` says no `/api/ussd` handler exists, but `app/api/ussd/index.ts` now exists.
- Some older docs still refer to Daraja M-Pesa direct flow; the active membership onramp is Kotani Pay KES to XLM.
- Some docs describe missing Stellar contracts; the current state is more nuanced: experimental Soroban prototypes exist, but active Stellar settlement is still API plus Horizon/Kotani.
- Generated `graphify-out` files are deleted in the current worktree and should either stay ignored/regenerated or be intentionally restored.

## Recommended Next Action

Finish PR #5 by verifying Vercel deployment behavior, then merge the config/RLS/status cleanup branch. After that, run Supabase migrations and perform the Stellar testnet payment smoke test before spending more time on secondary chain rails.
