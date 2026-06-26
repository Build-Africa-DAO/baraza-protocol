# 01 — Baraza Protocol

The core product. The other three (Baraza TV, IDO, DEX) are surfaces on top of it.

---

## What it is

A shared treasury and governance rail for African communities, settled on Stellar, opened by a phone call. A community is created in under 10 minutes, members join by phone number, dues settle via mobile money, the treasury balance is public, and every spend requires a member vote and multisig signoff. The protocol does not custody funds — each community's treasury is its own Stellar G-account; the multisig keys belong to elected community signers.

Externally we call this a **digital cooperative.** A chama on Baraza is a co-op with an honest ledger; a SACCO is a co-op whose members can vote from a feature phone.

## Primitives

Every community runs the same five primitives, regardless of type. **Type is a label and a defaults preset, never a runtime behaviour switch** (per `CLAUDE.md` and `app/src/lib/constants.ts:108-132`).

| Primitive | What it is | Code anchor |
|---|---|---|
| **Membership** | Member is added after dues are paid + verified; represented by an on-chain attestation | `app/api/membership/activate.ts`, `app/api/stellar/verify-payment.ts` |
| **Treasury** | A Stellar G-account per community; balance public, moves require vote + multisig | `app/src/lib/chains/config.ts` |
| **Dues** | Recurring or one-off payment in mobile money → XLM → treasury, with BRZA minted on confirmation | M-Pesa via Kotani Pay, `payment_orders` table |
| **Proposals + votes** | Any member can propose; quorum, threshold, voting window are per-community at creation | Web + USSD voting; `app/api/ussd/index.ts` |
| **Rewards** | BRZA emission for dues, votes, proposals, bounties — capped 2M/month across all communities | `BRZA_EMISSION` in `app/src/lib/brza/constants.ts` |

## Who it's for

23 community types, listed in `app/src/lib/constants.ts:108-132`:

> Savings group (chama) · Stokvel · SACCO · DAO · Cooperative · Professional network · Investment club · ROSCA · ASCA/VSLA · Union · NGO · Alumni · Religious · Sports club · Homeowners association · Burial society · Tribe/clan group · Welfare group · PTA · Youth group · Political caucus · Supply chain co-op · Study circle.

The dominant cohorts at launch:

1. **Kenyan chamas** (~300K groups, ~KSh 300B AUM, ~$3.4B USD).
2. **Kenyan SACCOs** (long tail — 295 mid/small SACCOs sharing the 23% of regulated assets not held by the top 60).
3. **South African stokvels** (~800K groups, 11M members, ~R50B / ~$2.7B annual turnover).

See [`../RESEARCH_RWA_DAO.md`](../RESEARCH_RWA_DAO.md) §4 for sourcing.

## Where it sits in the architecture

- **Frontend:** Vite + React + TypeScript + Tailwind, in `app/`. Components → hooks → lib enforced; `lib/` never imported directly into components.
- **Backend:** Supabase (Postgres + RLS) for off-chain state. Every API route degrades gracefully without env vars present.
- **Chains:** Stellar primary, Solana for governance programs (5 Anchor programs written, not yet on devnet), EVM via Aragon OSx for secondary deployments, Celo scaffold for G$ identity.
- **Wallets:** Phantom, Solflare, Coinbase Wallet only. No exceptions.
- **AI:** Akili relay (Claude streaming SSE) drafts proposals and translates. Akili Council (5 specialists) reviews protocol-level decisions. Neither signs.

## BRZA linkage

| Bucket | Allocation | How the Protocol uses it |
|---|---|---|
| Community Rewards | 200M (20%) | Emission for dues, votes, proposals, bounties. 2M/month cap. |
| Operations | 150M (15%) | Engineering + mobile rails + product. Milestone-gated. |
| Referral | 50M (5%) | Phase-0-only, conditional ship per council ruling 2026-06-19. |
| Grants | 80M (8%) | Ecosystem builders working on the protocol. |
| Events | 40M (4%) | Hackathons, buildathons. |

Protocol fee: **2%** on outbound treasury transactions (`treasuryTxPct = 0.02`). This is the primary revenue surface for the Protocol product.

## Status

Built (Phase 0, in active build):

- Community creation with 23 type presets and governance-preset autopopulation.
- Phone-first onboarding via USSD + SMS (Africa's Talking sandbox).
- M-Pesa dues via Kotani Pay (sandboxed).
- Stellar treasury G-accounts.
- BRZA mint on confirmed dues (`app/api/stellar/verify-payment.ts`).
- Membership attestation post-payment, gated by activation secret.
- Proposal + voting (web and USSD).
- Akili relay and council (`app/src/lib/akili/`).
- USSD session monitoring + invisible-member cohort tracking (2026-06).

Not yet shipped (Protocol-internal):

- Stellar mainnet end-to-end verification.
- Indexer source for `MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED`.
- Solana Anchor programs deployed to devnet.
- Multisig withdrawal handoff (`withdrawals_enabled` remains `false`).

## Roadmap

| Phase | What ships | Status |
|---|---|---|
| 0 | Onboarding, dues, treasury, proposals, voting | In build |
| 1 | Mainnet verification, BRZA mint on confirmed dues, indexer reconciliation | Cleared, in build |
| 2 | Bounty market — communities post work, members rate, BRZA pays out after vote | Planned |
| 4 | Solana governance programs to mainnet, cross-chain BRZA bridging | Planned |
| RWA bridge | Community on-chain history becomes a legible underwriting input for Goldfinch / Centrifuge / Huma. Reads the protocol; does not change it. | Planned (Phase 4+) |

The bounty market (Phase 2) is part of the Protocol product, not a separate product. So is the RWA credit bridge (Phase 4+).

## Risks and constraints

- **Indexer dependency.** `INDEXER_CONFIRMED` relies on an external indexer for Horizon reconciliation. Source not yet picked.
- **Mobile-money concentration.** M-Pesa is dominant in Kenya. A change to Daraja terms or pricing is a real risk; multi-MNO support is planned.
- **Multisig signer set.** Not yet named (Kofi council cond 4(d)). Block-state in `BRZA_REFERRAL.multiSigSignersWallets`.
- **USSD provider coverage.** Africa's Talking sandbox covers our primary markets; production volume approval pending.
- **AI dependency.** Akili degrades to a static `auth_failed` event when `ANTHROPIC_API_KEY` is absent. Never blocks core protocol flow.
- **Withdrawals disabled** until devnet-tested multisig handoff.
