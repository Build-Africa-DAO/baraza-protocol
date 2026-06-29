# Pre-IDO Operations Checklist

Turns the blockers declared across the whitepaper pack into a sequenced execution plan. Living doc — owners and dates update as work progresses.

Owner: Aziz Mohammed · Last reconciled: 2026-06-19 · Status: tracking

---

## How to read this

Each track has a **gating event** (the thing it must produce to unblock the next track) and a **dependency** (the upstream track that must clear first). The IDO can open only when every track is `cleared` or `deliberately deferred with counsel signoff`.

Tracks are not staffed equally. Engineering tracks run in parallel; legal tracks are mostly sequential because each one depends on the operating-entity decision in **L1**.

Status legend: `open` → `in progress` → `blocked` → `cleared`.

---

## L — Legal / regulatory

### L1 · Kenya VASP Act, 2025 compliance — **#1 BLOCKER**
- **Gating event:** CMA / CBK licensing decision in writing.
- **Dependency:** none (this is the root).
- **Lead time:** 8–12 weeks from full submission.
- **Status:** open.
- **Steps:**
  - [ ] Counsel retained (Kenya VASP-track specialist).
  - [ ] Operating entity registered in Kenya with physical office.
  - [ ] Director KYC + competence assessments completed for all named officers.
  - [ ] Licensing class determined (exchange / wallet / custodian / other intermediary).
  - [ ] Formal submission to CMA + CBK.
  - [ ] If any group entity is foreign-domiciled, compliance certificate obtained first.

### L2 · Multi-jurisdiction VASP / securities matrix
- **Gating event:** counsel-cleared per-jurisdiction matrix marking each country as `open / restricted / closed` for Phase 0 and IDO.
- **Dependency:** L1 sign-on of Kenya counsel; same firm can usually coordinate the matrix.
- **Status:** open.
- **Jurisdictions to cover:** Kenya, Nigeria, South Africa, Uganda, Tanzania, Ethiopia, Ghana, US persons (Reg S / Reg D), EU / UK MiCA.
- **Output:** a one-page matrix attached to [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) §1.

### L3 · Issuer entity
- **Gating event:** issuer entity registered.
- **Dependency:** L2 matrix.
- **Status:** open.
- **Likely structure:** Marshall Islands MIDAO LLC or Cayman Foundation as issuer, with Kenya operating subsidiary. Final form is a counsel decision, see [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md) §3.3.

### L4 · Cooperative-law standing confirmation
- **Gating event:** counsel opinion confirming a Cap. 490 cooperative can use Baraza as its ledger without losing legal standing, and the "digital cooperative" framing does not pull Baraza itself under cooperative supervision.
- **Dependency:** none (parallel to L1).
- **Status:** open.

### L5 · Data-protection posture
- **Gating event:** counsel sign-off on phone-hash + pepper rotation under Kenya Data Protection Act (2019), Nigeria NDPR, and any other in-scope jurisdiction from L2.
- **Dependency:** L2 matrix.
- **Status:** open.

---

## C — Compliance & disclosure

### C1 · Counsel review checklist clear
- **Gating event:** every item in [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) marked `cleared` or `deliberately deferred with written reason`.
- **Dependency:** L1 + L2 + L4.
- **Status:** open. Checklist exists; review has not started.

### C2 · Final whitepaper pack scrub
- **Gating event:** every numeric in `docs/whitepaper/*.md` and `docs/whitepaper/products/*.md` reconciled against `app/src/lib/brza/constants.ts` per the methodology in [`../TOKENOMICS_AUDIT_REPORT.md`](../TOKENOMICS_AUDIT_REPORT.md).
- **Dependency:** none (we can do this any time; rerun before send).
- **Status:** done as of 2026-06-19 for the current pack.

### C3 · Per-jurisdiction selling-restrictions appendix
- **Gating event:** appendix drafted + counsel-signed.
- **Dependency:** L2.
- **Status:** open.

### C4 · Notion vs constants reconciliation
- **Gating event:** Notion product spec allocation table updated to sum to 100% (currently 110%) and marked authoritative-after-code in the source-of-truth note.
- **Dependency:** none.
- **Status:** open. Discrepancy documented in [`../OPEN_TASKS_RESEARCH_UPDATE.md`](../OPEN_TASKS_RESEARCH_UPDATE.md).

---

## M — Mobile rails

### M1 · Kotani Pay production keys
- **Gating event:** production keys issued; Africa's Talking + M-Pesa sandbox → production cutover plan written.
- **Dependency:** L1 (operating entity must exist to take custody of keys).
- **Lead time:** 4–6 weeks after L1.
- **Status:** blocked on L1.

### M2 · M-Pesa Daraja approval
- **Gating event:** Daraja API production approval from Safaricom.
- **Dependency:** L1 + M1.
- **Lead time:** 6 weeks (per `project_blockers_june2026`).
- **Status:** blocked on L1.

### M3 · Africa's Talking production volume
- **Gating event:** production-volume tier approval for USSD + SMS in primary markets.
- **Dependency:** L1.
- **Status:** open.

### M4 · Multi-MNO expansion plan
- **Gating event:** signed integration plan for MTN MoMo, Airtel Money, Telebirr (post-launch sequencing acceptable).
- **Dependency:** M2 in production.
- **Status:** deferred to post-IDO.

---

## E — Engineering

