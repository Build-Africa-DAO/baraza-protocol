# Baraza Protocol — Whitepaper

This directory holds the living whitepaper drafts. They share the same facts but speak to different audiences and serve different stages of a conversation.

| Document | Audience | Use when |
|---|---|---|
| [`ONE_PAGER.md`](./ONE_PAGER.md) | Warm intros, first-touch DMs, conference handouts | A single page is the right surface — the rest follows on request |
| [`PUBLIC_WHITEPAPER.md`](./PUBLIC_WHITEPAPER.md) | Communities, members, contributors, press | Explaining what Baraza is, why it exists, and how a community joins |
| [`INVESTOR_WHITEPAPER.md`](./INVESTOR_WHITEPAPER.md) | Pre-seed / seed / strategic investors, ecosystem partners, IDO participants | Diligence on market, tokenomics, vesting, use of funds, and risk |
| [`TEAM.md`](./TEAM.md) | Investors and partners doing people-diligence | Companion to the investor whitepaper — founder, council, TBA roles, advisor posture |
| [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) | Counsel and the founder | Pre-distribution gate — every item must be cleared or deliberately deferred before any external send |
| [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md) | Investors, partners, internal strategy | Business-research brief sizing the RWA + DAO markets, anchoring African community-finance numbers, and naming the competitive set with sources |
| [`products/`](./products/) | Investors, partners, builders | Per-product briefs for the four products in `CLAUDE.md`: Protocol, Baraza TV, IDO, DEX. Index at [`products/README.md`](./products/README.md) |
| [`INVESTOR_FAQ.md`](./INVESTOR_FAQ.md) | Investors, partners (post one-pager, pre full-pack) | Preempts the recurring diligence questions in 6 buckets — market, product, tokenomics, revenue, legal, risk, ask |
| [`OPS_PRE_IDO_CHECKLIST.md`](./OPS_PRE_IDO_CHECKLIST.md) | Founder + ops, internal | Sequenced execution plan from current state to IDO open. Six tracks (Legal, Compliance, Mobile rails, Engineering, Token ops, Diligence pack) with a compressed critical path |

## Source of truth

These whitepapers are downstream of code. When numbers diverge, **the code wins** and the whitepaper is wrong.

- BRZA supply, allocation, vesting, emission, referral, fees, loan terms → `app/src/lib/brza/constants.ts`
- Community type list and governance presets → `app/src/lib/constants.ts`
- Chain configuration and adapter routes → `app/src/lib/chains/config.ts`
- Council rulings that change tokenomics behaviour → `app/src/lib/akili/` and `docs/akili-council/`
- Product scope, MVP boundary, and non-goals → `app/docs/PRD.md`

Before publishing externally, re-run the tokenomics audit (`docs/TOKENOMICS_AUDIT_REPORT.md`) and fix any divergence here.

## Versioning

- Version: 0.1 (working draft, internal)
- Status: not yet reviewed by counsel; do not distribute to retail investors
- Last reconciled with `constants.ts`: 2026-06-19

## Open reconciliation items

- Notion product spec allocation table sums to 110% (see `OPEN_TASKS_RESEARCH_UPDATE.md`). Whitepapers here follow `constants.ts` (100%), not Notion.
- Indexer source for `MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED` not yet chosen. Whitepaper does not promise a specific provider.
- VASP / securities posture per jurisdiction is unresolved. The investor whitepaper labels BRZA as a utility / participation token pending legal review and is **not** a solicitation.

## Do not include

- Wallet addresses for treasury, issuer, or distributor (these go in audited docs, not marketing).
- Forward-looking BRZA price predictions beyond the published phase prices.
- Any reference to Builder Protocol, Nouns DAO, or noun.wtf (per `CLAUDE.md`).
- Multisig signer identities until the signer set is finalised on devnet.
