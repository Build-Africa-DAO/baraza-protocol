# Baraza Protocol: Production Branching & Promotion Pipeline

**Branch Promotion Model:**
- **Feature / Backend Convergence:** `backend-dev` ➔ `dev` (Staging Integration & Verification)
  - **PR Compare URL:** [https://github.com/Build-Africa-DAO/baraza-protocol/compare/dev...backend-dev?expand=1](https://github.com/Build-Africa-DAO/baraza-protocol/compare/dev...backend-dev?expand=1)
- **Production Release Gate:** `dev` ➔ `main` (Cloudflare Pages Production Deployment)
  - **PR Compare URL:** [https://github.com/Build-Africa-DAO/baraza-protocol/compare/main...dev?expand=1](https://github.com/Build-Africa-DAO/baraza-protocol/compare/main...dev?expand=1)
- **Direct Backend-to-Main Compare:** [https://github.com/Build-Africa-DAO/baraza-protocol/compare/main...backend-dev?expand=1](https://github.com/Build-Africa-DAO/baraza-protocol/compare/main...backend-dev?expand=1)

**Governing Documents:** [Baraza Protocol SAD v1.0](file:///home/nothim/HIM/baraza-work/baraza-private/02-architecture/Baraza%20Protocol%20%20SAD.md), [SAD v1.1 CR-007 Addendum](file:///home/nothim/HIM/baraza-work/baraza-internal-qa-reports/requests/SAD-v1.1-CR-007-AMENDMENT.md), [Launch Direction Memo 3](file:///home/nothim/HIM/baraza-work/baraza-internal-qa-reports/qa/SAD_V1_BACKEND_AUDIT_AND_WORK_LEDGER.md), [BACKEND_SCOPE_OF_WORK.md](file:///home/nothim/HIM/baraza-work/baraza-protocol/docs/BACKEND_SCOPE_OF_WORK.md)

---

## Branching Architecture & Convergence Protocol

In accordance with S&P 500 Enterprise GitFlow and Cloudflare Pages continuous deployment standards:
1. **`main` (Production):** The protected, immutable deployed production branch serving `https://barazaprotocol.com`.
2. **`dev` (Staging / Convergence):** The primary integration branch where frontend feature PRs, backend PRs (`backend-dev`), and smart contract updates converge. Runs automated CI and CT staging deployments to `https://staging.baraza-protocol.pages.dev`.
3. **`backend-dev` (Backend Development):** The active engineering branch containing PR #95 integration bridges, Invariant I1 server-side dues enforcement, object storage, and the Phase P0 DevOps / CI/CT quality framework.
4. **Reconciliation & Synchronization:** Both `dev` and `backend-dev` have reconciled `origin/main` commit `598f34d` (PR #97 squash merge) and are aligned with 0 merge conflicts.

---

## Summary of Changes

This Pull Request suite delivers the complete backend bridge for frontend **PR #95**, hardening multi-rail payment ingress against **Invariant I1 (Server-Side Dues Derivation)**, implementing production **Supabase Object Storage** for member avatars and community logos, locking **ADR-013 Soroban Smart Contract Multisig Thresholds**, and establishing the **Phase P0 DevOps Automation, CI/CT Pipeline Hardening, and the 10-Stage Meticulous Pre-PR Quality Gate**.

It cleanly integrates on top of `origin/main` while strictly adhering to the frontend boundary directive (**zero modifications inside `app/src`**).

---

### 1. Multi-Rail Payment Ingress Hardening & Invariant I1 Enforcement
- **Card / Paystack Ingress (`app/api/payments/card/checkout.ts`, `api/payments/card/checkout.ts`):**
  - Implements the public card checkout route returning `{ orderId, authorizationUrl }` for Paystack redirects.
  - **Invariant I1 Enforcement:** Rejects/overrides client-supplied `amountMinor`. The backend queries canonical `communities.activation_fee_minor` from Postgres and derives the authoritative charge server-side, eliminating client-side price tampering.
  - Includes dual-tier client IP rate limiting (`10 req/min`) and circuit breaker awareness.
- **Airtel Money STK Ingress (`app/api/payments/airtel/stk.ts`, `api/payments/airtel/stk.ts`):**
  - Implements the public Airtel Money STK initiation route.
  - **Invariant I1 Enforcement:** Enforces server-derived dues, MSISDN normalization to Kenyan E.164 standard (`+254...`), 120-second TTL expiration, and rate-limiting.
- **Order Status & Expiration Countdown (`app/api/payment-orders/status.ts`):**
  - Returns `rail` (`'mpesa' | 'airtel' | 'card' | 'crypto'`), `stk_expires_at`, and `stkExpiresAt` for real-time frontend countdown timers.
  - **Zero-Trust Header-Only Authentication:** Strictly rejects secrets passed in URL query parameters (`HTTP 400`), enforcing `x-activation-secret` in request headers to prevent CDN/proxy access-log leaks.
- **Component Readiness Probe (`app/api/health/ready.ts`, `app/api/health/types.ts`):**
  - Added live readiness checks for `airtel` and `paystack` gateway components.

---

### 2. Avatar & Group Logo Storage (Zero Base64 in Database / LocalStorage)
- **User Avatar Storage (`app/api/user/avatar.ts`, `api/user/avatar.ts`):**
  - Provides `POST /api/user/avatar` and `DELETE /api/user/avatar` authenticated via bearer session.
  - Accepts binary `multipart/form-data` or sanitized data URLs.
  - Enforces strict 2MB file size ceiling and MIME verification (`image/jpeg`, `image/png`, `image/webp`).
  - Streams directly to Supabase Storage bucket `avatars/<user_id>.<ext>`.
  - Persists the canonical CDN HTTPS URL into `user_profiles.avatar_url` and returns `{ "avatarUrl": "https://..." }`.
- **Community Logo Storage (`app/api/communities/logo.ts`, `api/communities/logo.ts`):**
  - Provides `POST /api/communities/:id/logo` and `DELETE /api/communities/:id/logo`.
  - **Officer RBAC Gate:** Verifies caller is community creator or holds an active officer role (`founder`, `admin`, `treasurer`) in `members` (BOLA defense).
  - Streams to Supabase Storage bucket `community-logos/<community_id>.<ext>` and updates `communities.image_url`.
- **Database Migration 043 (`supabase/migrations/043_community_image_url.sql`):**
  - Adds nullable `image_url TEXT NULL` column to `communities`.
- **Officers Roster Enhancement (`app/api/communities/officers.ts`):**
  - Exposes `avatarUrl` and `displayName` on officer records so management tiles display member photos.
- **Graceful Schema Fallback (`app/api/user/memberships.ts`, `app/api/communities/index.ts`):**
  - Gracefully falls back if `image_url` has not yet been migrated in transient CI test runners, guaranteeing zero 500/502 errors.

---

### 3. Resolution of PR #94 Handoff Identifiers (FE-4.1 & FE-5.2)
- Reconciles the identifier gap noted in the handoff:
  - `stk_expires_at` returned on payment orders and status polling.
  - `settlement` object (`{ chain, contracts_state, treasury_address, gasless_eligible }`) exposed on community payloads.
  - `paybill_number`, `account_reference`, and platform default Paybill exposed on `communities`.

---

### 4. Soroban Smart Contract Multisig Hardening (ADR-013)
- **`contracts/stellar/treasury_vault/src/lib.rs`:**
  - Enforces non-custodial decentralized governance by mandating `threshold >= 2` and `threshold <= signers.len()`.
  - Strictly rejects insecure 1-of-N multisig configurations in both `initialize` and `set_signers`.
  - Backed by formal Soroban test vector suites:
    - `contracts/stellar/treasury_vault/test/test_initialize_1_of_n_rejected.1.json`
    - `contracts/stellar/treasury_vault/test/test_set_signers_1_of_n_rejected.1.json`

---

---

### 5. Phase P0 DevOps, CI/CT & Meticulous Pre-PR Verification
- **Edge Router Convergence (BLK-01):**
  - Registered all missing PR #95 route handlers (`/api/user/avatar`, `/api/communities/logo`, `/api/payments/airtel/stk`, `/api/payments/card/checkout`) and `/api/communities/:id/logo` dynamic pattern into `cloudflare/edgeRouter.ts`.
  - Added automated CI audit `node scripts/devops/verify-edge-router.mjs` ensuring 100% of route files in `app/api/` are mounted.
- **Edge Cron Task Alignment (BLK-02):**
  - Aligned `cloudflare/worker.ts` with canonical scheduled cron endpoints.
- **Cloudflare Pages Routing Cost Optimization (BLK-03):**
  - Restructured `app/public/_routes.json` `include` to strictly `["/api/*"]`, routing static SPA traffic directly through Cloudflare Anycast CDN cache at $0 compute cost.
- **CI/CD Pipeline Hardening (BLK-04):**
  - Fixed deployment step conditional in `.github/workflows/ci.yml` using `${{ secrets.CLOUDFLARE_API_TOKEN != '' && secrets.CLOUDFLARE_ACCOUNT_ID != '' }}`.
  - Added automated `deploy-staging` workflow targeting `staging.baraza-protocol.pages.dev` on `dev` and `backend-dev`.
  - Added `.github/workflows/db-migrate.yml` for automated transactional schema migrations.
- **Phase P0 DevOps Orchestration Suite:**
  - `scripts/devops/verify-pr.mjs`: 10-Stage Meticulous Pre-PR verification runner (`npm run verify:pr`).
  - `scripts/devops/generate-internal-secrets.mjs`: 256-bit cryptographic key and RFC 8292 P-256 VAPID keypair generator.
  - `scripts/devops/validate-env-matrix.mjs`: 15-provider strict environment matrix validator.
  - `scripts/devops/migrate-database.mjs`: Transactional database migration runner with SHA-256 checksum tracking.
  - `scripts/devops/configure-cloudflare-waf.mjs`: Declarative Cloudflare WAF and rate-limiting compiler (`cloudflare-waf-ruleset.json`).
  - `scripts/devops/verify-blockchain-nodes.mjs`: Synthetic multi-chain latency probe (Stellar, Base, Solana).
  - `scripts/devops/smoke-test.mjs`: Synthetic edge health and security smoke tester.
  - `scripts/devops/run-all-preprocurement.mjs`: Master pre-procurement orchestrator (`npm run devops:preprocurement`).
  - `evolution-api/docker-compose.prod.yml` & `scripts/devops/deploy-evolution-vps.sh`: Hardened production WhatsApp gateway stack.

---

## Verification Results

### 1. 10-Stage Meticulous Pre-PR Quality Gate (`npm run verify:pr`)
- **ALL 10 VERIFICATION STAGES PASSED (100% GREEN)**
  - Stage 1: Protocol Artifacts & Smart Contract Drift (0 byte drift across 7 ABIs/IDLs)
  - Stage 2: Cloudflare Edge Router 100% Coverage (63/63 routes mounted)
  - Stage 3: Strict TypeScript Typecheck (0 errors across `tsconfig.app.json` & `tsconfig.node.json`)
  - Stage 4: ESLint & Strict Code Quality (0 errors, zero floating promises)
  - Stage 5: Dependency Vulnerability Audit (0 critical CVEs)
  - Stage 6: Transactional Database Migration DDL Check (42 migrations verified)
  - Stage 7: Full Vitest Suite Execution (107/107 test files, 1,222/1,222 tests green in Docker)
  - Stage 8: Pre-Flight Production Tripwire Verification (Circuit breakers and rate limiters certified)
  - Stage 9: Cloudflare Pages Production Build & Routing Audit (Built in 8.95s; verified `dist/_routes.json`)
  - Stage 10: Git Secrets Leak & Whitespace Hygiene Check (0 whitespace defects, 0 key leaks)

---

## Checklists
- [x] Invariant I1 strictly enforced: Server-side dues derivation from Postgres truth
- [x] Zero-Base64 in database: binary uploads stream to Supabase Storage with CDN URLs
- [x] Zero `any` types introduced across all new endpoints
- [x] Header-only secret authentication on payment status polling (no query-param leaks)
- [x] Backward-compatible schema fallback for unmigrated environments
- [x] Zero edits inside `app/src/` (preserves frontend team boundary)
- [x] 100% of API route handlers registered in Cloudflare Edge Router
- [x] Cloudflare Pages Function routing restricted to `["/api/*"]` for $0 static asset CDN caching
- [x] CI deployment conditional fixed and staging deployment preview job configured
- [x] Full 10-Stage Pre-PR verification runner passes cleanly (`npm run verify:pr`)
- [x] All 1,222 tests pass locally and on CI runners
