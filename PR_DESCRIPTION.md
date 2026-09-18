# PR: PR #95 Integration Bridges, Invariant I1 Dues Enforcement, Object Storage & ADR-013 Multisig

**Source Branch:** `backend-dev`  
**Target Branch:** `dev`  
**PR Creation URL:** [https://github.com/Build-Africa-DAO/baraza-protocol/pull/new/backend-dev](https://github.com/Build-Africa-DAO/baraza-protocol/pull/new/backend-dev)  
**Governing Documents:** [Baraza Protocol SAD v1.0](file:///home/nothim/HIM/baraza-work/baraza-private/02-architecture/Baraza%20Protocol%20%20SAD.md), [SAD v1.1 CR-007 Addendum](file:///home/nothim/HIM/baraza-work/baraza-internal-qa-reports/requests/SAD-v1.1-CR-007-AMENDMENT.md), [Launch Direction Memo 3](file:///home/nothim/HIM/baraza-work/baraza-internal-qa-reports/qa/SAD_V1_BACKEND_AUDIT_AND_WORK_LEDGER.md), [BACKEND_SCOPE_OF_WORK.md](file:///home/nothim/HIM/baraza-work/baraza-protocol/docs/BACKEND_SCOPE_OF_WORK.md)

---

## Summary of Changes

This Pull Request merges `backend-dev` into `dev`, delivering the complete backend bridge for frontend **PR #95**, hardening multi-rail payment ingress against **Invariant I1 (Server-Side Dues Derivation)**, implementing production **Supabase Object Storage** for member avatars and community logos, and locking **ADR-013 Soroban Smart Contract Multisig Thresholds**.

It cleanly integrates on top of `origin/dev` (incorporating both PR #94 and PR #95) while strictly adhering to the frontend boundary directive (**zero modifications inside `app/src`**).

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

## Verification Results

### 1. Vitest Automated Test Suite
- **107 / 107** test files passed (**100%**)
- **1,222 / 1,222** unit and integration tests passed (**100%**)
- **Duration:** 191.27s
- Key suites passing green:
  - `master100ProductionStressSuite.test.ts` (127/127 tests)
  - `phaseP6SaaSIdentitySuite.test.ts` (39/39 tests)
  - `paymentOrderStatusApi.test.ts` (2/2 tests)
  - `sprint1Unblockers.test.ts` (15/15 tests)
  - `securityHardening.test.ts` (40/40 tests)

### 2. TypeScript Compilation
- `tsc --noEmit -p tsconfig.app.json` → **0 errors**
- `tsc --noEmit -p tsconfig.node.json` → **0 errors**

---

## Checklists
- [x] Invariant I1 strictly enforced: Server-side dues derivation from Postgres truth
- [x] Zero-Base64 in database: binary uploads stream to Supabase Storage with CDN URLs
- [x] Zero `any` types introduced across all new endpoints
- [x] Header-only secret authentication on payment status polling (no query-param leaks)
- [x] Backward-compatible schema fallback for unmigrated environments
- [x] Zero edits inside `app/src/` (preserves frontend team boundary)
- [x] All 1,222 tests pass locally and on CI runners
