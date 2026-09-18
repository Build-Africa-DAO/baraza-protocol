# Baraza Protocol — Frontend ↔ Backend Integration Map

**Author:** Eugene Mutembei (frontend)
**Date:** 13 September 2026
**Frontend source:** branch `front-end` @ `3c06525` plus the uncommitted post-login redesign in the working tree (`app/src`)
**Backend source:** branch `backend` @ `08d8190` (already merged to `dev` as PR #88; `main` is at `31402a2`)
**Milestone source:** `baraza-protocol-docs` @ `42d969c` (`09-development-roadmap-plans`, `03-delivery-specs`, `10-backend-audit-m1-m6`)
**Revised:** 13 September 2026, evening, after the frontend hardening pass (§14). Items that pass marked as fixed are no longer listed as gaps.

This document is the single map of what the web app calls, what the backend serves, where the two disagree, and what is left on each side against the milestone plan. Every claim was checked against code, not against earlier docs. Where a delivery report and the code disagree, the code wins and the disagreement is listed in §12.

**How to read it.** §1 is the answer to "what is in place and what remains" in one page. §2 answers it milestone by milestone. §3 onward is the working reference: hosting and env, auth, every screen with every button mapped to a route, every route with its contract, payments, mail and notifications, data access, and the ranked gap list. §13 proposes the next sprint for both teams.

---

## 1. Summary

### 1.1 What the frontend has in place

- **Four shells and the whole member product redesigned** (post-login audit Phases 0–9, logged in `docs/frontend-post-login-audit.md` §11): `PublicShell` for `/`, `VisitorShell` for signed-out app URLs, `AppShell` for members (floating sidebar and top bar, account menu, theme, confirmed logout), `OperatorShell` for `/admin`, `/retro`, `/onboard`. One design language: tokens, radius, status chips that always carry a word, money in the group's currency with no client conversion, honest empty states ("Not available yet" rather than invented numbers).
- **Every member screen wired to the contracts that exist:** My Groups, Browse, Group Home, Pay, Votes, One Vote, Propose, People, Money (statement, export, approve send), Settings (officers, SACCO licence, disputes, statements), More, Join and Join Status, Start a Group, Account, Help, System Status.
- **Auth modal for phone, email and Google with sign-in and sign-up intent**, currently on Privy, built so the swap to Baraza's own OTP is a call-site change.
- **Thirteen transactional email templates** (HTML and text), catalog and renderer, logo and `/logo` redirect. These are the templates the backend now sends from.
- **One API client** (`lib/api.ts`) behind every `/api/*` call: optional `VITE_API_BASE`, bearer from whichever sign-in provider is registered, one normalised error shape, submit-once guards on every mutation, 503 read as "not set up" rather than "retry".
- **Server-backed votes and activity.** Votes, One Vote, Group Home and My Groups read the public `proposals` table (trigger-maintained tallies, 15 s refresh while a vote is open); Recent Movement reads `community_audit_logs`; Propose posts to `POST /api/governance/proposals`. Nothing on a member screen reads the synthetic store when a database is configured.
- **Baraza sign-in built behind a flag.** `VITE_AUTH_PROVIDER=baraza` mounts the backend's own email codes, Google Identity Services and `brz_sess_` bearer sessions against the routes as shipped; Privy stays the default until the backend migration in §4.3 lands.
- **Web Push done properly** (service worker, `pushManager.subscribe`, the exact payload the backend validates), a one-time fee option at creation, payout tracker on the real statuses with a tranche plan, polling backoff, security headers for Pages, and the email preview gallery out of the public build.
- **Design-system lint guards**, 857 passing tests (65 failures are the three Supabase-integration suites that need a local instance plus one URL assertion tied to a local `.env`), typecheck and lint clean, production build green, axe clean in both themes except the orange logotype (exempt, §14).

### 1.2 What the backend has in place (verified in code, 17 Sept 2026)

- 70 handlers under `app/api` covering custom auth (email OTP, Google, sessions), communities, members roster, invites, officers, statement export, memberships, payment intents and Stellar verification, Minisend payout & quote, Kotani and Paystack proxies, payment-order status and streaks, disputes, governance (proposals, vote, finalize, execute), SACCO compliance, treasury freeze and unfreeze, health probes, USSD, WhatsApp FSM, Akili chat, retro rounds, and seven inbound webhooks.
- 40 migrations (000–039), with RLS on every table, deny-all on auth/exception tables, and migration 039 resolving user profile identity fields, payment order lifecycle states, and vote constraints.
- SendGrid mail library with template rendering and a mock mode.

### 1.3 The five things that block integration (ranked, updated post-PR#92/#93)

1. **The API is not deployed by anything in the repo (DevOps Block).** CI ships `app/dist` to Cloudflare Pages as a static SPA. There is no `functions/` directory, no `_worker.js`, and no cron trigger in `dist`. `app/public/_routes.json` routes `/api/*` to a non-existent Function. Every relative `/api/...` call from the browser returns `index.html` (SPA fallback), breaking `JSON.parse` in `lib/api.ts`. (§3.2, §16.1)
2. **Missing Cryptographic Wallet Proof Headers in Frontend Mutations (Contract Block).** In production (`!isTestEnv`), `governance/vote.ts`, `governance/execute.ts`, and `communities/index.ts` require cryptographic wallet signatures (`x-wallet-address`, `x-wallet-signature`, `x-wallet-message`). The frontend hooks (`useCastVote`, `GroupMoney:approve`, `CreateCommunity:openGroup`) send raw JSON with no proof headers, resulting in universal 401 Unauthorized in live environments. (§16.2)
3. **Polymorphic Auth Identity Resolution Gaps (Auth Block).** `resolveCallerIdentity` in `app/api/_lib/auth-session.ts` returns `{ userProfileId, email, authMethod: 'BARAZA_SESSION' }` without populating `walletAddress` or `privyDid`. Downstream route guards (`communities/officers.ts`, `push-subscribe.ts`) enforce `if (!identity.walletAddress && !identity.privyDid) return 401;`, rejecting email/session authenticated users. (§16.3)
4. **Nothing advances a payment after confirmation (Scheduler Block).** `cron/promote-orders` walks `PAYMENT_CONFIRMED → … → RECONCILED`, and `membership/activate` requires `INDEXER_CONFIRMED` or `RECONCILED`. No Cloudflare scheduler calls the cron in production. Furthermore, the UI calls `/api/mpesa/simulate` (blocked when simulator is disabled) instead of the live Daraja route `app/api/mpesa/stk-push.ts`. (§7.2, §16.4)
5. **Orphaned Member Directory & Payout Quoting Engine (Wiring Gaps).** `app/api/communities/members.ts` is fully implemented, but `MemberDirectory.tsx` shows "Member List Not Available Yet" and `useMembers` queries `dataStore.ts`. `app/api/payments/quote.ts` is implemented, but `lib/payouts.ts:requestPayoutQuote()` returns `null` and environment variable names diverge (`PAYMENT_QUOTE_SECRET` vs `PAYOUT_QUOTE_SECRET`). (§16.5)

*(Note: The previous blockers #2 and #4 regarding missing `user_profiles` columns and missing `payment_orders` status CHECK constraints were fully resolved by migration `039_user_profiles_identity_expansion_and_payout_statuses.sql`.)*

### 1.4 One decision needed this week

**Where does `/api/*` run?** Cloudflare Pages Functions (bundle `app/api` into `functions/` or a `_worker.js`, add `[triggers] crons` and the Queue and Hyperdrive bindings already declared in `wrangler.toml`), a separate Worker, or a Vercel project rooted at `app/`. Until this is answered the frontend cannot be tested against anything but a local `vite` proxy, and no cron runs.

---

## 2. Status against the milestones

The docs repo carries three overlapping numbering systems: roadmap milestones **M1–M11**, contract schedules **Main-1…Main-5 / Other-1…3 / Phase 3**, and backend sprints **P1–P8** with delivery reports **Phase P1–P6**. The table below reconciles them from the frontend's point of view. "Frontend" is what the web app must do for the milestone; "Backend dependency" is what the app needs from the API for it to be real.

| Milestone | Frontend in place | Frontend remaining | Backend dependency and its state |
|---|---|---|---|
| **M1 Correctness pass** (Main-1, Main-3) | No `vercel.app` string remains in `app/`; `VITE_SITE_URL` falls back to `https://barazaprotocol.com`; chain failures surface as errors, not silent record-only success; every `/api/*` call goes through one client that can point at another origin (`VITE_API_BASE`). | Privy allowed-origins check on the dashboard for `barazaprotocol.com` (manual, until the auth swap). | Main-3's nine root shims were added, but **22 newer routes have no shim** (§3.3). Deploy routing for `/api/*` is unresolved (§3.2). |
| **Main-2 Homepage** | Landing (`/`) with hero, features, flow, Akili, pricing, FAQ, contact, CTA; reveal animations; images re-encoded 9.2 MB → 2.1 MB; mobile and desktop verified. | Merge and live check on `barazaprotocol.com`. | None. |
| **M2 Treasury live on Stellar** (Main-5) | Members never see a wallet. Officers' Money screen shows the total from `communities.fund_balance` and "Not available yet" for reserved and available. | Freighter signing path for officers if execution moves on-chain. | `/api/treasury/initialize` performs no on-chain call and writes `treasury_policy` values that violate the CHECK constraint (§6.6). No multisig approval route exists. |
| **M3 Activation and billing** (Phase P1) | Join shows the itemised fee card from `create-payment-intent` (dues, 2.0% platform fee, carrier cost, total) before any charge; free groups skip payment and call `membership/activate`; Start a Group has Free vs monthly dues and never hardcodes an amount; "No launch fee in this environment" is stated, not assumed. | Verification-tier selector (Tier 1–4) at creation, only if the column is added. Free / Monthly Dues / One-Time Fee are all offered now. | `fee_type ∈ one_time｜recurring_monthly｜free` exists. **No `verification_tier` or `vouch_threshold` column exists**, although the Join screen branches on them (§5.7). No launch-quote endpoint. |
| **M4 Chain adapter refactor** | No member screen imports a wallet adapter; only operator pages and plumbing do (enforced by `eslint.guards.js`). | None for members. | Backend-internal. |
| **M5 Router and confirmation flow** | Nothing. | Founder questionnaire, routing reasoning, confirm-before-charge screen. | Nothing exists server-side either. |
| **M6 Real M-Pesa** (Main-4, Phase P1) | Pay and Join flows, 2.5 s polling of `payment-orders/status` with the activation secret, receipt card, "Do not pay again" copy on unverifiable references. Production shows "rail unavailable" instead of a fake prompt. | Point the one call site at the real initiate route once it exists and show "Check your phone for the M-Pesa prompt" copy. Polling now backs off (2.5 s for a minute, then 15 s) and every payment button is submit-once. | **No server STK-push route.** Status callbacks exist (`status-result`, `status-timeout`) but `MPESA_CALLBACK_URL` in the env example points at the Africa's Talking handler, which will reject Daraja payloads. `promote-orders` cron is unscheduled (§7.2). |
| **M7 Base via Aragon** | Base EVM plumbing present in `lib/evm`, not surfaced. | None until licensing gate clears. | Blocked on licensing sign-off. |
| **M8 Sandbox → mainnet** | Sandbox copy is honest (no real money implied). | Promotion screen with exact cost and explicit founder confirmation. | `wrangler.toml` still pins Stellar testnet and `VITE_SITE_URL=https://baraza.app`. |
| **M9 Tier 5 public bodies** | Nothing. | Public-read views, notice/comment windows, signed export. | Nothing. |
| **M10 Solana Phase 2** | Operator retro screens exist behind the operator shell. | None while the pause stands. | Blocked by Addendum pause. Retro voting is also non-functional today because the roster query uses lowercase `active` (§6.5). |
| **M11 BRZA evaluation** | Deferred by decision. | None. | None. |
| **Phase P2 Governance** | Votes, One Vote, Propose screens; `POST /api/governance/vote` is the authority for a ballot; outcome copy covers Tied. | Done: proposals from the public table with a 15 s refresh while open, Propose via `POST /api/governance/proposals`, my ballot kept on the device, tie extension labelled. | Routes exist but three of four have no shim; quorum snapshot bug; `votes.member_id` FK mismatch (§6.3). |
| **Phase P3 Minisend off-ramp** | Send-to-phone sheet with E.164 validation, telco-ceiling split warning, three-step tracker. It refuses to send because `requestPayoutQuote` is a stub. | Done on our side: tracker on `OFFRAMP_INITIATED → PROVIDER_PENDING_VERIFICATION → SETTLED｜FAILED｜REVERSAL_DETECTED`, a split plan the officer confirms above the ceiling, deterministic `-tranche-n` ids, submit-once. Still gated by the quote stub. | Five statuses violate the constraint; no quote endpoint; FX rate hardcoded; no polling source for a payout (§7.4). |
| **Phase P4 SACCO compliance** | Compliance badge on the group strip; officer licence form validating `CS/…` and `SASRA/(DT｜NWDT)/…`, HTTPS certificate URL, future expiry; non-officers see the read-only status. | File upload once an upload target exists. | `compliance/status`, `sacco-license-submit`, `sacco-license-review` exist, unshimmed. No upload endpoint. |
| **Phase P5 Reconciliation and health** | System Status page polls `health/ready` every 8 s and says "Not Checked" for the payments rail rather than inferring it. Treasury circuit-breaker banner on the group workspace; Approve Send reads `circuitBreaker: true` and shows the on-hold copy. | None. | `health/*` exist, unshimmed; `reconcile-treasury` cron unscheduled; `redis` reported healthy unconditionally; Kotani probe reads the wrong env name (§6.8). |
| **Phase P6 SaaS identity and disputes** | Account page on `GET/PATCH /api/user/profile`; My Groups on `GET /api/user/memberships`; officer roles via `POST /api/communities/officers`; dispute form via `POST /api/payment-orders/dispute`; statement export CSV. | Two-column memberships payload fields (`nextContribution`, `openProposalCount`) once provided. | All four routes exist, none shimmed. `payment_disputes.order_id UNIQUE` blocks a second dispute after a rejection. |
| **Custom auth and email** (handoff of 7 Sept) | Modal, templates, catalog, logo redirect, SMS formatters shipped. | Built behind `VITE_AUTH_PROVIDER=baraza`: modal on `/api/auth/*` as shipped, Google Identity Services, `GET /api/auth/me` as the account source, token in memory. Remaining: flip the flag once the migration lands, then retire Privy. | Six routes built. **Blocked by the missing `email` column and identity CHECK** (§4.3). Only the two OTP templates are sent; the other eleven have no caller; no SMS channel on the auth routes; no dispatch endpoint, preferences endpoint or dues-reminder cron; Google `aud` is not checked; contract shapes differ from the handoff (§4.4). |

**Where the docs disagree with themselves** (details in §12): the backend audit says M6 is "simulated or gated", while `BACKEND_SCOPE_OF_WORK.md` says webhook ingress is 100% done. The P1–P8 sprint table does not match the Phase P1–P6 report contents. The PRD promises ten endpoints that do not exist. Three production hostnames are hardcoded across the codebase (`barazaprotocol.com`, `baraza.app`, `baraza.network`).

---

## 3. Topology, hosting and environment

### 3.1 What runs where

| Piece | Location | Runtime | Notes |
|---|---|---|---|
| Web app | `app/src` → `app/dist` | Vite SPA, React 18, react-router 6 | Client-side routing only. Calls `/api/...` relative to its own origin (the one exception is Akili: `VITE_AKILI_API_URL` when set). |
| API handlers | `app/api/**` (64 files) | Web-Fetch `handler(req: Request): Promise<Response>`; `config.runtime` is `edge` or `nodejs` per file | Type-checked by `app/tsconfig.node.json`, ignored by Vite. |
| Vercel shims | `api/**` (42 files) | Three-line re-exports of `app/api` | Legacy of the purged Vercel projects. |
| Database | Supabase Postgres, migrations `supabase/migrations/000–038` | PostgREST | Client reads a few public tables with the anon key (§9). |
| Mail | `app/api/_lib/mail.ts` → SendGrid | | Templates in `app/emails`. |
| SMS | Africa's Talking (`_lib/sms.ts`, `ussd/index.ts`, `identity/initiate-claim.ts`) | | Two env-name families (`AT_*` and `AFRICASTALKING_*`). |
| CI | `.github/workflows/ci.yml` | | Typecheck → lint → test → `vite build` → `wrangler pages deploy app/dist` on push to `main`. |

### 3.2 The hosting gap

`wrangler.toml` declares a Pages project (`pages_build_output_dir = "app/dist"`) with a Queue producer and a Hyperdrive binding, and `app/public/_routes.json` includes `/*` for Functions. But:

- there is no `functions/` directory and no `app/dist/_worker.js`;
- the CI build step only asserts `dist/index.html` and `dist/_routes.json` exist;
- there is no `[triggers] crons = [...]` block, so the four `cron/*` handlers never run;
- there is no `vercel.json`, and Simon's 31 Aug guide documents disconnecting both Vercel projects.

**Effect:** a fresh deploy from `main` serves the SPA and nothing else. `GET /api/health/ready` returns `index.html`. The custom-auth handoff already recorded the same symptom for `/logo` returning HTML instead of a PNG.

**Options (backend/devops to choose):**

1. Pages Functions: generate `functions/api/[[path]].ts` (or `_worker.js`) that imports `app/api/**` handlers; add `[triggers]` crons; keep `nodejs_compat` (needed because `_lib/wallet-proof.ts` imports `node:crypto` and `@stellar/stellar-base`).
2. A dedicated Worker at `api.barazaprotocol.com` with `main = ...` in `wrangler.toml`; the SPA then needs a `VITE_API_BASE` and every `fetch('/api/...')` call goes through one client. Cross-origin cookies will not work with the current wildcard CORS (§4.5), so the session must travel as a bearer header.
3. Vercel project rooted at `app/` (retire the root `api/` shims). Conflicts with the 31 Aug purge.

### 3.3 Routes with no `api/` shim

Under the shim model these 22 handlers are unreachable. Under a Functions bundle that imports `app/api` directly, the shims are irrelevant. Either way the list marks what has never been served anywhere:

```
communities/invites/accept          communities/invites/index
communities/officers                communities/statement
compliance/sacco-license-review     compliance/sacco-license-submit
compliance/status                   compliance/treasury-unfreeze
cron/monitor-compliance             cron/reconcile-treasury
governance/finalize                 governance/proposals
governance/vote                     health/live
health/metrics                      health/ready
payment-orders/dispute              user/memberships
user/notifications/push-subscribe   user/profile
webhooks/minisend                   webhooks/whatsapp
```

The six `auth/*` handlers do have shims. Of the routes the frontend calls today (§5), the unshimmed ones are `user/profile`, `user/memberships`, `communities/statement`, `communities/officers`, `communities/invites/accept`, `governance/vote`, `payment-orders/dispute`, `compliance/status`, `compliance/sacco-license-submit`, `health/ready`.

### 3.4 Client environment (`VITE_*`)

| Variable | Read at | Controls |
|---|---|---|
| `VITE_SITE_URL` | `lib/env.ts`, `lib/seo.ts`, `lib/brza/constants.ts` | Canonical origin. Default `https://barazaprotocol.com`. `wrangler.toml` sets `https://baraza.app` — fix. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `lib/communities.ts` | Browser Supabase client for the public tables in §9. |
| `VITE_PRIVY_APP_ID` | `lib/wallet/mpc.ts` | Empty ⇒ account context reports `configured: false`, sign-in buttons disabled. Stays until the auth swap. |
| `VITE_PRIVY_PHONE_AUTH_ENABLED` | `lib/wallet/mpc.ts` | `'false'` hides the Phone tab. Default on. Undocumented in `.env.example`. |
| `VITE_API_BASE` | `lib/api.ts` | Origin that serves `/api/*` when it is not the app's origin. Unset ⇒ same origin. |
| `VITE_AUTH_PROVIDER` | `lib/auth/provider.ts` | `privy` (default) or `baraza`. |
| `VITE_GOOGLE_CLIENT_ID` | `lib/auth/provider.ts`, `components/auth/GoogleIdentityButton.tsx` | Google Identity Services client id for the baraza provider; unset hides Google there. |
| `VITE_VAPID_PUBLIC_KEY` | `lib/push.ts` | VAPID public key for Web Push; unset ⇒ Enable Push reports that push is not set up. |
| `VITE_AKILI_API_URL` | `akili/AkiliChat.tsx` | Standalone Akili host; unset ⇒ `/api/agent/chat`. |
| `VITE_ENABLE_PAYMENT_SIMULATOR` | `lib/devMode.ts` | Dev only, with `import.meta.env.DEV`. Enables `POST /api/mpesa/simulate`. |
| `VITE_ADMIN_WALLETS`, `VITE_ADMIN_NFT_THRESHOLD`, `VITE_ADMIN_NFT_COUNT` | `lib/access.ts`, `pages/AdminReconciliation.tsx` | Operator allowlist. The "NFT gate" compares two env numbers; it is not a chain read. |
| Stellar, Solana, Base, Celo, BRZA program and contract ids | `lib/env.ts`, `lib/programs/*`, `lib/chains/config.ts` | Operator and plumbing only. |

Env validation runs once at boot (`lib/env.ts`): a malformed URL throws; missing Supabase keys warn. `app/.env.example` now documents every `VITE_` variable the code reads.

### 3.5 Server environment the API needs (names only)

Required for the flows the frontend uses: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `BRZA_PRICE_USD` (unset ⇒ `create-payment-intent` returns 503 `pricing_not_configured`), `XLM_USD_RATE_MVP`, `PAYMENT_PHONE_HASH_PEPPER`, `OTP_PEPPER`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `PRIVY_APP_ID` (server twin of the VITE var; defaults to a junk literal), `ADMIN_WALLETS` (server twin of `VITE_ADMIN_WALLETS`), `CRON_SECRET`, `COMPLIANCE_REVIEW_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `MINISEND_API_KEY`, `MINISEND_WEBHOOK_SECRET`, `KOTANI_PAY_API_KEY`, `KOTANI_WEBHOOK_SECRET`, `PAYSTACK_SECRET_KEY`, `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`, `ANTHROPIC_API_KEY`, `MPESA_STATUS_RESULT_PATH_SECRET`, `MPESA_STATUS_TIMEOUT_PATH_SECRET`, `MPESA_STATUS_CALLBACK_IP_ALLOWLIST`, `GOOGLE_OAUTH_CLIENT_ID` (not read yet; needed for the `aud` check).

Missing from both `.env.example` files today: `PRIVY_APP_ID`, `ADMIN_WALLETS`, `OTP_PEPPER`, `PAYSTACK_SECRET_KEY`, `MINISEND_WEBHOOK_SECRET`, `BRZA_PRICE_USD`, `XLM_USD_RATE_MVP`, `COMPLIANCE_REVIEW_SECRET`, `CLEARING_WEBHOOK_SECRET`, `ARTIZEN_WEBHOOK_SECRET`, `EVOLUTION_API_KEY`. `health/ready` reads `KOTANI_API_KEY` while everything else reads `KOTANI_PAY_API_KEY`.

Production must have `MPESA_SIMULATOR_ENABLED` unset or `false`, `NODE_ENV=production` (the test-header auth bypass and the cookie `Secure` flag both key off it, and Cloudflare does not set it by default), and rotated values for every `dev-*-change-in-prod` placeholder.

---

## 4. Authentication and sessions

### 4.1 Today (frontend)

Two providers exist behind `VITE_AUTH_PROVIDER` (`lib/auth/provider.ts`). `privy` is the default and is described below. `baraza` mounts `BarazaAccountProvider` in `contexts/AccountContext.tsx`, which drives the same modal view with `lib/auth/baraza.ts` (email codes, Google Identity Services, `brz_sess_` bearer in memory, `GET /api/auth/me` on load for same-origin cookie recovery). Both register a token provider that the API client asks on every call, so nothing else in the app knows which is active.

- `AccountContext` wraps `PrivyProvider` with login methods `email`, `sms`, `google`; embedded Solana wallet created for users without one; wallet UI hidden.
- `AuthModal` (`components/auth/AuthModal.tsx`) offers Phone or Email code and Continue with Google. Sign in passes `disableSignup: true`; sign up allows creation.
- `account.getAccessToken()` returns the Privy JWT. `lib/sessionHeaders.ts` attaches it as `Authorization: Bearer …` on every authenticated call.
- `account.accountId` is the embedded Solana wallet address (or the Privy user id). It is what the app sends as `voter`, `executorWallet`, `createdBy`, `walletAddress`, and the streak `wallet`. This matters for §6.3.
- Post-auth routing: safe `returnTo` → stay path → one active membership → `/dashboard/:id` → else `/home`.

### 4.2 Backend ingress (what the API accepts)

`app/api/_lib/auth-session.ts` `resolveCallerIdentity(req, purpose)` tries, in order:

1. Test headers (only when `NODE_ENV=test` or `VITEST=true`).
2. **Wallet proof**: headers `x-wallet-address`, `x-wallet-message`, `x-wallet-signature`. Message is exactly four lines: `Baraza wallet proof` / `purpose: <purpose>` / `wallet: <address>` / `issuedAt: <ISO>`; Ed25519 over the message; ±5 minutes. Stellar StrKey or Solana base58. The frontend's `lib/walletProof.ts` produces this for operator screens.
3. **Baraza session**: cookie `BARAZA_SESSION` or `Authorization: Bearer brz_sess_…`; SHA-256 looked up in `auth_sessions`, 30-day TTL, max five sessions per profile (oldest revoked).
4. **Privy bearer**: `Authorization: Bearer <jwt>` or `x-privy-authorization`, verified against Privy JWKS for `PRIVY_APP_ID`.

Which routes require which is in §6. Note that `governance/proposals`, `governance/vote`, `governance/execute` and `communities/index` verify a wallet proof **only if the headers are present**; omit them and the check is skipped. `governance/finalize` has no auth at all.

### 4.3 The custom-auth routes and why signup fails today

| Route | Body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/signup/request` | `{email}` | 200 `{ok, destination, expiresInMinutes: 10, message}`; sends `signup-otp` | 400 `invalid_email`, 409 `account_exists` |
| `POST /api/auth/signin/request` | `{email}` | 200 same; sends `signin-otp` with placeholder device text | 404 `user_not_found`, 403 `account_suspended` |
| `POST /api/auth/verify` | `{email, code, purpose?='signup', fullName?}` | 200 `{ok, sessionToken: 'brz_sess_…', user: {id, email, full_name, role}, message}` + `Set-Cookie: BARAZA_SESSION=…; HttpOnly; SameSite=Lax; Max-Age=2592000[; Secure]` | 400 `invalid_code` / `incorrect_code` (+`attemptsRemaining`) / `too_many_attempts` |
| `POST /api/auth/google` | `{credential, isSignUp?=false}` | 200 `{ok, sessionToken, user: {id, email, fullName, role}}` + cookie | 404 `user_not_found` (sign-in intent, no account), 403 `account_suspended`, 401 `invalid_token` |
| `GET /api/auth/me` | — | 200 `{ok, user, authMethod}`; `user` shape varies by method (§6.1) | 401 `unauthorized` |
| `POST /api/auth/logout` | — | 200 `{ok}` + cookie cleared | — |

**Blocking defect.** `auth/verify.ts` and `auth/google.ts` insert `user_profiles` rows with `email`, `full_name`, `role`, `is_active`. Migration `032` defines `user_profiles` with `wallet_address`, `privy_did`, `phone_hash`, `display_name`, `locale`, `country`, `notification_preferences`…; `037` adds `google_sub` and `phone_e164`. **No migration adds `email`, `role` or `is_active`**, and `chk_user_profiles_identity_present` (`032:39-41`) requires `wallet_address` or `privy_did`. An email or Google signup therefore fails at the database. The signin route also selects `full_name, is_active` that do not exist. The frontend cannot switch off Privy until a migration adds `email UNIQUE`, `role`, `is_active`, and relaxes the identity CHECK to include `email` or `google_sub`.

### 4.4 Contract deltas versus the 7 Sept handoff

The handoff (`baraza-protocol-docs/03-delivery-specs/Custom-Auth-and-Email-Notifications-Backend-Handoff.md`) asked for shapes the modal could call mechanically. What shipped differs:

| Handoff | Shipped | Frontend consequence |
|---|---|---|
| `{channel: 'email'｜'sms', email, phone}` on request routes | `{email}` only; no SMS channel | Phone tab has no backend; either keep Privy SMS during transition or add the SMS channel via Africa's Talking (`_lib/sms.ts` exists but is not called by auth). |
| 201 on request | 200 | Trivial. |
| `verify` returns `user: {id, email, phone, displayName}` | `user: {id, email, full_name, role}` | Map `full_name` → display name. |
| `google` body `{idToken, purpose}` | `{credential, isSignUp}` | Rename at the call site. |
| Verify Google `aud` = our client id | Not checked | Any Google client's ID token is accepted. Backend must add `GOOGLE_OAUTH_CLIENT_ID` check. |
| `logout` 204 | 200 | Trivial. |
| Existing routes accept the Baraza session | `resolveCallerIdentity` does return `BARAZA_SESSION` identities, **but `user/profile`, `user/memberships` and `push-subscribe` then reject any caller without `walletAddress` or `privyDid`** | After the swap, Account and My Groups return 401 for email/Google users until those three routes accept `userProfileId`. |
| Session as HttpOnly cookie (`__Host-baraza`) | Cookie **and** raw token in the JSON body | With `Access-Control-Allow-Origin: *` on these routes the cookie cannot be used cross-origin, so the app must hold the bearer token in memory and send `Authorization: Bearer brz_sess_…`. Same-origin deployment would let the cookie work. |
| `POST /api/notifications/dispatch`, `GET/PATCH /api/user/notifications/preferences`, dues-reminder cron | Not built; preferences live inside `PATCH /api/user/profile` | Fine for the Account page; the eleven product emails have no sender. |
| `account-welcome` on first signup, `signin-new-session` on every sign-in | Not sent | Templates exist, nothing calls them. |
| Device, browser, location parsed server-side | Literal `'Desktop/Mobile'`, first 40 chars of UA, `'Verified IP'` | The sign-in email shows placeholder text. |
| OTP never logged | OTP written in cleartext to `notification_outbox.template_vars`; `sanitizeOutboxOtp` exists but is never called | Backend fix. |

### 4.5 Session handling rules for the frontend (implemented in `lib/auth/baraza.ts` and `lib/api.ts`)

- Treat `sessionToken` from `verify` and `google` as a bearer token. Keep it in memory (module state), not `localStorage`, until a CSP exists. Re-hydrate on reload with `GET /api/auth/me` using the cookie only when the SPA and API share an origin.
- Send `Authorization: Bearer <token>` on every authenticated call; `lib/sessionHeaders.ts` already does this for Privy and needs a second source.
- Expect five-session eviction: an older device may be logged out silently. Show "Signed out on another device" on a 401 after a previously good session.
- `GET /api/auth/me` returns `user.full_name` for session users; use `display_name` from `GET /api/user/profile` as the name of record.

### 4.6 Roles

Three unrelated role systems exist; the frontend uses the first and the third:

| Where | Values | Used by |
|---|---|---|
| `members.role` (per community) | `founder｜admin｜treasurer｜secretary｜member` | Officer gating on `communities/officers` (founder, admin), invites (founder, admin, secretary), dispute resolution (founder, admin, treasurer). The app's `isOfficer` comes from `GET /api/user/memberships` `role`. |
| `user_profiles.role` (global) | free text, default `member`, no CHECK | Returned by `auth/me`; enforced nowhere. Ignore. |
| `ADMIN_WALLETS` / `VITE_ADMIN_WALLETS` | wallet list | Operator shell, retro, Akili filings. |

`useGroupMembership` only trusts `isOfficer`, dues and balances when the membership came from the API (`source === 'api'`). A membership restored from local storage never unlocks officer surfaces.

---

## 5. Screen-by-screen map

Conventions: **Shell** is chosen by `components/Layout.tsx` (operator paths → OperatorShell; signed in → AppShell; any other non-root path → VisitorShell; `/` → PublicShell). **State** column lists the honest states the screen renders. **Calls** are exact. **Status** is one of: `live` (route exists, shimmed, no known drift), `unshimmed` (exists under `app/api` only), `drift` (exists but a schema or logic bug breaks it), `dev-only`, `stub`, `missing`.

### 5.1 Chrome (all signed-in screens)

| Element | Action | Calls | Status |
|---|---|---|---|
| Sidebar sections My Groups / Browse / Start a Group with page rows | navigate | — | live |
| Sidebar "Groups" list (≤ 8) with Pending / On Hold chips | `useMyMemberships` | `GET /api/user/memberships` (Bearer) → `{ok, memberships: [{communityId, name, role, activationStatus, joinedAt, duesStatus, outstandingDuesMinor, votingPower, vaultBalanceMinor, currency, membershipStatus}]}`; on failure falls back to Supabase `memberships` by wallet, then local storage. `outstandingDuesMinor` is the sum of that member's `PAYMENT_PENDING` orders and `duesStatus` is derived from it (`OVERDUE_DUES` when > 0); neither is a stored dues schedule. | unshimmed; **rejects Baraza-session callers** (needs `walletAddress` or `privyDid`) |
| Top bar context chip (Visitor / Pending / Active / Officer / On Hold) | `useGroupMembership` | derived from the memberships payload | unshimmed |
| Theme toggle | local | — | live |
| Account menu → `/account`, `/help` | navigate | — | live |
| Log out (confirm dialog) | `account.logout()` | Privy logout today; `POST /api/auth/logout` after the swap | live / pending swap |
| Bottom nav (phone) | navigate | — | live |
| Offline banner | `navigator.onLine` + IndexedDB queue | — | live (no screen registers a sync handler yet) |
| Akili button and panel | `POST /api/agent/chat` `{message, communityId?, history[≤8], agent?}` with the bearer token → SSE `data: {"text"}` … `[DONE]`; errors arrive as HTTP 200 `{category, message}` and as 401/429 | live; the client now sends the identity the route requires and maps 401 and 429 to member copy |

### 5.2 `/` Landing (PublicShell) and `/dev/ui`

Marketing sections; Sign In / Create Account open the auth sheet; `/` redirects to `/home` when authenticated. `/dev/ui` is the primitive fixture page, dev only.

### 5.3 Auth sheet (any screen)

| Step | Action | Calls today (Privy) | Calls after swap |
|---|---|---|---|
| Identifier | Send Code (Phone or Email) | `sendSmsCode` / `sendEmailCode` with `disableSignup: !isSignUp` | `POST /api/auth/{signup｜signin}/request {email}` (SMS channel: not built) |
| Code | 6 digits, auto-submit, Resend, Use a different email | `loginWithCode` | `POST /api/auth/verify {email, code, purpose}` → keep `sessionToken` |
| Google | Continue with Google | `initOAuth({provider: 'google'})` | Google Identity Services → `POST /api/auth/google {credential, isSignUp}` |
| Errors | inline | `formatPrivyAuthError` | map `account_exists` (offer Sign In), `user_not_found` (offer Create Account), `incorrect_code` with `attemptsRemaining`, `too_many_attempts` (offer Resend) |

Gate copy is per screen (`WalletGate`): `/home` "Sign in to see your groups", `/create` "Sign in to start a group", `/dashboard/:id/pay` "Sign in to pay", `/money` "Sign in to see the money", `/settings` "Sign in to see settings", `/votes/new` "Sign in to propose".

### 5.4 `/home` My Groups

| State | Renders |
|---|---|
| Signed out | gate |
| Loading | two skeleton rows |
| Has groups | `GroupRow` per membership (initials, name, Active / Officer / Pending / On Hold chip, next-action caption) + Start a Group |
| Empty | invite form card + Start a Group empty state |
| Error | inline error |

| Button / link | Calls | Status |
|---|---|---|
| Rows | `GET /api/user/memberships` | unshimmed |
| Join With an Invite (`?join=1` sheet) → Continue to Join | `extractInviteCode` → `POST /api/communities/invites/accept {code}` (Bearer) → `{ok, joined, alreadyMember, communityId, role, message}`; 404, 410 `expired` / `capacity_exhausted`, 429 each have member copy (`inviteErrorCopy`); else `parseJoinTarget` → `/join/:id` | unshimmed |
| Start a Group / Browse Groups | navigate | live |

Ask: memberships payload to carry `nextContribution` and `openProposalCount` so the row caption can say "Pay dues · KES 500" and "1 vote needs you" from the API rather than from local data.

### 5.5 `/groups` Browse

| Element | Calls | Status |
|---|---|---|
| Search (`?q=`), kind chips (`?kind=chama｜sacco｜cooperative｜welfare｜investment`) | client-side over the list | live |
| List and cards | Supabase anon `communities` select (`COMMUNITY_COLUMNS`, only columns that exist in the migrations, plus `liquid_vault_balance_minor` and `encumbered_balance_minor`) | live (fixed: the four non-existent columns were removed) |
| View Group / Join This Group | navigate | live |
| Start a Group | navigate | live |

There is no `GET /api/communities`; the PRD's `GET /api/communities?id=` does not exist. Public read of `communities` via RLS is the intended path.

### 5.6 `/dashboard/:id` Group Home (GroupWorkspace)

Workspace chrome: identity strip with membership chip, SACCO compliance badge (`GET /api/compliance/status?communityId=` → `{ok, communityId, communityName, communityType, status, licenseNumber, verifiedAt, expiresAt, documents: []}`; public; unshimmed), circuit-breaker banner when `is_payout_frozen` or `status='paused'` (Supabase read), cached-membership warning when the membership did not come from the API, visitor Join bar (desktop and sticky mobile).

| Card | Source | Status |
|---|---|---|
| Next action (Join / Confirming Your Payment / Pay Dues / A Vote Needs You / A Send Needs You / Invite Your First Members / Nothing Needs You) | memberships payload + proposals from the public table | live |
| Open Votes | `useProposals` → Supabase `proposals` (public RLS) | live; falls back to the synthetic store only when no database is configured (local dev) |
| Money: Total / Reserved / Available | `communities.fund_balance`; reserved and available `null` → "Not available yet" | ask: split balances (`liquid_vault_balance_minor`, `encumbered_balance_minor` exist on `communities` since `028`/`031`; the client can read them) |
| Recent Movement | `useCommunityActivity` → Supabase `community_audit_logs` (public) | live; shows officer changes, invites and invite joins, which is all the backend writes there. Payments, votes and proposals will appear once the backend logs them. |

### 5.7 `/join/:id` and `/join/:id/status`

| Step | Action | Calls | Status |
|---|---|---|---|
| Load | group | Supabase `communities` | live |
| Invite auto-accept | `?invite=<code>` + signed in | `POST /api/communities/invites/accept` | unshimmed |
| Quote | fee card | `POST /api/stellar/create-payment-intent {communityId}` → 201 `{intentToken, feeBreakdown: {baseAmountMinor, platformFeeMinor, carrierCostMinor, totalExpectedMinor, currency}, expiresAt}` or 200 `{zeroFee: true, bypassPayment: true}` | live (needs `STELLAR_INTENT_SECRET`, `BRZA_PRICE_USD`) |
| Tier branch | removed: no `verification_tier` column exists, so Join always shows the pay or free path | — | fixed on the frontend; reinstate when the column exists |
| Join Free Community | `POST /api/membership/activate {orderId: 'ord_free_<uuid>', communityId, walletAddress, activationSecret: 'sec_free_<uuid>'}` | live for `fee_type='free'` or zero fee. The client mints its own ids here; the backend accepts `ord_free_*` on the free path. |
| Pay with M-Pesa | `POST /api/mpesa/simulate` | **dev-only**; production shows the rail-unavailable copy. **No real STK route.** |
| Other Ways to Pay (Stellar) | `POST /api/stellar/verify-payment {intentToken, txHash, environment}` → `{orderId, activationSecret, status: 'PAYMENT_CONFIRMED'}` | live |
| Status page | poll `GET /api/payment-orders/status?orderId=` with `x-activation-secret`, every 2.5 s for a minute then every 15 s, until terminal; on `INDEXER_CONFIRMED`/`RECONCILED` → `POST /api/membership/activate` (a 409 reads as "still being recorded") | live, **but orders never reach those statuses because the promote cron is unscheduled** |
| Unverifiable reference (`ord_local_*`, no id) | "We cannot confirm this payment… Do not pay again." | — | live |

Terminal statuses the status page treats as failure: `PAYMENT_FAILED`, `PAYMENT_EXPIRED`, `AMOUNT_MISMATCH`, `MINT_FAILED_FINAL`, `REFUND_REQUESTED`, `MANUAL_REVIEW`.

### 5.8 `/dashboard/:id/pay` Pay

States: not member → Join This Group First; pending → Your Membership Is Being Confirmed; up to date (`duesOwedMinor ≤ 0` from the API) → You Are Up to Date with streak chip; otherwise amount → sending → confirming → done with a receipt card.

| Action | Calls | Status |
|---|---|---|
| Amount | `outstandingDuesMinor` from memberships payload | unshimmed |
| Streak | `GET /api/payment-orders/streak?wallet=` (public, `Cache-Control: private, max-age=30`) | live |
| Pay | `POST /api/mpesa/simulate` | dev-only; **needs the real initiate route** |
| Confirming | poll `payment-orders/status` with the stored secret, 2.5 s then 15 s | live (cron gap) |
| Receipt / dispute link | `/dashboard/:id/settings#disputes` | live |

### 5.9 `/dashboard/:id/votes`, `/votes/:decisionId`, `/votes/new`

| Element | Calls | Status |
|---|---|---|
| List with filters Needs You / Open / Passed / Sent / Did Not Pass | `useProposals` → Supabase `proposals` (public RLS; tallies maintained by trigger), refreshed every 15 s while a vote is open | live |
| One Vote: outcome chip, quorum bar, support %, rules sentence | `useProposal` → the same table; tally refreshed after a ballot | live; `status` `active｜passed｜failed｜tied_extended｜tied｜executed｜cancelled` maps to Open / Passed / Did Not Pass / Tie (48h Extension) / Tied — Not Sent / Sent |
| Support / Object | `POST /api/governance/vote {proposalId, voter: <accountId>, option: 'yes'｜'no'}` (Bearer) → 200 `{ok, voteId, …}`; 409 `already_voted`; 422 `proposal_not_active` / `voting_ended`. My choice is kept on this device (`lib/myVotes.ts`) because `votes` is closed to the browser. | **drift**: unshimmed; `votes.member_id` is an FK to `memberships.member_id` and the handler defaults it to the wallet address → FK violation. Backend must resolve `member_id` from the caller. |
| Approve Send (officer, passed) | link to Money | live |
| Propose a Spend form | `POST /api/governance/proposals {communityId, proposer, title, description, kind, fundingAmountMinor, votingPeriodDays, quorumThresholdBps}` → 201 `{proposalId, …}`; the synthetic store is used only when no database is configured | unshimmed; **quorum snapshot bug**: queries `memberships.status=eq.active` against uppercase `ACTIVE`, so `snapshot_member_count` is always the minimum |

Abstain exists in the DB enum and the vote handler but the UI deliberately offers Support and Object only (product rule: no abstain until it is on-chain).

### 5.10 `/dashboard/:id/people` People

| Element | Calls | Status |
|---|---|---|
| Directory, filters All / Active / Pending / Overdue (officer) | none in production; the screen says "Member List Not Available Yet" and why | **missing endpoint**: no `GET /api/communities/:id/members`; `members` table is closed to anon. Ask: members list route returning `{memberId, displayName, role, activationStatus, joinedAt, lastContributionAt}`. |
| Streak chips | `POST /api/payment-orders/streak-batch {wallets[≤100]}` | live |
| Invite People (officer) → plain link | `${origin}/join/${id}` share / copy | live |
| Invite People → limited link (days, max uses) | `POST /api/communities/:id/invites {expiresInDays, maxUses}` (Bearer; founder/admin/secretary) → 201 `{code, inviteUrl, …}` | unshimmed target; **`inviteUrl` is `https://baraza.network/join?code=` which matches neither the domain nor the router (`/join/:id?invite=`)**. The UI builds its own URL from `code` and ignores `inviteUrl`. |

### 5.11 `/dashboard/:id/money` Money (officer)

| Element | Calls | Status |
|---|---|---|
| Balances | `fund_balance`; reserved / available "Not available yet" | ask: expose split balances (see 5.6) |
| Trail | `GET /api/communities/statement?communityId=&format=ndjson` (Bearer, active member) → NDJSON rows `{date, reference_id, reference_type, debit_account, credit_account, amount_minor, currency}`; 5000-row pages with `x-next-cursor` | unshimmed |
| Export CSV | same with `format=csv`, blob download | unshimmed |
| Waiting to Send → Approve Send (confirm sheet) | `POST /api/governance/execute {proposalId, executorWallet, communityId}` → 200 `{ok, status: 'executed'}`; 403 `treasury_circuit_breaker_active` + `circuitBreaker: true` → "on hold" copy; 403 `regulatory_compliance_violation`; 422 `invalid_status` | live route, **drift**: journal entry uses plain-English account names the reconciler does not sum; SASRA gate checks a `proposal_type` column that does not exist |
| Send to Phone sheet | `requestPayoutQuote()` (**client stub returns null → sheet shows "Sending is not available here yet"**). Above the ceiling the officer first sees the split plan (equal parts, remainder on the last) and confirms; each part then calls `POST /api/payments/minisend {communityId, proposalId: '<batch>-tranche-<n>', phone, usdcAmount, chain, currency}` under a submit-once key → 200 `{ok, orderId, reference, kesAmount}`; a 422 ceiling reply re-plans with the server's `maxAllowedMinor`; 403 `circuitBreaker` → on-hold copy. The tracker maps `OFFRAMP_INITIATED → PROVIDER_PENDING_VERIFICATION → SETTLED｜FAILED｜REVERSAL_DETECTED` and says receipt is confirmed by the provider, not by this page. | unshimmed; **five statuses violate the constraint**; FX rate hardcoded; no quote route; no server idempotency; no status source for the tracker |

### 5.12 `/dashboard/:id/settings` Settings

| Section | Calls | Status |
|---|---|---|
| Group Identity, Rules (Locked chip), Dues | Supabase `communities` | drift (5.5) |
| Paybill and USSD (officer) | `paybill_number`, `ussd_shortcode` → "Not Set" | **columns do not exist**; `POST /api/communities` accepts them and discards them |
| Officers (officer): Add / Remove | `POST /api/communities/officers {communityId, targetWallet, newRole, action: 'ASSIGN'｜'REVOKE'}` (Bearer; founder/admin) → 200 `{ok, previousRole, newRole}`; 403; 409 `conflict` → "keep at least one admin"; 422 `governance_policy_violation` → proposal-only copy | unshimmed. The officer **list** says it is not available yet; adding by account id still works. No list route. |
| SACCO Licence | `GET /api/compliance/status?communityId=`; `POST /api/compliance/sacco-license-submit {communityId, licenseNumber, certificateUrl (https), documentType, expiresAt, wallet}` → 200 `{status: 'PENDING_REVIEW', documentId}`; 409 `conflict`; 422 format | unshimmed; **no file upload** (URL only, stated in the UI) |
| Statements export with date range | `GET /api/communities/statement?…&format=csv&startDate&endDate` | unshimmed |
| Disputes (member) | `POST /api/payment-orders/dispute {orderId, communityId, disputeType: PAYMENT_NOT_CREDITED｜WRONG_AMOUNT｜DUPLICATE_DEBIT｜OTHER, amountDisputedMinor, reason}` → 200 `{disputeId, status: 'PENDING'}`; 409 `conflict`; 422 `statute_of_limitations_exceeded` (14 days) | unshimmed; **`payment_disputes.order_id UNIQUE`** means a second dispute after a rejection is impossible |

### 5.13 `/dashboard/:id/more` More

Activity, Roles, Suggestions, Leaderboard, Roadmap, Board, Bounties tabs. Suggestions and Roadmap try `GET/POST /api/communities/:id/suggestions` and `/roadmap` and fall back to local storage when absent; **none of these routes exist**. Bounty board reads local `lib/bounties.ts`; **no bounty routes exist**, and the `bounties` tables allow anon INSERT (§9). The frontend parked bounties by decision; these tabs are honest about what they hold.

### 5.14 `/create` Start a Group

| Step | Calls | Status |
|---|---|---|
| Kind, Name and Rules (Monthly Dues / One-Time Fee / Free to Join chips, amount, quorum, threshold, days), Open | `createCommunityRecord` → `POST /api/communities {name, type, description, membershipFee, activationFeeMinor, feeType: 'free'｜'recurring_monthly', carrierPassThrough, currency, chain, quorumPct, approvalThresholdPct, votingPeriodDays, treasuryPolicy, createdBy}` (+ wallet proof if `createdBy`) → 201 `{persisted: true, community}`; 503 `db_not_configured` → UI states record-only | live |
| Opening Fee | "No launch fee in this environment" | ask: launch-quote endpoint or a documented "no fee" ruling |
| Missing versus PRD | verification tier selector (Tier 1–4); SACCO licence upload at creation | both sides missing the tier column; no upload target |

### 5.15 `/account` Account

| Section | Calls | Status |
|---|---|---|
| Identity strip, Name, Country and Currency, Language, Notifications (SMS / WhatsApp / Email / Push), Save | `GET /api/user/profile` → `{ok, profile: {id, walletAddress?, privyDid?, displayName, avatarUrl, bio, locale, country, defaultCurrency, hasVerifiedPhone, phoneVerifiedAt?, notifications: {sms, whatsapp, email, push}, createdAt, updatedAt}}` (row created lazily on first GET); `PATCH /api/user/profile` with any of `displayName` (≤100, sanitised), `bio` (≤500), `avatarUrl` (https, anti-SSRF), `locale` (`en｜sw｜sheng`), `country` (`KE｜UG｜TZ｜RW｜GH｜NG`), `defaultCurrency` (`KES｜UGX｜GHS｜NGN｜USD`), `notifications` (merged) → same shape; 400 `invalid_locale` / `invalid_country` / `invalid_currency` / `invalid_input`. `DELETE` anonymises the row (ODPC §40) and purges push subscriptions. | unshimmed. **Requires `walletAddress` or `privyDid`; a Baraza-session caller gets 401.** Default `email: false`; the handoff asks for `true` for custom-auth users. `DELETE` on a Privy-only profile violates the identity CHECK (sets `privy_did` null with no wallet) → 500. |
| Enable Push | `lib/push.ts`: registers `/sw.js`, `pushManager.subscribe` with `VITE_VAPID_PUBLIC_KEY`, then `POST /api/user/notifications/push-subscribe {subscription: {endpoint, keys: {p256dh, auth}}, userAgent}` → 201 `{subscriptionId, registeredAt}`. Without the key the button says push is not set up. | unshimmed; frontend side complete. Backend still needs VAPID keys, a sender that reads `user_push_subscriptions`, and an unsubscribe route. |
| Your Groups | memberships payload | unshimmed |
| Log Out (confirm step, like the top bar) | Privy logout / `POST /api/auth/logout` | live |

### 5.16 `/help`, `/status`, `/claim`, `/bounties*`

- `/help`: six answers with Ask Akili chips; Email Help `mailto:hello@barazaprotocol.com`. Live.
- `/status`: `GET /api/health/ready` every 8 s → `{status: 'ready'｜'degraded'｜'not_ready', components: {database, stellar_horizon, redis, minisend, kotani}}`; a 503 body is read as a valid "not ready" reading. Unshimmed; `redis` is hardcoded healthy; Kotani probe reads the wrong env name. The page says "Not Checked" for payments rather than inferring.
- `/claim`: Solana-wallet gated; `POST /api/identity/initiate-claim {phoneNumber, walletAddress}` with wallet proof; `POST /api/identity/verify-claim {code, phoneNumber, walletAddress}`. Live. Not reachable for phone/email members by design (operator/legacy).
- `/bounties`, `/bounties/:id`: local store only. Parked.

### 5.17 Operator shell: `/admin`, `/admin/akili`, `/admin/retro`, `/retro/*`, `/onboard`

| Screen | Calls | Status |
|---|---|---|
| `/admin` Reconciliation | metric cards from Supabase reads; review queue local; **payment reconciliation section is explanatory copy** ("will list here once the reconciliation API is exposed") | no reconciliation list route (`reconciliation_audit_logs` is anon-readable and could serve) |
| `/admin/akili` Council Filings | `POST /api/akili/filings {agent}` with `X-Admin-Wallet` | **stub in production**: reads the founder's local `~/.claude/data`; returns `synced: false` |
| `/admin/retro` Retro Rounds | `GET/POST /api/communities/retro-rounds`, `POST /api/communities/retro-settle` with `X-Admin-Wallet` + wallet proof; Settle confirm sheet | live routes; **roster queries use lowercase `active`** → pool 0, voters rejected |
| `/retro/:id`, `/vote`, `/results` | `retro-rounds`, `retro-ballot` (+ proof), `retro-allocations` | same lowercase bug |
| `/onboard` Lab | dev only; redirects home in production | — |

---

## 6. Endpoint reference

Grouped by domain. **Auth** column: `none`, `bearer` (Privy JWT or Baraza session), `proof` (wallet proof required), `proof?` (verified only if headers present), `secret` (server-to-server), `admin` (`x-admin-wallet` in `ADMIN_WALLETS`), `activation` (`x-activation-secret`). **Shim** marks whether `api/` has a re-export. Defects are summarised; §7 and §12 have detail.

### 6.1 Auth and identity

| Route | Auth | Shim | Notes |
|---|---|---|---|
| `POST /api/auth/signup/request`, `signin/request`, `verify`, `google`, `logout`; `GET /api/auth/me` | none / bearer | yes | §4.3 blocking column defect; `me` returns `{id,email,full_name,role,is_active,phone_e164,created_at}` for session users, `{walletAddress, role}` for wallet, `{privyDid, role}` for Privy |
| `POST /api/identity/initiate-claim`, `verify-claim` | proof | yes | SMS via Africa's Talking `AT_*`; silent no-op if unset |

### 6.2 Communities, invites, officers, statement

| Route | Auth | Shim | Notes |
|---|---|---|---|
| `POST /api/communities` | proof? | yes | 201 `{persisted, community}`; drops `paybillNumber`, `ussdShortcode`; no GET |
| `GET/POST /api/communities/invites`, `/api/communities/:id/invites` | bearer, active founder/admin/secretary | id-form yes, base no | `inviteUrl` host and path wrong |
| `POST /api/communities/invites/accept` | bearer | no | 10/min per IP; RPC `accept_community_invite_atomic` |
| `POST /api/communities/officers` | bearer, active founder/admin | no | roles `founder｜admin｜treasurer｜secretary｜member`; 409 sole admin |
| `GET /api/communities/statement` | bearer, active member | no | CSV / NDJSON stream, 5000 rows, `x-next-cursor` |

### 6.3 Governance

| Route | Auth | Shim | Notes |
|---|---|---|---|
| `GET /api/governance/proposals?communityId=` | none | no | raw rows |
| `POST /api/governance/proposals` | proof? | no | 201; **quorum snapshot bug** (`status=eq.active`) |
| `POST /api/governance/vote` | proof? | no | **`member_id` FK mismatch**; returned `voteId` differs from the inserted one |
| `POST /api/governance/finalize` | **none** | no | quorum halved when unanimous; tie → `tied_extended` (+48 h) → `tied` |
| `POST /api/governance/execute` | proof? | yes | 403 `circuitBreaker`; account-name drift; `proposal_type` column missing |

Enums: `proposals.status` `draft｜pending｜active｜passed｜failed｜tied｜tied_extended｜queued｜executed｜cancelled`; `execution_status` `pending｜encumbered｜escrow_clearing｜executed｜reversal_pending｜reversed｜failed`; `kind` `general｜treasury｜membership｜parameter｜emergency`; `votes.option` `yes｜no｜abstain`. Tallies are trigger-maintained on `proposals`; never count `votes` client-side (the table has no anon policy anyway).

### 6.4 Memberships and payment orders

| Route | Auth | Shim | Notes |
|---|---|---|---|
| `POST /api/membership/activate` | activation | yes | needs order status `INDEXER_CONFIRMED`/`RECONCILED`; free path accepts `ord_free_*` |
| `GET /api/user/memberships` | bearer | no | summary shape in §5.1 |
| `GET /api/payment-orders/status?orderId=` | activation | yes | the polling endpoint; returns the row minus the secret hash |
| `GET /api/payment-orders/streak?wallet=`, `POST …/streak-batch` | none | yes | counts `MINT_CONFIRMED｜INDEXER_CONFIRMED｜RECONCILED` |
| `POST /api/payment-orders/dispute` | bearer | no | submit or resolve by body shape; officer resolve founder/admin/treasurer |

`payment_orders.status` (26 values, migration 032): `CREATED, PAYMENT_REQUESTED, PAYMENT_PENDING, PAYMENT_CONFIRMED, PROVIDER_CONFIRMED, STATUS_QUERY_SENT, ATTESTATION_SUBMITTED, MINT_QUEUED, MINT_SUBMITTED, MINT_CONFIRMED, INDEXER_CONFIRMED, RECONCILED, PAYMENT_EXPIRED, PAYMENT_FAILED, AMOUNT_MISMATCH, MINT_FAILED_RETRYABLE, MINT_FAILED_FINAL, REFUND_QUEUED, REFUND_SUBMITTED, REFUND_CONFIRMED, MANUAL_REVIEW, OFFRAMP_INITIATED, DISBURSEMENT_PENDING, REFUND_REQUESTED, DISPUTED_PENDING, DISPUTED_RESOLVED`. The PRD's `MEMBERSHIP_ACTIVE` is not a status. `memberships.status` is uppercase `PENDING｜ACTIVE｜SUSPENDED｜REVOKED｜EXPIRED｜MIGRATED`; `members.activation_status` is lowercase `pending｜active｜suspended｜revoked`.

### 6.5 Payments and rails

| Route | Auth | Shim | Notes |
|---|---|---|---|
| `POST /api/stellar/create-payment-intent` | none | yes | 201 intent or 200 `zeroFee`; 503 without `STELLAR_INTENT_SECRET` / `BRZA_PRICE_USD` |
| `POST /api/stellar/verify-payment` | intent token | yes (named exports) | writes `PAYMENT_CONFIRMED` |
| `POST /api/mpesa/simulate` | secret, disabled in prod | yes | dev only |
| `POST /api/mpesa/transaction-status` | secret | yes | → `STATUS_QUERY_SENT` |
| `POST /api/mpesa/status-result`, `status-timeout` | path secret + IP allowlist | yes | Daraja callbacks |
| `POST /api/payments/kotani`, `paystack`, `brza-membership`, `reconcile-brza-membership` | secret | yes | server-to-server only; not callable from the browser |
| `POST /api/payments/minisend` | secret or bearer | no | see §7.4 |
| `POST /api/payments/exceptions/resolve` | any bearer, **no role check** | yes | writes `REFUNDED` (not in constraint) |
| `POST /api/treasury/initialize` | proof | yes | **stub**: no chain call; illegal `treasury_policy` values |
| Retro: `GET/POST /api/communities/retro-rounds`, `retro-ballot`, `retro-allocations`, `retro-settle` | mixed | yes | lowercase `active` bug |

### 6.6 Compliance, health, misc

| Route | Auth | Shim | Notes |
|---|---|---|---|
| `GET /api/compliance/status?communityId=` | none | no | licence status `UNLICENSED｜PENDING_REVIEW｜VERIFIED｜REJECTED｜EXPIRED｜REVOKED` |
| `POST /api/compliance/sacco-license-submit` | bearer/proof, officer | no | type `sacco｜housing` only |
| `PATCH /api/compliance/sacco-license-review`, `POST /api/compliance/treasury-unfreeze` | secret | no | operator tooling |
| `GET /api/health/live`, `ready`, `metrics` | none | no | `ready` 5 s TTL, `x-cache`; `metrics` OpenMetrics |
| `POST /api/agent/chat` | bearer (any) | yes | SSE; 200 with `{category, message}` on error |
| `POST /api/akili/filings` | admin | yes | stub in production |
| `POST /api/ussd` | `AT-API-Key` | yes | Africa's Talking USSD |
| `POST /api/user/profile` family: `GET`, `PATCH` (and `DELETE` if present) | bearer | no | preferences inside the profile |
| `POST /api/user/notifications/push-subscribe` | bearer | no | real Web Push subscription required |
| Webhooks: `kotani`, `paystack`, `africastalking`, `minisend`, `clearing`, `artizen`, `whatsapp` | HMAC per provider | 5 of 7 | Minisend and WhatsApp unshimmed; `MPESA_CALLBACK_URL` example points at the Africa's Talking handler |
| Cron: `promote-orders`, `settle-retro-allocations`, `reconcile-treasury`, `monitor-compliance` | `CRON_SECRET` | 2 of 4 | **no scheduler anywhere** |

### 6.7 Error contract

There is no single envelope. `lib/api.ts` (`normalizeApiError`) reads the code as `body.error ?? body.category`, the message as `body.message`, keeps a raw database sentence in `error` as the message rather than the code, drops one-word server sentences, and never trusts the HTTP status alone. Shapes handled:

- `{error, message}` snake_case (most routes), sometimes with extras (`attemptsRemaining`, `circuitBreaker`, `recommendedTranches`, `messages[]`).
- `{error: 'invalid_request', message}` for anything from a missing field to a 404 (payments, governance, communities).
- Bare `{error: 'forbidden'}` / `{error: 'not_found'}` (status, callbacks).
- Raw PostgreSQL message in `{error}` (retro routes).
- Akili: HTTP 200 with `{category: 'credits_exhausted'｜'auth_failed'｜'rate_limited'｜'overloaded'｜'unknown', message}` or the same as an SSE frame.
- Plain text (`ussd`, `health`, malformed JSON on several routes).

503 means "misconfigured backend" (a secret is unset), not "retry".

### 6.8 Headers the frontend sends or must send

`Authorization: Bearer <privy-jwt | brz_sess_…>`; `x-activation-secret` on `payment-orders/status`; `x-wallet-address`, `x-wallet-message`, `x-wallet-signature` on operator mutations; `x-admin-wallet`, `x-member-wallet`, `x-voter-wallet` on retro routes; `Content-Type: application/json`. **No idempotency header exists anywhere**; the only body-level key is `idempotencyKey` on `payments/brza-membership`. Every mutation in the app now runs under a submit-once guard (`submitGuard` in `lib/api.ts`, `useSubmitOnce`) so a double tap sends one request; the backend still needs server-side idempotency for retries across page loads.

---

## 7. Payments: as built, as needed

### 7.1 Join or pay dues with M-Pesa (target flow)

```
UI ──POST /api/stellar/create-payment-intent {communityId}──► 201 {intentToken, feeBreakdown}   (fee card)
UI ──POST <STK initiate route: does not exist>──────────────► {orderId, activationSecret}
UI ──poll GET /api/payment-orders/status?orderId  (x-activation-secret) every 2.5 s
Daraja ──► /api/mpesa/status-result (path secret + IP allowlist) ──► ATTESTATION_SUBMITTED
cron promote-orders (unscheduled) ──► MINT_QUEUED → MINT_SUBMITTED → MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED
UI on INDEXER_CONFIRMED|RECONCILED ──POST /api/membership/activate──► 200 {status: 'ACTIVE'}
```

Missing pieces: the initiate route; the scheduler; a Daraja-shaped callback target (the env example points STK callbacks at the Africa's Talking handler, which verifies `x-at-signature`).

### 7.2 What the frontend already does right

- Never shows an STK prompt it did not trigger. In production the Pay and Join buttons state the rail is not available rather than calling the simulator.
- Polls only with an activation secret; refuses to move the stepper for references it cannot verify; says "Do not pay again".
- Treats `PAYMENT_CONFIRMED` as "confirming", not "done", matching `membership/activate`.
- Free join is instant and calls `membership/activate` directly.
- Every payment and payout button is submit-once, polling backs off after a minute, and a 503 from any rail reads as "not set up" instead of prompting a retry.

### 7.3 Stellar path

Works end to end today against a configured backend: intent → user pays XLM to the treasury account → `verify-payment` with the tx hash → order `PAYMENT_CONFIRMED` with an activation secret → same polling and activation. Needs `STELLAR_TREASURY_ACCOUNT`, `STELLAR_INTENT_SECRET`, `BRZA_PRICE_USD`.

### 7.4 Payout (Minisend)

Frontend: officer opens Send to Phone → above the ceiling the split plan is shown first → `requestPayoutQuote()` stub returns null → sheet explains sending is not available. Nothing is dispatched. The tracker, tranche plan, deterministic part ids and submit-once are built and tested; they are gated until:

1. the constraint is widened (or the code renamed) for `PROVIDER_PENDING_VERIFICATION`, `SETTLED`, `FAILED`, `REVERSAL_DETECTED`, `REFUNDED`;
2. a quote route returns the FX rate and fee in the group's currency (today the rate is a hardcoded ternary: KES 130.50, UGX 3700, GHS 15.50);
3. a status source exists for payout orders (they are created without `activation_secret_hash`, so `payment-orders/status` returns 403 for them);
4. idempotency exists (`orderId` is `ord_ms_<timestamp>_<random>`; the PEN-25 test asserts on a local Map, not the route).

When those land, the tracker already maps `OFFRAMP_INITIATED → PROVIDER_PENDING_VERIFICATION → SETTLED｜FAILED｜REVERSAL_DETECTED`, and a 422 telco-ceiling response re-plans the split with the server's `maxAllowedMinor`.

### 7.5 Statements, disputes, streaks

Statement export and the money trail are wired to `communities/statement` (NDJSON and CSV). Disputes post to `payment-orders/dispute`. Streaks read the public streak routes. All correct against the code; only the shims are missing (and the dispute uniqueness rule).

---

## 8. Email, SMS, WhatsApp, push

### 8.1 Mail configuration

- Provider: SendGrid via `@sendgrid/mail` in `app/api/_lib/mail.ts`. Env: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` (default `Baraza Protocol <no-reply@barazaprotocol.com>`). Unset or `mock_`-prefixed key ⇒ silent mock success.
- From: `no-reply@barazaprotocol.com` (send-only). Support: `hello@barazaprotocol.com` (needs a real inbox; Cloudflare Email Routing per the handoff, recipient updated in docs commit `42d969c`).
- DNS: SendGrid domain authentication (DKIM CNAMEs, SPF include), DMARC `p=none` then `quarantine`.
- Templates: `app/emails/catalog.json` (ids, subjects, variables), `app/emails/html/*.html`, `app/emails/text/*.txt`, generator `app/emails/render.mjs`. Rendering fills `{{var}}` plus defaults `support_email`, `site_url`, `year`.
- Logo: templates reference `https://www.barazaprotocol.com/logo`. `app/public/logo.png` and the `_redirects` rule `/logo /logo.png 200` exist **on `front-end`**; the `backend` branch deleted `logo.png`. Keep the frontend's copy on merge, and note `_redirects` is a Pages feature that only works once Pages serves the app.
- The preview gallery now renders to `app/emails/preview/` and is not part of the build.

### 8.2 Template catalogue and wiring

| Template id | Subject | Trigger (per handoff) | Variables | CTA → frontend route | Sent by code today |
|---|---|---|---|---|---|
| `signup-otp` | Your Baraza code | signup request | `otp`, `expires_minutes`, `email` | none | **yes** (`auth/signup/request`) |
| `signin-otp` | Your Baraza sign in code | signin request | + `device`, `browser`, `location`, `signed_in_at` | none | **yes** (placeholder device text) |
| `signin-new-session` | New sign in to your Baraza account | every successful sign-in | `device`, `browser`, `location`, `signed_in_at`, `action_url` | `/account` | no |
| `account-welcome` | Welcome to Baraza | first signup | `first_name`, `action_url` | `/home` | no |
| `vote-cast` | Your vote in {{community_name}} was recorded | vote saved | `community_name`, `proposal_title`, `decision`, `action_url` | `/dashboard/:id/votes/:decisionId` | no |
| `dues-reminder` | Dues reminder for {{community_name}} | cron | `community_name`, `amount_label`, `due_date`, `action_url` | `/dashboard/:id/pay` | no (no cron) |
| `member-welcome` | You are a member of {{community_name}} | membership active | `community_name`, `admin_phone`, `action_url` | `/dashboard/:id` | no |
| `proposal-created` | New proposal in {{community_name}} | proposal created | `community_name`, `proposal_title`, `action_url` | `/dashboard/:id/votes/:decisionId` | no |
| `payment-confirmed` | Payment confirmed for {{community_name}} | order confirmed | `community_name`, `amount_label`, `action_url` | `/dashboard/:id` | no |
| `membership-activate` | Activate your {{community_name}} membership | paid, account unlinked | `community_name`, `amount_label`, `action_url` | `/join/:id/status?orderId=…` | no (USSD sends an SMS with the same link, **with the activation secret in the query string**) |
| `community-invite` | {{inviter_name}} invited you to {{community_name}} | invite with email | `community_name`, `inviter_name`, `action_url` | `/join/:id?invite=<code>` | no |
| `payout-approval` | Payout needs your approval in {{community_name}} | disbursement created | `community_name`, `amount_label`, `recipient_name`, `payout_id`, `action_url` | `/dashboard/:id/money` | no |
| `payout-settled` | Payout settled for {{community_name}} | webhook settled | same | `/dashboard/:id/money` | no |

Hook points for the eleven unsent templates: `governance/vote` (vote-cast), `governance/proposals` POST (proposal-created), `membership/activate` and the promote cron on `INDEXER_CONFIRMED` (payment-confirmed, member-welcome), `communities/invites` POST when an email is supplied (community-invite), `payments/minisend` (payout-approval), `webhooks/minisend` settled (payout-settled), `auth/verify` first signup (account-welcome) and every sign-in (signin-new-session), a new `cron/dues-reminders` (dues-reminder). `notification_outbox` exists but is write-only today (rows inserted as `SENT`; `dispatchOutboxNotification` has no caller and writes an `updated_at` column the table lacks).

### 8.3 SMS, WhatsApp, push

- **SMS** (Africa's Talking): claim codes and the USSD activation link are sent; the `formatVoteConfirmation`, `formatDuesReminder`, `formatMemberWelcome` strings in `app/src/lib/notifications/sms.ts` have no caller. Copy says `baraza.app`; emails say `barazaprotocol.com`. No auth OTP over SMS.
- **WhatsApp**: inbound webhook with an FSM in an in-process Map; no outbound send; Twilio dependency declared but unused.
- **Push**: the app now registers `public/sw.js`, subscribes with `pushManager` and posts the real `{subscription: {endpoint, keys: {p256dh, auth}}}`; the backend still has **no VAPID keys, no sender and no unsubscribe**. To ship: publish the VAPID public key as `VITE_VAPID_PUBLIC_KEY` and add a sender (`web-push`) that reads `user_push_subscriptions`.
- **Preferences**: `user_profiles.notification_preferences` JSON `{sms, whatsapp, email, push}` via `GET/PATCH /api/user/profile`. Default `email: false`; the handoff asks for `true` for custom-auth users. Auth OTPs must ignore preferences.

---

## 9. Direct data access and RLS

The browser reads these tables with the anon key (`lib/communities.ts`, `lib/memberships.ts`, `lib/payments.ts`, `lib/knowledgeGraph.ts`):

| Table | Policy | Frontend use | Note |
|---|---|---|---|
| `communities` | public select | Browse, group load | column-list drift (§5.5) |
| `memberships` | public select, `phone_hash` revoked at column level | fallback when the memberships API fails | select an explicit column list |
| `proposals` | public select, trigger-maintained tallies | **should** replace the local decisions store | |
| `payment_orders` | **closed** (`USING (false)`) | none; use `payment-orders/status` | correct |
| `votes` | closed (no policy) | none | ballots private |
| `journal_entries` | public select | could back the money trail without the statement route | |
| `community_audit_logs` | public select | could back Recent Movement | |
| `user_profiles` | **public select, full row** including `phone_hash`, `google_sub` | none | privacy defect to raise |
| `community_invites` | public select | none | codes enumerable |
| `bounties`, `bounty_submissions` | public select **and insert** | local store only | lock down before enabling |
| `members` | requires `auth.uid()` | none | closed to anon in practice |
| RPC `accept_community_invite_atomic` | granted to anon | not used; the app uses the route | keep using the route (rate limit, audit) |

Synthetic data: `lib/dataStore.ts` seeds members, decisions and activities only when `import.meta.env.DEV`; production has an empty store. Votes and activity now read the public tables whenever Supabase is configured and only fall back to the store without a database (local dev). People is the one list with no source and says so.

---

## 10. Gaps and asks

### 10.1 Backend blockers (ordered)

1. Choose and implement the host for `/api/*`; add cron triggers (`promote-orders` every 5 min, `reconcile-treasury`, `monitor-compliance` daily, `settle-retro-allocations`).
2. Migration: `user_profiles.email UNIQUE`, `role`, `is_active`; relax `chk_user_profiles_identity_present` to include `email` or `google_sub`. Let `user/profile`, `user/memberships` and `push-subscribe` accept a `userProfileId` identity (today they 401 for Baraza-session callers). Check Google `aud`. Stop writing the OTP to the outbox. Add the SMS channel to the auth routes or state that phone sign-in stays on Privy for now.
3. Real STK initiate route (Daraja `stkpush` server-side) returning `{orderId, activationSecret}`; point `MPESA_CALLBACK_URL` at a Daraja-shaped handler.
4. Widen `payment_orders_status_chk` for the five missing statuses (or rename the writes); give payout orders a readable status (an officer-scoped `GET /api/payments/minisend/:orderId` or a secret); a payout quote route; body-level idempotency on `payments/minisend`.
5. Governance: shim or bundle `proposals`, `vote`, `finalize`; fix `memberships.status=eq.active` → `ACTIVE`; resolve `votes.member_id` from the caller's membership; fix `execute` journal account names and `proposal_type`.
6. Members list route (`GET /api/communities/:id/members`) or a documented anon-safe view; officer list comes from the same source.
7. Add the 22 missing shims if the shim model survives; otherwise delete `api/`.
8. `inviteUrl` host and path (`https://barazaprotocol.com/join/<communityId>?invite=<code>`); `wrangler.toml` `VITE_SITE_URL` and Stellar network; unify `AT_*`/`AFRICASTALKING_*`; `KOTANI_API_KEY` typo in `health/ready`.
9. Send the eleven remaining templates at the hook points in §8.2; `dues-reminders` cron; VAPID keys, a push sender that reads `user_push_subscriptions`, and an unsubscribe route.
10. RLS: restrict `user_profiles` columns; revoke anon insert on `bounties*`; revisit `community_invites` select; `payment_disputes.order_id` uniqueness.

### 10.2 Backend asks carried over from the frontend audit (`docs/frontend-post-login-audit.md` Appendix D and §11)

Payout quote in the group currency; split balances (reserved / available) in the memberships or a balances payload; the real STK initiate; invite creation reachable (shim); bulk member import endpoint (`CsvImport.tsx` stays unwired until then); licence file upload or an explicit "URL only" ruling; launch-quote endpoint or a "no fee" ruling; `GET /api/user/memberships` to carry `nextContribution` and `openProposalCount`; officer list shape.

### 10.3 Frontend work remaining (owned by us)

Everything from the 13 Sept hardening list is done (§14). What is left depends on backend delivery:

1. Flip `VITE_AUTH_PROVIDER=baraza` once the `user_profiles` migration and the `userProfileId` acceptance on `user/*` land; then remove Privy and the `@privy-io/react-auth` dependency.
2. Point the single Pay and Join call site at the real STK initiate route and add the "Check your phone" copy.
3. Replace the `requestPayoutQuote` stub with the quote route and read payout status from wherever the backend exposes it.
4. Add the members list when the route exists; the People and officer screens already have the empty state and the row component.
5. Reinstate the verification-tier branch on Join if the column is added.
6. Verify end to end against a deployed API (every contract test here mocks the documented shapes).

## 11. Environment matrix (must be true in production)

| Setting | Production value |
|---|---|
| `NODE_ENV` | `production` (gates test-header auth bypass and cookie `Secure`) |
| `MPESA_SIMULATOR_ENABLED`, `MPESA_SIMULATOR_SECRET` | unset |
| `VITE_ENABLE_PAYMENT_SIMULATOR` | unset (also gated by `DEV`) |
| `SENDGRID_API_KEY` | real, not `mock_*` |
| `AT_API_KEY` / `AFRICASTALKING_API_KEY` | real (missing ⇒ silent SMS no-op) |
| `STELLAR_NETWORK`, `VITE_STELLAR_NETWORK` | `mainnet` (`wrangler.toml` still says `testnet`) |
| `VITE_SITE_URL` | `https://barazaprotocol.com` (`wrangler.toml` says `https://baraza.app`) |
| `VITE_BASE_TESTNET`, `VITE_GOODDOLLAR_ENABLED` | `false` |
| `PAYMENT_ADAPTER_PROXY_SECRET`, `CRON_SECRET`, `STELLAR_INTENT_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `OTP_PEPPER`, `MPESA_PASSKEY` | rotated from the committed placeholders |
| `PRIVY_APP_ID`, `BRZA_PRICE_USD`, `MINISEND_WEBHOOK_SECRET`, `KOTANI_WEBHOOK_SECRET`, `COMPLIANCE_REVIEW_SECRET`, `GOOGLE_OAUTH_CLIENT_ID` | set |
| Security headers | `app/public/_headers` now ships CSP, HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`. Add a `connect-src` entry before adding a provider. |

---

## 12. Where the documents disagree

| Topic | Says A | Says B | Code |
|---|---|---|---|
| M6 / Main-4 status | `10-backend-audit-m1-m6`: "simulated or gated by simulator paths"; `status-result`/`status-timeout` "absent" | `BACKEND_SCOPE_OF_WORK.md`: webhook ingress "100%… `status-result.ts`" | Both callbacks exist. No initiate route. Cron unscheduled. |
| Sprint P2/P4 content | P1–P8 table: P2 = SASRA, P4 = ledger + reconciler | Phase reports: P2 = governance, P4 = SASRA, P5 = reconciler | Reports match code. |
| Polling contract | PRD `POST /api/payment-orders/status` until `MEMBERSHIP_ACTIVE` | Payment-Flow doc `GET /api/payments/status?order_id` | `GET /api/payment-orders/status?orderId` with `x-activation-secret`; terminal `INDEXER_CONFIRMED`/`RECONCILED`. |
| Payout statuses | PRD/P3: `OFFRAMP_INITIATED → PROVIDER_PENDING_VERIFICATION → SETTLED｜FAILED｜REVERSAL_DETECTED` | Migration 032 constraint lacks four of them | Writes fail. |
| Quorum | PRD "> 50% required" | P2: default 2000 bps = 20% | 20%, halved when unanimous. |
| Platform fee | PRD and P1: 2.0% | Payment-Flow doc UI copy: 2.5% | `feeEngine.ts`: 2.0%, carrier 0.5% capped KES 200. |
| Hosting | Deployment Runbook, DevOps Matrix, README: Vercel Pro | Cloudflare Infrastructure doc and 31 Aug purge guide: Cloudflare Pages and Workers | CI deploys static Pages only; no Functions. |
| Hostname | emails, CORS allowlist: `barazaprotocol.com` | SMS copy and `wrangler.toml`: `baraza.app`; invites: `baraza.network` | Three hostnames hardcoded. |
| Auth | PRD (25 Aug), P6 (4 Sep): Privy | Handoff (7 Sep): leave Privy for member login | Both accepted server-side; custom signup blocked by schema. |
| Routes count | `BACKEND_CODE_MAP.md`: 58 routes, 37 migrations, list ends at 037 | — | 64 handlers, 39 migration files to 038 (`015`, `025` absent). |
| PRD endpoints that do not exist | `GET /api/communities?id`, `POST /api/stellar/cast-vote`, `/api/user/notifications/preferences`, `/api/user/avatar-upload`, `/api/communities/[id]/{roadmap,suggestions,bounties,members,audit-log}`, `/api/user/receipt/[orderId]`, multisig approval | — | none exist; `officers`, `statement`, `dispute` exist at flat paths with ids in the body or query |

---

## 13. Proposed alignment for next sprint

**Backend (in this order):** host decision and Functions/cron wiring → auth schema migration and `aud` check → STK initiate route and callback target → status constraint, payout quote, payout status and idempotency → governance fixes and shims → members list route → templates wired at hook points.

**Frontend (parallel):** done on 13 Sept (§14) except the flag flip and the two call-site swaps that wait on backend routes. Next: merge `front-end` → `dev`, then integration testing against the deployed API.

**Joint, first hour of the sprint:** confirm the host, the `verification_tier` question, the invite URL format, the single production hostname, and whether phone sign-in stays on Privy during the transition.

---

## 14. Frontend hardening pass, 13 September 2026

Done on `front-end` after this document was first written. Each item was verified by typecheck, lint, the unit and contract suites, a production build, and a browser pass in both themes.

| # | Item | Where |
|---|---|---|
| 1 | One API client: `VITE_API_BASE`, bearer from the registered provider, normalised errors, submit-once guard | `lib/api.ts`, `lib/auth/tokenProvider.ts`, `hooks/useSubmitOnce.ts`; every `/api/*` call site migrated |
| 2 | Browse query fixed: only real `communities` columns | `lib/communities.ts` `COMMUNITY_COLUMNS` |
| 3 | Contract tests against the documented shapes | `lib/__tests__/api.test.ts`, `authBaraza.test.ts`, `proposalsContract.test.ts`; updated page tests |
| 4 | Votes from the public `proposals` table, Propose via the API, tie extension label | `lib/proposals.ts`, `hooks/useProposals.ts`, `lib/myVotes.ts` |
| 5 | Recent Movement from `community_audit_logs` | `lib/activity.ts`, `hooks/useProposals.ts` |
| 6 | People and officer list honest about the missing roster | `components/community/MemberDirectory.tsx`, `pages/GroupSettings.tsx` |
| 7 | Baraza sign-in behind `VITE_AUTH_PROVIDER` | `lib/auth/baraza.ts`, `lib/auth/provider.ts`, `contexts/AccountContext.tsx`, `components/auth/AuthModal.tsx` (view + two providers) |
| 8 | Google Identity Services button | `components/auth/GoogleIdentityButton.tsx` |
| 9 | Error copy for `account_exists`, `user_not_found`, `incorrect_code` with attempts, `too_many_attempts`, signed-out-elsewhere on 401 | `lib/auth/baraza.ts`, `lib/api.ts` |
| 10 | Polling backoff 2.5 s → 15 s after a minute | `lib/polling.ts`, Join Status, Pay |
| 11 | Payout tracker on real statuses, split plan, deterministic part ids | `lib/payouts.ts`, `pages/GroupMoney.tsx` |
| 12 | 503 read as "not set up", never retry | `lib/api.ts` |
| 13 | One-Time Fee at creation | `pages/CreateCommunity.tsx` |
| 14 | Web Push with a service worker and the real payload | `lib/push.ts`, `public/sw.js` |
| 15 | Log Out confirms on the Account page | `pages/Profile.tsx` |
| 16 | Pages security headers | `public/_headers` |
| 17 | Email preview gallery out of the build | `emails/render.mjs` → `emails/preview/` |
| 18 | `.env.example` covers every `VITE_` the code reads | `app/.env.example` |
| 19 | Hook rename (`useStoreCommunities`), dead status kinds removed, dead tier branch removed | `hooks/useBarazaData.ts`, `lib/statusPages.ts`, `pages/JoinDao.tsx` |
| 20 | Axe pass both themes; commit series | see below |

**Verification.** `tsc` clean for both configs; `eslint` 0 errors; vitest 857 passing with the same 65 pre-existing failures (Supabase-only suites and the local-URL assertion); `vite build` green with `_headers`, `_redirects`, `_routes.json`, `sw.js` and `logo.png` in `dist` and no `emails/` folder. Axe (WCAG 2.0 A/AA, 2.1 AA) on `/`, `/groups`, `/dashboard/1`, `/dashboard/1/votes/1`, `/join/1`, `/help`, `/status`, `/admin` in dark and light: zero violations after fixing the landing footer band (white on orange, 2.7:1, now dark ink) and exposing the wordmark as one `role="img"`. The single remaining report is the orange "Baraza" in the logotype on white backgrounds (2.78:1). Logotypes are exempt from WCAG 1.4.3 and the mark is unchanged by decision.

## 15. Production polish against BRZ-FE-SPEC-2026-001, 17 September 2026

Simon's *Frontend Production Excellence Specification* (`baraza-protocol-docs/03-delivery-specs/FRONTEND_PRODUCTION_EXCELLENCE_SPECIFICATION.md`, 16 September) lists twelve tickets. This pass implemented everything the frontend can do on its own, on `front-end` after merging `origin/dev`, as one PR back to `dev`. Where a ticket needs something the backend does not expose yet, the frontend says so on screen ("Not available yet") rather than inventing it, and the gap is recorded below.

### 15.1 Ticket status

| Ticket | Status | What shipped | Where |
|---|---|---|---|
| FE-1.1 Branded 404 | Done | `StatusScreen` "Page Not Found. Ukurasa Haupatikani.", Back to Home (`/home` when signed in), Browse Groups, the missing path, Protocol Status link, Ask Akili prompt | `pages/NotFound.tsx` |
| FE-1.2 Route prefetch and skeletons | Done | One `ROUTE_CHUNKS` map feeds `React.lazy` and hover/focus/touch prefetch on every nav link (honours Save-Data); `PageLoader` is a layout skeleton with `role="status"` | `lib/routePrefetch.ts`, `components/PageLoader.tsx`, `GroupSidebarNav`, `AppShell` |
| FE-2.1 Debounced search and typology filter | Done (already had filters) | 300 ms debounce writes `?q=`; "Showing X of Y groups" | `pages/Communities.tsx` |
| FE-2.2 Action-oriented empty state | Done | "No Group Called “q” Yet" with **Start This Group** carrying the name into `/create?name=` | `pages/Communities.tsx`, `pages/CreateCommunity.tsx` |
| FE-3.1 Proposal validation and budget guard | Done | Days 1–30 chips, amount ≤ available (from `liquid_vault_balance_minor`, else total), Preview/Edit with safe markdown-lite | `pages/CreateDecision.tsx`, `lib/markdownLite.tsx` |
| FE-3.2 Live quorum bar and optimistic ballot | Done | Segmented support/object bar with quorum marker, "Quorum Reached (X%)" pill, +1 optimistic tally while sending, rollback and retry on failure | `pages/ProposalDetail.tsx` |
| FE-4.1 Carrier health indicator | Done for the health line; **countdown and Paybill fallback blocked** | `RailHealthLine` above the phone field on Join and Pay, fed by `GET /api/health/ready` | `hooks/useRailHealth.ts`, `components/app/RailHealthLine.tsx` |
| FE-4.2 Statement and CSV export | Done | Date-range chips (This Month, Last Month, 3 Months, Year, All) on the export; Reserved and Available read the encumbered and liquid balance columns when the API returns them | `pages/GroupMoney.tsx`, `lib/communities.ts` |
| FE-5.1 Session expiry with form preservation | Done | A 401 after a working session opens the sign-in sheet with a notice, and `apiFetch` replays the original request once after re-auth, so a drafted proposal is never lost | `lib/api.ts`, `lib/auth/tokenProvider.ts`, `contexts/accountShared.ts` |
| FE-5.2 Multi-chain network banner | **Blocked** | Nothing in the community row or any endpoint says which chain a group settles on or whether EVM contracts are `NOT_DEPLOYED`; see 15.3 | — |
| FE-6.1 WCAG 2.1 AA and touch targets | Done at 48 px | Every button, chip, icon button and nav slot is 48 px on phones (36 px only from `sm` for secondary chips); Lighthouse accessibility 98–100 on the four measured routes | `components/ui/button.tsx`, `filter-chips.tsx`, `index.css`, 18 screens |
| FE-6.2 Offline queue and network banner | Done for the banner and reconnect refresh; **mutation queue deliberately not built** | Offline banner, green "Back Online" banner for 4 s, `baraza:online` event reloads vote lists; see 15.3 | `contexts/OfflineContext.tsx`, `components/OfflineBanner.tsx`, `hooks/useProposals.ts` |

### 15.2 Performance work (the acceptance gate)

Lighthouse 13, mobile emulation with the default simulated throttling (Slow 4G: 150 ms RTT, 1.6 Mbps), against `vite build` served by `vite preview`. The spec says "Fast 3G"; Lighthouse's Fast 3G preset has a 562 ms RTT and is not its default, so these numbers use the tool's standard mobile run. The same runs on the same commit are reproducible with `CHROME_PATH=… npx lighthouse http://localhost:4173/<route> --only-categories=performance,accessibility,best-practices,seo`.

| Route | Before (perf / a11y / BP / SEO) | After | FCP | LCP | CLS |
|---|---|---|---|---|---|
| `/` | 61 / 98 / 77 / 92 | **83 / 99 / 100 / 100** | 2.6 s | 4.1 s | 0 |
| `/groups` | 61 / 98 / 77 / 92 | **90 / 98 / 100 / 100** | 2.7 s | 3.0 s | 0.01 |
| `/dashboard/1` | — | **87 / 100 / 100 / 66** | 2.7 s | 3.4 s | 0 |
| `/help` | — | **91 / 100 / 100 / 100** | 2.6 s | 2.9 s | 0 |

The `/dashboard/*` SEO score is intentional: group pages carry `noindex` (`GroupWorkspace.tsx`), so the "page is blocked from indexing" audit fails by design. JavaScript on Browse fell from 2,112 KiB to about 120 KiB gzipped on the critical path.

What changed, in order of effect:

1. **Wallet code off the visitor path.** The Privy SDK mounts only when a session hint exists or on the first Sign In tap (`PrivyAccountProvider` is lazy); the Solana wallet adapter mounts only under operator routes (`OperatorArea`); `useBarazaData` lost its chain legs. The Buffer polyfill moved from `main.tsx` to the three modules that load wallet SDKs.
2. **Chunking under Vite 8 (rolldown).** Rolldown's `manualChunks` shim also captures a matched module's dependencies, which put React itself inside a framer-motion chunk on one attempt and the Buffer polyfill inside `solana-web3` on another. Every shared dependency now has its own rule (`buffer-polyfill`, `noble-crypto`, `scure-crypto`, `react-vendor` including the router packages); framer-motion is left to default splitting so it only travels with the Akili panel and the landing sections that use it. `modulePreload` is back on so the entry graph downloads in parallel.
3. **No third-party stylesheet on first paint.** Geist and Geist Mono are self-hosted variable fonts (`@fontsource-variable/*`, `font-display: swap`, latin subsets on demand); the Google Fonts request that blocked rendering for about 1.2 s on Slow 4G is gone, and `font-src`/`style-src` in the CSP no longer name Google's hosts.
4. **Landing page split.** The hero renders its copy statically (no fade-in from zero, which had been holding the LCP until the motion chunk arrived); the polaroid gallery loads behind a same-size skeleton, everything below the hero is one lazy chunk, and the Akili panel is lazy too. Landing photos are WebP at the size they render (1.7 MB → 0.5 MB total).
5. **zod out of the entry.** `lib/env.ts` validates nine strings with 60 lines of plain code instead of an 18 KiB-gzipped schema library.
6. **Content-Security-Policy fixed for the inline theme script.** The `_headers` policy allowed `script-src 'self'` only, which on Cloudflare would have blocked the inline theme bootstrap and produced a flash of the wrong theme plus a console violation on every load. The script is now allowed by hash, and a test fails if the script or the hash drifts.
7. **Per-route Early Hints.** A build plugin appends `Link: <chunk>; rel=modulepreload` lines to the published `_headers` for `/`, `/groups`, `/help`, `/home` and `/dashboard/*` with the hashed chunk names of that route and its private imports. Cloudflare Pages sends these as 103 Early Hints, which removes the one round trip that `vite preview` still shows between the entry executing and the page chunk arriving. This cannot be measured locally; it should lift the production numbers above the local ones.

**Honest reading of the gate.** The four routes measure 83–91 locally against the spec's ≥ 92. What remains is the network shape of a single-page app on a 150 ms RTT link: HTML → CSS and the entry graph (about 120 KiB gzipped, of which React and the router are 54) → the route chunk → paint. Point 7 addresses the last hop in production. Going further means either server rendering the first screen or dropping React Router, both of which are architecture decisions rather than polish, and neither belongs in this PR.

### 15.3 Pushback and corrections for the spec

- **FE-4.1 countdown and Paybill fallback.** The frontend has no signal to count down against: `POST /api/payment-orders` returns an order id and a status, not the STK timeout or a Paybill number for the group. The health line shipped; the 60-second countdown and "pay manually via Paybill" need the order response to carry `stk_expires_at` and the community row to carry a Paybill (it is "Not Set" in Settings today because nothing returns it). Building either against a hard-coded 60 s or a made-up Paybill would be exactly the kind of invented data the rest of the app removed.
- **FE-5.2 EVM gasless badge.** No endpoint or column says which chain a community settles on or whether EVM contracts are deployed. Rendering "Gasless Staging Mode" from nothing would be a false status. Ask: a `settlement` object on the community row (`chain`, `contracts_state`).
- **FE-6.1 48 px vs WCAG.** WCAG 2.1 AA (2.5.5 is AAA; 2.5.8 in 2.2 is AA) asks for 24 px minimum with spacing, and the widely used platform guidance is 44 px (Apple) / 48 dp (Material). We went to 48 px on phones for the whole app because the audience is phone-first; the spec should cite 2.5.8 / platform guidance rather than "WCAG 44 px", which does not exist as a criterion.
- **FE-6.2 offline mutation queue.** Deliberately not built. Queuing a vote or a payment while offline and replaying it later is unsafe for money: the vote window may have closed, the dues may have been paid on another phone, and an STK prompt cannot be "queued". The banner tells the person to reconnect and the lists refresh themselves on reconnect. If a queue is wanted for idempotent writes only (drafts), it needs idempotency keys on the API first.
- **Header corrections.** The repository is `app/` (not `apps/web`) on React 18.3 and Vite 8, and `FIFTH_PASS_RECURSIVE_COMPONENT_PRODUCTION_READINESS_AUDIT.md` is not in `baraza-protocol-docs`. Please add the audit or drop the reference.
- **How was 96.4% measured?** The spec's "Current Rating: 96.4% (Grade A)" has no method, tool or route list attached. If it is a Lighthouse figure, the runs above are the reproducible baseline; if it is a rubric, please share it so the target can be checked the same way.

### 15.4 Verification

`tsc --noEmit -p tsconfig.app.json` clean; `eslint .` 0 errors (45 pre-existing `react-hooks/set-state-in-effect` warnings, none introduced); frontend vitest 259 passing across 28 files (the Docker-only backend suites, including `postPr89IntegrationBridge.test.ts` from `dev`, still need the local API and are not part of this gate); `vite build` green with the generated `_headers`. Browser pass on the production build: 404 page, offline and back-online banners, 320 px width without horizontal scroll on `/`, `/groups` and `/dashboard/1`, the sign-in sheet loading Privy lazily without console errors, the polaroid gallery and WebP photos rendering, buttons measured at 48 px.

---

## 16. Post-PR #92 & #93 Convergence & Eighth-Pass Forensic Audit (17 September 2026)

Following the merge of PR #92 (Backend Enterprise Hardening) and PR #93 (Frontend Production UI Refactoring) into `dev`, a comprehensive Eighth-Pass forensic audit was conducted across all 70 backend endpoints, all 30 frontend page screens, and the Cloudflare edge deployment pipeline.

### 16.1 DevOps & Edge Deployment Architecture (Showstopper)
1. **Cloudflare Pages SPA Routing Fallback:**
   - CI deploys via `wrangler pages deploy app/dist --project-name=baraza-protocol --branch=main`.
   - `app/dist` contains only the client-side SPA bundle. There is no `functions/` directory and no compiled `_worker.js`.
   - In production, any relative fetch to `/api/*` returns `index.html` with HTTP 200, causing `JSON.parse` in `lib/api.ts` to crash with `SyntaxError: Unexpected token '<'`.
   - **Resolution Architecture:** Bundle `cloudflare/worker.ts` into `app/dist/_worker.js` (or deploy `app/functions/api/[[catchall]].ts`) mounting all 70 `app/api/**` handlers.
2. **Cron Trigger Inactivity:**
   - The cron triggers declared in `wrangler.toml` (`*/5 * * * *`, `*/10 * * * *`) and implemented in `cloudflare/worker.ts:scheduled` do not execute on Pages static deploys.
   - `cron/promote-orders` never runs automatically; payments confirmed on-chain or via webhooks stall before reaching `RECONCILED`.
3. **Queue Consumer Absence:**
   - Webhook ingress queue `WEBHOOK_QUEUE` is declared in `wrangler.toml`, but webhooks under `app/api/webhooks/*` process requests synchronously.

### 16.2 Cryptographic Multi-Chain Wallet Proof Bridge
1. **Production Proof Requirement:**
   - In non-test environments (`!isTestEnv`), `app/api/governance/vote.ts`, `app/api/governance/execute.ts`, and `app/api/communities/index.ts` require cryptographic wallet signatures (`x-wallet-address`, `x-wallet-signature`, `x-wallet-message`).
2. **Frontend Omission:**
   - `useCastVote` in `hooks/useBarazaData.ts` and `GroupMoney.tsx:approve()` dispatch raw HTTP requests with no proof headers.
   - All production voting and proposal execution requests return `401 Unauthorized`.
3. **Wallet Proof Client Limitation:**
   - `app/src/lib/walletProof.ts` currently only implements Solana wallet signing; Stellar (Freighter) and EVM (Wagmi) signers are unsupported, and purposes `'vote'`, `'execute-proposal'`, and `'treasury-init'` are omitted from `WalletProofPurpose`.

### 16.3 Polymorphic Authentication Resolution
1. **`resolveCallerIdentity` Defect:**
   - In `app/api/_lib/auth-session.ts`, when a user authenticates via `BARAZA_SESSION`, the returned identity object only contains `{ userProfileId, email, authMethod: 'BARAZA_SESSION' }`. `walletAddress` and `privyDid` are left undefined.
2. **Downstream Rejection:**
   - Handlers like `communities/officers.ts` and `user/notifications/push-subscribe.ts` check `if (!identity.walletAddress && !identity.privyDid) return 401;`.
   - Valid session users are locked out of officer assignments and web push registration.
   - **Resolution:** Include `user_profiles(wallet_address, privy_did)` in session lookup and permit `userProfileId` in route authorization checks.

### 16.4 Live Payment Rails vs. Simulator
1. **M-Pesa STK Push Route:**
   - `app/api/mpesa/stk-push.ts` is fully implemented for live Safaricom Daraja Express (rate limiting, circuit breaker, phone normalization, order persistence).
2. **Frontend Hardcoding:**
   - `GroupPay.tsx` and `JoinDao.tsx` hardcode calls to `/api/mpesa/simulate` and show "Rail Unavailable" if `isPaymentSimulatorEnabled()` is false.
   - Staging and production users cannot trigger real Daraja STK pushes.

### 16.5 Orphaned Subsystems & Wiring Gaps
1. **Member Directory Roster:**
   - `app/api/communities/members.ts` provides paginated roster queries with activation status and roles.
   - `MemberDirectory.tsx` displays "Member List Not Available Yet" because `useMembers` queries the synthetic in-memory store `dataStore.ts`.
2. **Payout Quoting Engine:**
   - `app/api/payments/quote.ts` implements SASRA reserve checking and HMAC quote tokens.
   - `lib/payouts.ts:requestPayoutQuote()` returns `null`.
   - Discrepancy: `quote.ts` signs using `PAYMENT_QUOTE_SECRET`, while `minisend.ts` verifies against `PAYOUT_QUOTE_SECRET`.
3. **Root `api/` Shim Desynchronization:**
   - 28 endpoints from `app/api/` are missing from the root `api/` re-export directory.


## 17. 18 September 2026: join flow, account, photos and logos

Documented in full in `docs/FRONTEND_HANDOFF_2026-09-18.md`: payment method chooser on Join (M-Pesa, Airtel Money, Card / Bank, Crypto), fee cards, centred join and create steps, Account layout with Log Out moved to the top bar menu, profile photo and group logo changes propagating to every tile, collapsible sidebar sections, theme-aware toasts, and the named shadow utilities that fixed shadows that never rendered. Backend asks: avatar and logo upload endpoints with `avatar_url` on member rows and `image_url` on community rows, real Airtel Money and card checkout endpoints, `rail` and `stkExpiresAt` on payment order status, per-rail health components.
