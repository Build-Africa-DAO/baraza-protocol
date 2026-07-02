# Superteam Africa Microgrant — Application Draft

Draft copy for the Superteam Earn application (earn.superteam.fun/grants). Requesting up to **$10,000, equity-free**.

> **STATUS: DRAFT — NOT YET SUBMITTED.** Do not send to Superteam without a human pass on the items flagged below. Sending anything to an external funder is a human action.

> **Before submitting, resolve:**
> - Two track-record bullets are marked `[CONFIRM]` (GPP6, ETH Safari) — fill in specific dates/outcomes; this draft has no hard details on those engagements.
> - **Milestone 2 leans on BRZA token minting**, which sits in tension with the current *protocol-only / no-token-this-phase* public posture (token deliberately deferred ~1 year — see `docs/RESEARCH_FLAGS_2026-07-02.md`). Decide whether to reframe Milestone 2 away from a live token mint before submitting. This is a founder call, left un-rewritten here on purpose.

---

## Project description (one paragraph)

Baraza Protocol is open governance and treasury infrastructure for Africa's chamas, stokvels, SACCOs, and cooperatives — savings groups that already move billions of dollars informally but have no audit trail, no member vote on spending, and no recourse when a treasurer disappears. Baraza gives any group a shared on-chain treasury, lets members pay dues over M-Pesa with no wallet or seed phrase required, and lets members vote on how funds are spent, with every payment and decision recorded on-chain. The protocol settles on Stellar (XLM treasuries, M-Pesa via Kotani Pay), runs governance logic on Solana (five Anchor programs), and offers a secondary Aragon OSx path on Base for EVM-native DAOs. It's open source, built by BuildAfrica DAO, and live in testnet today.

---

## What we'll build with the grant (milestone-based)

**Milestone 1 — Production-ready settlement ($3,000)**
- Run Supabase migrations 001–021 in production; wire `ANTHROPIC_API_KEY` and Supabase env vars into Vercel.
- Fund the Stellar testnet treasury G-account and pass an end-to-end XLM payment-verification smoke test (`create-payment-intent` → `verify-payment` → `membership/activate`).
- *Deliverable:* a real community can pay dues in XLM and become an activated member on the live deployed app.

**Milestone 2 — Real mint & settlement confirmation ($3,500)**
- Replace the demo `promote-orders` cron — currently a blind status walk — with real BRZA mint submission and Horizon mint confirmation.
- Pick and wire an indexer source for the `MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED` leg of the payment-order state machine.
- *Deliverable:* payment orders reconcile against actual on-chain state, not timers.

**Milestone 3 — Governance live on Solana devnet ($3,500)**
- Deploy all five Anchor programs (community registry, governance, membership, payment attestation, treasury vault) to devnet with real program IDs in Vercel config.
- Complete remaining governance CPI dispatch paths for membership actions and rule changes; restrict community member-count changes to the membership CPI.
- *Deliverable:* proposals and votes execute against deployed Solana programs instead of mocked state.

---

## Track record

- Founder **Aziz Mohammed** (@azizke) — building Baraza Protocol under **BuildAfrica DAO** (Kenya-registered: BAD DAO AFRICA LIMITED, PVT-L51DR8MQ).
- Already known to Superteam Kenya through a prior Lead application.
- `[CONFIRM]` **GPP6** — cohort/program details, dates, and outcome.
- `[CONFIRM]` **ETH Safari** — track entered, what was built or presented, and outcome.
- Shipping track record: 5 Solana Anchor programs written and unit-tested, Stellar payment verification + M-Pesa (Kotani Pay) onramp built and live in testnet, **478 unit tests passing across 52 test suites** in the protocol.

---

## Links

- Live demo: https://baraza-protocol.vercel.app
- GitHub: https://github.com/Build-Africa-DAO/baraza-protocol
- Contact: aziz@buildafricadao.org

---

<!--
Provenance: extracted fresh from commit 38f3c5f (branch claude/superteam-africa-grant-vhu2e9)
onto current main. Refreshed against live repo state 2026-07-02:
  - Supabase migrations 001–017 → 001–021 (latest migration file is 021; verified on main).
  - "231 unit tests" → "478 unit tests across 52 test suites" (verified by count on main).
  - 5 Anchor programs confirmed (community_registry, governance, membership,
    payment_attestation, treasury_vault).
  - Stellar-first chain framing retained (already current).
Note: a parallel unpushed extraction exists locally on branch `main-recovery` (commit 4a33d71,
in the C:\Users\USER\baraza-protocol clone). Reconcile/dedupe before either is finalized.
-->
