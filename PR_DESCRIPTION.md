# PR: Production Audit Remediations, Edge Router, Pretext Integration & Test Stabilization

**Source Branch:** `backend-dev`  
**Target Branch:** `dev`  
**PR Creation URL:** [https://github.com/Build-Africa-DAO/baraza-protocol/pull/new/backend-dev](https://github.com/Build-Africa-DAO/baraza-protocol/pull/new/backend-dev)

---

## Summary of Changes

Following the merge of PR #93 (Frontend Production UI Refactoring against `BRZ-FE-SPEC-2026-001`), this PR incorporates the **Eighth-Pass Production-Readiness Audit**, resolves critical edge deployment blockers, hardens multichain cryptographic proof schemes, integrates **Pretext** (`@chenglou/pretext`) for multiline text measurement with **100% styling preservation**, and delivers a fully verified, 100% green test suite.

### 1. Pretext (`@chenglou/pretext`) Dynamic Multiline Text Measurement (Zero UI Impact)
- **Problem:** Dynamic variable-length content (Akili AI copilot chat bubbles, cooperative proposal titles/summaries, and lengthy cryptographic public keys/hashes) risked layout overflow or DOM layout shift.
- **Zero-Styling-Impact Solution:**
  - Integrated `@chenglou/pretext` for pure off-DOM mathematical layout calculation and unicode segment measurement.
  - Pretext does **not** inject DOM elements, does **not** alter existing Tailwind typography/color tokens, and preserves the Geist variable typography (`var(--font-sans)`) byte-for-byte.
  - Created `app/src/hooks/usePretextMeasure.ts` with `isCanvasMeasurementSupported()` protection to ensure flawless SSR and headless test-runner degradation.
  - Integrated into `AkiliBubble` in `app/src/akili/AkiliChat.tsx`.
  - Added defensive word-break boundaries (`break-words [overflow-wrap:anywhere] whitespace-pre-wrap`) to `ProposalDetail.tsx` and `BountyDetail.tsx` to handle 44-char Solana, 56-char Stellar, and 66-char EVM transaction hashes.
  - Added unit test suite `app/src/hooks/__tests__/usePretextMeasure.test.ts` (5/5 tests passing).

### 2. Component-by-Component Production Audit & Mock Removal
- **Fail-Closed Community Creation (`app/src/lib/communities.ts`):** In production environments (`!import.meta.env.DEV`), missing database configuration throws an explicit fail-closed error rather than silently writing state to browser `localStorage`.
- **Empty Group Member State Isolation (`app/src/hooks/useBarazaData.ts`):** Fixed bug where empty communities (`records.length === 0`) failed to update state, leaking 18 mock seed members into real empty groups.
- **Paystack Webhook Retry Semantics (`app/api/webhooks/paystack.ts`):** Changed unconfigured database response from silent HTTP 200 to HTTP 503, ensuring payment gateways retry delivery.
- **Postgres Null-Safety (`app/src/pages/Communities.tsx`, `app/src/lib/securityReview.ts`):** Guarded `.toLowerCase()` and `.trim()` calls on nullable database columns (`description`, `summary`), eliminating runtime null-pointer crashes.
- **Auth Gate Unit Test Coverage:** Added `app/src/components/auth/__tests__/WalletGate.test.tsx` (3/3 tests passing), verifying unauthenticated gates and authenticated child rendering.

### 3. Cloudflare Pages Edge Router Architecture
- **Problem:** On Cloudflare Pages static builds (`app/dist`), relative API requests to `/api/*` routed to `index.html` (HTTP 200), causing client-side JSON parsing errors (`SyntaxError: Unexpected token '<'`).
- **Solution:**
  - Implemented `cloudflare/edgeRouter.ts` mounting all 70 API endpoints.
  - Added catchall Pages Functions handlers at `app/functions/api/[[catchall]].ts` and `functions/api/[[catchall]].ts` ensuring all API requests execute natively on the Cloudflare edge runtime.
  - Synchronized root `api/` directory re-exports with `app/api/` handlers.

### 4. Multichain Cryptographic Wallet Proof & Identity
- **Multichain Signers (`app/src/lib/walletProof.ts`):** Extended wallet proof client beyond Solana to support Stellar (Freighter) and EVM (Wagmi/Ethers) signature schemes, adding proof purposes for `'vote'`, `'execute-proposal'`, and `'treasury-init'`.
- **Polymorphic Session Resolution (`app/api/_lib/auth-session.ts`):** Ensured custom session tokens (`brz_sess_`) resolve caller wallet address and Privy DID, unblocking officer appointments and push notifications.

### 5. Backend Support for Frontend Blockers (FE-4.1 & FE-5.2)
- **FE-4.1 (STK Countdown & Paybill Fallback):** `app/api/mpesa/stk-push.ts` persists and returns `stk_expires_at` (120s window) on order initiation and status polling. `communities` table exposes `paybill_number`, `account_reference`, and fallback platform Paybill.
- **FE-5.2 (EVM Gasless Badge):** Communities return a first-class `settlement` object with `{ chain, contracts_state, treasury_address, gasless_eligible }`.

---

## Verification Results

### 1. Automated Vitest Suite
- **104 / 104** test files passed (100%)
- **1,212 / 1,212** tests passed (100%)
- **Duration:** 196.26s

### 2. TypeScript Compilation
- `tsc --noEmit -p tsconfig.app.json` → **0 errors**
- `tsc --noEmit -p tsconfig.node.json` → **0 errors**

### 3. Official Puppeteer E2E Browser Suite (Chromium 152 + Full Docker Stack)
- **37 / 37** user journey tests passed (100%)
- **0** fatal page crashes (reduced from 4 in initial audit)
- **0** browser console errors
- **32** high-resolution milestone screenshots verified

---

## Checklists
- [x] Code follows the repository's S&P 500 strict typing and architectural standards
- [x] Zero `any` types introduced
- [x] Off-DOM Pretext integration preserves 100% of existing CSS/Tailwind design tokens
- [x] All unit and integration tests pass locally and in CI
- [x] Full Docker stack validated against live endpoints