### E1 · Environment provisioning
- **Gating event:** all secrets present in Vercel + GitHub Actions.
- **Dependency:** none.
- **Status:** open.
- **Items (per `CLAUDE.md` blocker list):**
  - [ ] `ANTHROPIC_API_KEY` in Vercel + GitHub secrets.
  - [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
  - [ ] `PAYMENT_PHONE_HASH_PEPPER` rotated and persisted.
  - [ ] `STELLAR_INTENT_SECRET` rotated and persisted.
  - [ ] `PAYMENT_ADAPTER_PROXY_SECRET` rotated and persisted.

### E2 · Supabase migrations live
- **Gating event:** `supabase db push` runs 001–012 cleanly against production.
- **Dependency:** E1.
- **Status:** open.

### E3 · Stellar testnet smoke
- **Gating event:** treasury G-account funded, end-to-end payment-verification smoke green.
- **Dependency:** E1 + E2.
- **Status:** open.

### E4 · Indexer source picked
- **Gating event:** indexer provider chosen; `MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED` is no longer a blind status walk.
- **Dependency:** none (can run parallel to E1–E3).
- **Status:** open.

### E5 · Stellar mainnet verification
- **Gating event:** end-to-end payment-verification smoke green against mainnet.
- **Dependency:** E1 + E2 + E3 + E4 + M1.
- **Status:** open.

### E6 · Multisig handoff devnet-tested
- **Gating event:** multisig signer set named (Kofi council cond 4(d)), keys distributed, devnet handoff exercised, `withdrawals_enabled` flipped to `true` in code review.
- **Dependency:** L3 (issuer entity must exist to nominate signers) + E5.
- **Status:** open.

### E7 · Solana Anchor programs to devnet
- **Gating event:** five Anchor programs deployed to Solana devnet, smoke-tested.
- **Dependency:** none (parallel track).
- **Status:** open. Programs written; not yet on devnet.

### E8 · Audits
- **Gating event:** signed audit reports for Stellar payment-verification path, Solana Anchor programs, and EVM Aragon OSx integration.
- **Dependency:** E5 + E6 + E7.
- **Status:** open.

---

## T — Token operations

### T1 · BRZA issuer + distributor accounts
- **Gating event:** `VITE_BRZA_ISSUER_ADDRESS` and `VITE_BRZA_DISTRIBUTOR_ADDRESS` populated in production env.
- **Dependency:** L3 + E1.
- **Status:** open.

### T2 · Liquidity-pool LP custody contract
- **Gating event:** 80M LP unlock destination contract finalised — Soroban contract on Stellar or off-chain escrow agent. 12-month lock enforced in code.
- **Dependency:** L3 + E6.
- **Status:** open.

### T3 · Public-sale buyer vesting contract
- **Gating event:** 180-day cliff + 365-day linear vest enforced for IDO buyers in a Soroban contract or an off-chain administrator.
- **Dependency:** L3.
- **Status:** open.

### T4 · Multisig signer set named + KYC-cleared
- **Gating event:** `BRZA_REFERRAL.multiSigSignersWallets` populated with ≥3 named, KYC-cleared signer wallets.
- **Dependency:** L1 + L3.
- **Status:** open. Blocks all disbursements per `referralPayoutBlockedReason()`.

### T5 · Identity-continuity rail live
- **Gating event:** Celo G$ or Soroban credential rail live and integrated as the identity-continuity backstop.
- **Dependency:** E1–E5 cleared (Stellar mainnet must be solid first).
- **Status:** deferred (post-IDO acceptable). Referral mechanic remains Phase-0-only until this ships.

### T6 · Listing venue decision
- **Gating event:** listing venue(s) confirmed — DEX-only or CEX co-list.
- **Dependency:** L2 + counsel signoff.
- **Status:** open. Open question in [`products/03_IDO.md`](./products/03_IDO.md).

---

## D — Diligence pack

### D1 · Team appendix under NDA
- **Gating event:** founder bio, council role definitions, Founder B identity (if filled), advisors named, multisig signer set named. Sent under NDA on request.
- **Dependency:** T4.
- **Status:** open.

### D2 · Audit reports attached
- **Gating event:** E8 audit reports attached to data room.
- **Dependency:** E8.
- **Status:** open.

### D3 · Counsel opinion letters attached
- **Gating event:** opinion letters from Kenya VASP counsel, securities counsel, data-protection counsel attached to data room.
- **Dependency:** L1–L5 + C1.
- **Status:** open.

### D4 · Diligence data room indexed
- **Gating event:** numbered index of whitepaper pack, audit reports, opinion letters, multisig structure, vesting administrator, and per-jurisdiction matrix.
- **Dependency:** D1 + D2 + D3.
- **Status:** open.

---

## Critical path

The dependency graph compresses to one critical path:

```
L1 (Kenya VASP) → L3 (issuer entity) → T4 (multisig named) → E6 (handoff) → E5 mainnet verified → E8 audits → D4 data room → IDO open
```

Everything else either runs parallel or feeds into a node on this path. The 8–12-week lead on L1 dominates the schedule; investor conversations can proceed against the existing whitepaper pack while L1 is in flight.

## Inputs to revise this doc

When any track changes status, update:
- The relevant section here (status field).
- The `Status:` line at the top of this file.
- [`INVESTOR_WHITEPAPER.md`](./INVESTOR_WHITEPAPER.md) §10 (blockers section) if the change reorders the critical path.
- [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) if the change clears a checklist item.
