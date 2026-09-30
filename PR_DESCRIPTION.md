# Baraza Protocol: Commercial Launch Pricing, Transparent Dues Breakdown & Migration 044 Certification

**Branch Promotion Pipeline:**
- **Source (Head Branch):** `feat/qa-remediation-and-community-launch` (or `backend-dev`)
- **Target (Base Branch):** `dev` *(Canonical Staging Trunk)* or `main` *(Direct Production)*
- **GitHub PR Quick-Create Links:**
  - **Open PR into `dev`:** [https://github.com/Build-Africa-DAO/baraza-protocol/compare/dev...feat/qa-remediation-and-community-launch?expand=1](https://github.com/Build-Africa-DAO/baraza-protocol/compare/dev...feat/qa-remediation-and-community-launch?expand=1)
  - **Open PR into `main`:** [https://github.com/Build-Africa-DAO/baraza-protocol/compare/main...feat/qa-remediation-and-community-launch?expand=1](https://github.com/Build-Africa-DAO/baraza-protocol/compare/main...feat/qa-remediation-and-community-launch?expand=1)

**Governing Directives & Documents:**
- Executive Response & Pricing Memo: `QA/simon_executive_response_to_motomoto.md`
- Motomoto Directive Memo: `QA/follow_up_response.md`
- Master DevOps Runbook: `docs/DEVOPS_PRODUCTION_SETUP_RUNBOOK.md`
- Software Architecture Document (SAD v1.0) & CR-007 Multi-Wallet Clearing Addendum

---

## What this PR does

This Pull Request enacts the commercial launch pricing model and custodial transparency directives approved in the executive launch memo (`QA/follow_up_response.md`), fixes UI contribution flows, exempts pilot communities, and delivers the audited database migration `044` with automated live verification:

1. **1.5% Commercial Launch Platform Fee:**
   - Drops money-movement platform fee from 2.0% to **1.5% (150 bps)** on external contributions and payouts.
   - Enforces **0% (0 bps)** platform fee on internal transfers between Baraza accounts, vaults, and circles.
2. **Transparent 5-Line Itemized Pre-Payment Confirmation:**
   - Overhauls [`app/src/pages/GroupPay.tsx`](file:///home/nothim/HIM/baraza-work/baraza-protocol/app/src/pages/GroupPay.tsx) to eliminate ambiguous phrasing.
   - Payers receive an explicit line-by-line breakdown before payment: (1) Community Dues, (2) Platform Fee (1.5%), (3) Telecom Processing (Daraja / Safaricom), (4) One-Time Member Activation Fee (KES 100 on first transaction only), and (5) Net Amount Credited to Community Treasury.
   - Locks payment request payload to `feeBreakdown.totalExpectedMinor` to guarantee telecom carrier matching.
3. **Saturday Canva Creators Kenya Pilot Isolation:**
   - Implements `is_pilot_exempt = true` flag on community level.
   - Saturday Canva Creators Kenya community operates with **0% platform fee, KES 0 community activation, and KES 0 member activation**.
   - Time-gates pilot dues payment button in UI to **October 10, 2026**.
4. **Database Migration 044 (Applied & Certified Live):**
   - Applies [`supabase/migrations/044_launch_pricing_and_pilot_exemptions.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/044_launch_pricing_and_pilot_exemptions.sql) to live Supabase PostgreSQL (`jwoibelpyvemhzazccym`).
   - Adds `is_pilot_exempt` column and `platform_fee_bps` to `communities`.
   - Adds `protocol_activated` monotonic idempotency columns to `user_profiles`.
   - Adds `pricing_rules` to `system_config`.
   - Certified via automated runner [`scripts/devops/verify-migration-044.mjs`](file:///home/nothim/HIM/baraza-work/baraza-protocol/scripts/devops/verify-migration-044.mjs) (4/4 checks passed).
5. **Headless DevOps Tooling:**
   - Adds [`scripts/devops/apply-remote-migration.mjs`](file:///home/nothim/HIM/baraza-work/baraza-protocol/scripts/devops/apply-remote-migration.mjs) (`npm run db:migrate:remote`) supporting direct PostgreSQL connection strings, Supabase poolers, or Supabase Management API.

---

## Detailed Summary of Changes

### 1. Pricing Engine & Mathematical Invariants (`app/src/lib/payments/feeEngine.ts`)
- Configured `LAUNCH_PLATFORM_FEE_BPS = 150` (1.50%).
- Updated `ONE_TIME_FEES.COMMUNITY_ACTIVATION_KES = 250` and `ONE_TIME_FEES.PROTOCOL_ACTIVATION_KES = 100`.
- Updated `computeFeeBreakdown`:
  - Zero-fees internal transfers (`isInternalTransfer === true`).
  - Zero-fees pilot communities (`isPilotExempt === true`).
  - Idempotent protocol activation fee application based on `isFirstTransaction`.
- Added test coverage in [`app/src/lib/__tests__/feeEngine.test.ts`](file:///home/nothim/HIM/baraza-work/baraza-protocol/app/src/lib/__tests__/feeEngine.test.ts).

### 2. Pre-Payment Transparency & Itemized Confirmation (`app/src/pages/GroupPay.tsx`)
- Replaced ambiguous fee notices with an itemized 5-line modal/card breakdown.
- Synchronized M-Pesa STK push and payment order generation to charge `feeBreakdown.totalExpectedMinor`, ensuring exact cents match what was presented on screen.
- Receipt card explicitly lists platform fee and carrier processing with clear badges.
- Implemented time-gating banner and button disable for Canva Creators Kenya pilot prior to October 10, 2026.
- Added comprehensive unit tests in [`app/src/pages/__tests__/GroupPay.test.tsx`](file:///home/nothim/HIM/baraza-work/baraza-protocol/app/src/pages/__tests__/GroupPay.test.tsx).

### 3. Community Onboarding & Treasury Separation (`app/src/pages/JoinDao.tsx`)
- Updated pricing banner from legacy `2%` to `1.5%`.
- Clarified KES 250 community activation fee and pilot waiver conditions.
- Explicitly documented non-commingled sovereign treasury policy: funds reside in the community's dedicated multisig vault.

### 4. Database Schema & Migration 044 (`supabase/migrations/044_launch_pricing_and_pilot_exemptions.sql`)
- Applied to live Supabase PostgreSQL database (`jwoibelpyvemhzazccym`) over Session Pooler `aws-1-eu-west-1.pooler.supabase.com`.
- Added `is_pilot_exempt BOOLEAN NOT NULL DEFAULT FALSE` and `platform_fee_bps INTEGER NOT NULL DEFAULT 150` to `communities`.
- Added `protocol_activated BOOLEAN NOT NULL DEFAULT FALSE` and `protocol_activated_at TIMESTAMPTZ NULL` to `user_profiles`.
- Seeding and dynamic pricing config in `system_config`.
- Appended to canonical consolidated schema [`supabase/consolidated_schema.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/consolidated_schema.sql).

### 5. DevOps Automation & Quality Assurance Suite
- Added [`scripts/devops/apply-remote-migration.mjs`](file:///home/nothim/HIM/baraza-work/baraza-protocol/scripts/devops/apply-remote-migration.mjs) (`npm run db:migrate:remote`).
- Added [`scripts/devops/verify-migration-044.mjs`](file:///home/nothim/HIM/baraza-work/baraza-protocol/scripts/devops/verify-migration-044.mjs) (`npm run db:verify:044`).
- Updated existing stress test suites ([`apiStressSuite.test.ts`](file:///home/nothim/HIM/baraza-work/baraza-protocol/app/src/lib/__tests__/apiStressSuite.test.ts), [`clientOnboardingStressSuite.test.ts`](file:///home/nothim/HIM/baraza-work/baraza-protocol/app/src/lib/__tests__/clientOnboardingStressSuite.test.ts), [`hardenedFixesStress.test.ts`](file:///home/nothim/HIM/baraza-work/baraza-protocol/app/src/lib/__tests__/hardenedFixesStress.test.ts)) to reflect 1.5% platform fee math.

---

## Verification & Quality Assurance Evidence

### 1. Pre-PR 10-Stage Quality Gate (`npm run verify:pr`)
- **Status:** **ALL 10 STAGES PASSED** (0 Errors, 0 Warnings, 0 `any` bypasses)
- **Execution Time:** 321.7s
- **Total Test Files:** 109 passed
- **Total Unit / Stress / Integration Tests:** 1,237 passed

```
================================================================================
   PRE-PROCUREMENT / PR VERIFICATION ORCHESTRATION PIPELINE
   Standard: S&P 500 Enterprise Fintech / CI/CT Quality Gate
================================================================================
  [STAGE 1/10] ✅ Anchor IDL & TypeScript Artifacts Drift Check : PASSED
  [STAGE 2/10] ✅ TypeScript Strict Typecheck                   : PASSED
  [STAGE 3/10] ✅ ESLint Enterprise Audit                       : PASSED
  [STAGE 4/10] ✅ Soroban & Anchor Contract Smoke Verification  : PASSED
  [STAGE 5/10] ✅ Vitest Unified Test Suite                     : PASSED (109 files, 1,237 tests)
  [STAGE 6/10] ✅ Cloudflare Pages Production Asset Build       : PASSED
  [STAGE 7/10] ✅ Automated Schema Drift & RLS Audit            : PASSED
  [STAGE 8/10] ✅ Edge API Route Convergence Audit              : PASSED
  [STAGE 9/10] ✅ Enterprise Penetration & Security Suite       : PASSED
  [STAGE 10/10] ✅ Pre-PR Master Certification Report           : PASSED
================================================================================
PR VERIFICATION SUMMARY: 10 Passed, 0 Failed, 0 Skipped (100% Quality Pass)
================================================================================
```

### 2. Live Remote Database Verification (`npm run db:verify:044`)
- **Target Project:** `jwoibelpyvemhzazccym` (`https://jwoibelpyvemhzazccym.supabase.co`)
- **Status:** **4 PASSED, 0 FAILED**

```
================================================================================
   BARAZA PROTOCOL — MIGRATION 044 LIVE DATABASE VERIFICATION SUITE
   Target Endpoint: https://jwoibelpyvemhzazccym.supabase.co
   Standard: S&P 500 Enterprise Fintech / Post-Migration Integrity Assertion
================================================================================
>>> 1. Verifying public.communities Schema Extensions...
  [PASS] ✅ Communities Schema Extensions       : Verified columns (is_pilot_exempt, platform_fee_bps=150)
>>> 2. Verifying Saturday Canva Pilot Exemption Isolation...
  [PASS] ✅ Canva Exemption Seeding             : Verified schema constraint active for pilot creation
>>> 3. Verifying public.user_profiles Monotonic Idempotency Schema...
  [PASS] ✅ User Profiles Schema Extensions     : Verified protocol_activated & protocol_activated_at columns present
>>> 4. Verifying public.system_config Dynamic Launch Pricing...
  [PASS] ✅ Dynamic Pricing Rules               : 150 bps platform fee, KES 250 community activation, KES 100 member activation
================================================================================
VERIFICATION COMPLETE: 4 Passed, 0 Failed.
================================================================================
```

---

## Security & Compliance Checklist

- [x] **PCI-DSS & Telco Carrier Accuracy:** Payment initiation amount explicitly matches the exact itemized minor units computed in the fee breakdown.
- [x] **Monotonic Idempotency:** Protocol activation fees can only be charged once per member profile across all circles.
- [x] **Zero-Commingling:** Non-custodial community funds settle directly into individual community vaults on Stellar/Base.
- [x] **Pilot Protection:** Saturday Canva Creators Kenya pilot is 100% exempted from platform and onboarding fees.
- [x] **Zero Secrets Committed:** No passwords, tokens, or credentials are hardcoded or tracked in Git.
