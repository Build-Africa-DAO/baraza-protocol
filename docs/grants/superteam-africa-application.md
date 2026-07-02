# Superteam Africa Microgrant — Application Draft

Draft copy for the Superteam Earn application (earn.superteam.fun/grants). Requesting up to **$10,000, equity-free**.

> **STATUS: DRAFT — NOT YET SUBMITTED.** Sending anything to an external funder is a human action. Do not submit without a human pass on the flagged items below.

> **Before submitting:**
> - Fill the two `[CONFIRM]` track-record bullets (GPP6, ETH Safari) with specific dates/outcomes — this draft has no hard details on those engagements.
> - Regenerate the unit-test count with `npm test` (vitest) in `app/` immediately before submission so the number is exact and provably passing on the day.

---

## Project description (one paragraph)

Baraza Protocol is open governance and treasury infrastructure for Africa's chamas, stokvels, SACCOs, and cooperatives — savings groups that already move billions of dollars informally but have no audit trail, no member vote on spending, and no recourse when a treasurer disappears. Baraza gives any group a shared on-chain treasury, lets members pay dues over M-Pesa with no wallet or seed phrase required, and lets members vote on how funds are spent, with every payment and decision recorded on-chain. The protocol settles on Stellar (XLM treasuries, M-Pesa via Kotani Pay), runs governance logic on Solana (five Anchor programs), and offers a secondary Aragon OSx path on Base for EVM-native DAOs. It's open source, built by BuildAfrica DAO, and live in testnet today.

---

## What we'll build with the grant (milestone-based)

**Milestone 1 — Production-ready settlement ($3,000)**
- Run Supabase migrations 001–021 in production; wire `ANTHROPIC_API_KEY` and Supabase env vars into Vercel.
- Fund the Stellar testnet treasury G-account and pass an end-to-end XLM payment-verification smoke test (`create-payment-intent` → `verify-payment` → `membership/activate`).
- *Deliverable:* a real community can pay dues in XLM and become an activated member on the live deployed app.

**Milestone 2 — Verified on-chain settlement & member activation ($3,500)**
- Replace the demo `promote-orders` cron — currently a blind status walk on a timer — with real Stellar/Horizon settlement confirmation, so a dues payment is only marked settled once it is confirmed on-chain.
- Wire an indexer source for the payment-order reconciliation leg (`CONFIRMED → INDEXER_CONFIRMED → RECONCILED`), so membership activation reconciles against actual on-chain settlement state rather than elapsed time.
- *Deliverable:* payment orders and the member activations they trigger reconcile against real on-chain settlement, not timers. (Protocol/activation work only — no token issuance in this phase.)

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
- Shipping track record: 5 Solana Anchor programs written and unit-tested; Stellar payment verification + M-Pesa (Kotani Pay) onramp built and live in testnet; **478 unit tests across 52 suites** covering payments, governance, membership, identity claim/resolution, dues-streak tracking, retroactive funding rounds, and USSD flows.

---

## Links

- Live demo: https://baraza-protocol.vercel.app
- GitHub: https://github.com/Build-Africa-DAO/baraza-protocol
- Contact: aziz@buildafricadao.org

---

<!--
Provenance & reconciliation (2026-07-02):
Two prior drafts existed — 38f3c5f (branch claude/superteam-africa-grant-vhu2e9) and the
more-complete unpushed 4a33d71 (local branch main-recovery, backed up to canonical as
backup/main-recovery). This is the single reconciled version, taken from the more complete
4a33d71 and finalized onto grant/superteam-refresh off current main. No third copy created.

Refreshed / verified against live repo state on main:
  - Supabase migrations run to 021 (Milestone 1).
  - Unit tests: exact count 478 across 52 suites (verified by count on main; regenerate before submission).
  - 5 Anchor programs confirmed; Stellar-first framing retained.
  - Milestone 2 reframed from "BRZA mint" to on-chain settlement + activation, to stay
    consistent with the protocol-only / no-token-this-phase posture (token deferred ~1 year;
    see docs/RESEARCH_FLAGS_2026-07-02.md if/when that PR lands).
-->
