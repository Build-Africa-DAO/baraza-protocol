# Baraza Protocol — Investor Whitepaper

**For prospective pre-seed / seed / strategic / IDO participants and ecosystem partners.**

Version 0.1 · Working draft · 2026-06-19

> This document is not a solicitation, an offer to sell, or a prospectus. It is a working diligence brief. Distribution is restricted to parties already in conversation with the founder. Final terms, jurisdiction-specific carve-outs, and legal disclaimers will be appended before any sale opens.

---

## 1. Thesis

Baraza turns Africa's existing **informal community-finance economy** — chamas, stokvels, SACCOs, cooperatives, burial societies, ROSCAs, alumni groups — into auditable, governed, on-chain **digital cooperatives**, without forcing members to adopt crypto-native tooling.

The wedge is **phone-first onboarding plus mobile-money settlement**. The moat is the **community track record** that accumulates on-chain: dues collected, proposals passed, contributors paid, BRZA emitted. That track record is portable, verifiable, and previously did not exist.

The framing matters. Wyoming's 2025 amendment now classifies a DAO LLC as a *limited liability cooperative*, and Kenya's Cooperative Societies Act (Cap. 490) already gives chamas and SACCOs a regulated cooperative form. Baraza sits at the convergence — a digital cooperative *is* a DAO with member-level accounting and a treasury vote, and the protocol is the rail that ships both legs together. See [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md) for the full landscape brief.

We expect three revenue surfaces to mature in sequence: (1) protocol fees on treasury moves, (2) creator economics on Baraza TV, (3) a community-token DEX. A fourth — an **RWA credit bridge** that turns on-chain community history into a legible underwriting input for protocols like Goldfinch, Centrifuge, and Huma — opens in Phase 4+ once identity-continuity rails are live.

---

## 2. Market

### 2.1 Why African community finance is large and underserved

- Rotating savings groups (ROSCAs / chamas / stokvels / VSLAs) are a default savings rail across East, West, and Southern Africa. Tens of millions of adults participate.
- SACCOs alone hold material balance-sheet share in Kenya, Tanzania, Uganda, Rwanda, and Ethiopia.
- Mobile money is the **default payment rail** — M-Pesa in Kenya/Tanzania, MTN MoMo across West Africa, Airtel Money widely. Communities already settle in mobile money; they do not settle in dollars or in stablecoins.
- The dominant operational stack is WhatsApp + paper ledgers + a personal bank account. This stack fails predictably: missing audit trail, treasurer attrition, fund diversion, no portable reputation.

### 2.2 Geographic priority

| Tier | Markets | Why first |
|---|---|---|
| 1 | Kenya | Mature M-Pesa rail, formal chama law (Cap. 490 cooperatives), high smartphone penetration in target cohort |
| 1 | Tanzania, Uganda | M-Pesa / MTN MoMo coverage, large ROSCA culture |
| 2 | Nigeria | Largest population, complex regulatory layer, MNO + bank fragmentation |
| 2 | Ethiopia | Large SACCO presence, Telebirr maturing |
| 3 | Pan-African diaspora | Cross-border remittance corridors to community treasuries |

### 2.3 Competitive landscape

- **Status-quo competitors:** WhatsApp + Excel; bank-managed chama accounts (Equity, KCB); standalone chama apps with no on-chain ledger or governance primitives.
- **Crypto competitors:** General-purpose DAO tooling (Aragon, Snapshot, Tally) does not solve mobile-money onboarding and is unusable on a feature phone.
- **Differentiator:** Baraza ships the mobile-money onboarding, USSD voting, and per-community treasury *together*, then connects them to on-chain governance and BRZA rewards. The competitive question is not "is there a DAO tool" — it is "is there a chama tool with a verifiable audit trail and portable reputation." Today, no.

---

## 3. Product status

A condensed view of what currently ships, what is staged, and what is unbuilt. The full status reference is `docs/PROTOCOL_STATUS_2026-06-07.md` and `app/docs/PRD.md`.

| Surface | State | Notes |
|---|---|---|
| Community creation + 23 type presets | Built | `app/src/lib/constants.ts:108-132` |
| Phone-first onboarding (USSD + SMS) | Built | Africa's Talking sandbox |
| M-Pesa dues via Kotani Pay | Built, sandboxed | Production keys pending |
| Stellar treasury G-accounts | Built | Mainnet G-account funding outstanding |
| BRZA mint on confirmed dues | Built | `app/api/stellar/verify-payment.ts` |
| Membership attestation post-payment | Built | Activation-secret gated |
| Proposal + voting (web) | Built | |
| USSD voting | Built | `app/api/ussd/index.ts` |
| Akili relay (Claude streaming) | Built | Awaits `ANTHROPIC_API_KEY` in production |
| Akili Council (5 specialists) | Built | `app/src/lib/akili/` |
| Referral mechanic (Phase 6) | Cleared conditional | Time-limited to Phase 0 price |
| Solana governance programs | Written | Not yet on devnet |
| EVM (Aragon OSx) | Wired | Factory addresses known |
| Withdrawals (multisig handoff) | Disabled | `withdrawals_enabled = false` until devnet test |
| Bounty market | Not built | Phase 2 |
| Baraza TV creator economics | Not built | Phase 3 |
| DEX | Not built | Phase 5 |

The repository ships safety-by-default: Supabase reads are RLS-gated, M-Pesa receipts never touch chain, phone numbers are pepper-hashed, and timing-safe secret comparison is enforced.

---

## 4. Architecture summary

- **Frontend.** Vite + React + TypeScript + Tailwind, in `app/`. All business logic in `app/src/lib/` (components → hooks → lib enforced).
- **Backend.** Supabase (Postgres + RLS) for off-chain state; everything works degraded without Supabase env vars present.
- **Chains.** Stellar primary (BRZA custom asset, treasury G-accounts, M-Pesa via Kotani Pay). Solana for governance (5 Anchor programs). Base/EVM via Aragon OSx for secondary deployments. Celo scaffold for G$ identity.
- **AI.** Akili relay (Claude streaming over SSE, `app/api/agent/chat.ts`) + Akili Council (5 specialists in `app/src/lib/akili/`). AI is never a signer.
- **Mobile.** Africa's Talking USSD + SMS, feature-phone first.
- **Hosting.** Vercel.

Architectural invariants (these never relax): chain adapters are the single entry point for chain interactions; `intentToken` is required for Stellar mainnet verification; activation secret is client-side only between order creation and membership activation; `withdrawals_enabled` stays `false` until multisig handoff is tested on devnet.

---

## 5. Tokenomics

### 5.1 BRZA at a glance

| Field | Value |
|---|---|
| Token | BRZA — Baraza Token |
| Standard | Stellar custom asset |
| Total supply | 1,000,000,000 BRZA (capped) |
| Decimals | 7 |
| Phase 0 price | $0.02 |
| Seed price | $0.04 |
| Strategic price | $0.06 |
| IDO price | $0.10 |
| Source of truth | `app/src/lib/brza/constants.ts` |

### 5.2 Allocation

Authoritative allocation, matching `BRZA_ALLOCATION` in `constants.ts`. The total sums to 1,000,000,000 (100%).

| Bucket | Tokens | % | Vesting |
|---|---|---|---|
| Community Rewards | 200,000,000 | 20% | Emission over 5 years, capped 2M / month |
| Founder A | 75,000,000 | 7.5% | 1-year cliff, 3-year linear vest |
| Founder B | 75,000,000 | 7.5% | 1-year cliff, 3-year linear vest |
| Operations | 150,000,000 | 15% | 1-year cliff, milestone-gated tranches (≈30M each) |
| Public Sale | 120,000,000 | 12% | Phase 0: 20M @ $0.02; IDO: 100M @ $0.10; 6-mo cliff + 12-mo vest |
| Reserve | 100,000,000 | 10% | 2-year cliff, 3-year vest, governance vote required to release |
| Liquidity Pool | 80,000,000 | 8% | Unlock at IDO, locked 12 months |
| Grants | 80,000,000 | 8% | 6-month cliff, 2-year vest |
| Referral | 50,000,000 | 5% | Per-event, capped 50,000 BRZA / month, Phase 0 only |
| Events | 40,000,000 | 4% | Per-event, hackathons / buildathons |
| Baraza TV Creators | 30,000,000 | 3% | Per content milestone |

Note on reconciliation: an earlier Notion product spec sums to 110% (5 buckets overstated). This whitepaper follows the on-chain constants — they are authoritative; the Notion variant is a known stale draft (see `docs/OPEN_TASKS_RESEARCH_UPDATE.md`).

### 5.3 Community emission

The 200M Community Rewards bucket emits at a hard ceiling of **2,000,000 BRZA per month** across the entire protocol. Internal split:

| Flow | Share of monthly emission |
|---|---|
| Bounty pool | 40% |
| Membership reward (on-time dues) | 30% |
| Governance reward (vote / propose) | 20% |
| Reserved (future flows) | 10% |

Referral payouts **do not** draw from the Community Rewards bucket. They draw from the separate 50M Referral allocation (see §5.4).

### 5.4 Referral mechanic — cleared conditional

Phase 6 referral payouts shipped under a council ruling on 2026-06-19 (filings: Kofi `351d`, Zara `18f8`, Nia `4c43`, Seku `f025`). Constraints encoded in `constants.ts` and enforced at runtime by `referralPayoutBlockedReason()`:

- **Eligibility gate.** Referee must be active 90 days **and** have made 3 dues payments before either side is paid.
- **Payouts.** 500 BRZA referrer, 250 BRZA referee.
- **Per-wallet cap.** 5 paid pairs per referrer per rolling 12 months.
- **Velocity guard.** > 5 pairs / 30 days pauses the referrer for human review.
- **Monthly sub-cap.** 50,000 BRZA / month, protocol-wide.
- **Price ceiling.** Disabled above Phase 0 ($0.02) until identity continuity (Celo G$ or Soroban credential) is live.
- **Pepper requirement.** Disabled at runtime unless `PAYMENT_PHONE_HASH_PEPPER` is configured.
- **Multisig.** Disbursements require named multisig signers (Kofi cond 4d). Open at time of draft.

This is the second of two governance-cleared shipments where the council attached durable conditions. Investors should treat the conditions as load-bearing — bypassing them removes the council's authorisation and the protocol's runtime guard will block payouts.

### 5.5 Vesting schedule

| Bucket | Cliff (days) | Vest (days) | Notes |
|---|---|---|---|
| Founder A | 365 | 1,095 | 4-year total |
| Founder B | 365 | 1,095 | 4-year total |
| Operations | 365 | 1,095 | Milestone-gated within vest curve |
| Reserve | 730 | 1,095 | Plus governance-vote release |
| Grants | 180 | 730 | |
| Public Sale | 180 | 365 | Applies to Phase 0 + IDO buyers |

The vesting curve is encoded; `vestedAmount(bucket, daysSinceTge)` returns the cumulatively-vested supply per bucket on a given day.

### 5.6 Fees

- Treasury transaction fee: **2%** (`treasuryTxPct = 0.02`)
- Swap fee: **0.5%** (`swapPct = 0.005`)
- Loan terms (global, never per-community): **50% LTV, 5% APR, 12-month term**.

The EVM-specific runbook references a 2.5% reward split — that is an intentional design alternative for the Aragon OSx auction surface, not a protocol-fee change.

---

## 6. Use of funds

Funds raised at Phase 0 and at IDO are committed to a fixed ladder. The protocol does not run discretionary marketing.

| Bucket | % of raise | Use |
|---|---|---|
| Engineering | 35% | Stellar mainnet hardening, indexer integration, Solana program audit + devnet, Aragon OSx audit, USSD provider coverage |
| Mobile rails | 20% | Kotani Pay production keys, Africa's Talking production volume, M-Pesa Daraja approvals, multi-MNO expansion (MTN, Airtel) |
| Legal & compliance | 15% | VASP licensing review per jurisdiction, securities posture, cooperative-law alignment in Kenya/Uganda |
| Community + creator payouts | 12% | Seeding Community Rewards emission, Baraza TV creator advances, bounty pool top-ups |
| Treasury reserve | 10% | Held in stablecoin + XLM, multisig-controlled, draw rules governance-gated |
| Liquidity provision | 8% | Liquidity Pool seeding at IDO unlock |

---

## 7. Revenue model

Three surfaces, sequenced:

1. **Protocol fees on treasury moves.** 2% on outbound treasury transactions. Communities self-select into Baraza because the alternative is no audit trail; the fee is competitive with mobile-money send fees they already pay.
2. **Creator economics — Baraza TV.** 10% protocol fee on subscription and tip revenue. Creator share is 70%, community DAO share is 20%. Requires creator to hold an active membership.
3. **DEX (Phase 5).** Swap fees on community-token liquidity once a DEX is live.

We do **not** model speculative BRZA appreciation as revenue.

---

## 8. Roadmap and milestones

| Phase | Milestone | Status |
|---|---|---|
| Phase 0 | Phone-first onboarding, M-Pesa dues sandbox, Stellar treasury, web proposals + voting | In active build |
| Phase 1 | Stellar mainnet verification end-to-end, BRZA mint on confirmed dues, indexer reconciliation | Cleared, in build |
| Phase 2 | Bounty market — communities post work, members rate, BRZA pays out | Planned |
| Phase 3 | Baraza TV creator economics live with weekly release cadence | Planned |
| Phase 4 | Solana governance programs deployed to devnet → mainnet; cross-chain BRZA bridging | Planned |
| Phase 5 | Community-token DEX; LP unlock | Planned |
| Phase 6 | Referral mechanic (time-limited at Phase 0) | Cleared, conditional |
| IDO | Public sale at $0.10, liquidity unlock | Planned |

Each phase has explicit ship gates. Stellar launches first; EVM and Solana are never treated as launch blockers.

---

## 9. Team and governance

- **Founder:** Aziz Mohammed (@azizke) — `wethem2022@gmail.com`. Building the protocol end-to-end. Detailed bio available on request.
- **Akili Council** (operational AI governance, not human): five specialists with full character bibles in `docs/akili-council/`. The council relays decisions through a single voice for community-facing communication; dissent is preserved in the council's internal filings rather than compressed away. Decisions affecting tokenomics are persisted on-chain or in the council record before they take runtime effect.
- **Human governance:** multisig signers for treasury and disbursements are being named ahead of mainnet handoff. `withdrawals_enabled = false` until that handoff is devnet-tested.

A more complete team page will be appended once advisors and a CFO/legal lead are finalised.

---

## 10. Active blockers, declared openly

### 10.1 Pre-IDO legal blockers (priority order)

1. **Kenya VASP Act, 2025 compliance.** Act passed 7 Oct 2025, presidential assent 15 Oct 2025; draft Regulations 2026 under joint CMA + CBK oversight. Requires a Kenya-domiciled entity, physical office, and director KYC/competence assessment. This is the **#1 pre-IDO blocker** ahead of mobile-rail integration — 8-to-12-week lead time. See [`COUNSEL_REVIEW_CHECKLIST.md`](./COUNSEL_REVIEW_CHECKLIST.md) §2 and [`RESEARCH_RWA_DAO.md`](./RESEARCH_RWA_DAO.md) §5.1.
2. **VASP / securities posture for other jurisdictions** — Nigeria SEC, FSCA, MiCA scope. Counsel engaged, not resolved.
3. **M-Pesa Daraja production approvals** — 6-week lead time (was previously listed first; now sequenced behind VASP because Daraja approval depends on the Kenya operating entity).
4. **Multi-MNO expansion** (MTN MoMo, Airtel, Telebirr) — sequenced after Kenya production launch.
5. **Token allocation discrepancy reconciliation** (Notion vs `constants.ts`) — to be closed before any external publication of the cap table.

### 10.2 Pre-Phase-1 technical blockers (dependency order, per `CLAUDE.md`)

1. `ANTHROPIC_API_KEY` provisioned to Vercel + GitHub Actions.
2. Supabase env vars provisioned to Vercel (URL, anon key, service role key).
3. Run Supabase migrations 001–012 in order via `supabase db push`.
4. Fund Stellar testnet treasury G-account and run a payment-verification smoke.
5. Pick an indexer source for `MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED` (currently a blind status walk; real BRZA mint + Horizon confirmation already ship).

---

## 11. Risks

### 11.1 Regulatory

- **Securities risk.** BRZA is presented as a utility / participation token, but jurisdictional treatment varies. Kenya CMA, Nigeria SEC, and South African FSCA postures differ. Counsel engagement is in progress; the IDO will not open in a jurisdiction without a clear position.
- **Mobile-money licensing.** M-Pesa Daraja and equivalent rails require formal approvals and KYC alignment. Our integrator (Kotani Pay) carries some of this; the protocol's own posture is being finalised.
- **Cooperative law.** In Kenya, formal chama / SACCO law (Cap. 490 cooperatives) may apply to some Baraza communities. The protocol is being structured so a registered cooperative can use Baraza as its ledger without losing legal standing.

### 11.2 Operational

- **MNO concentration.** M-Pesa is dominant in Kenya. A change to Daraja terms or pricing is a real risk. Mitigation: planned multi-MNO support and direct-debit fallbacks (Airtel, MTN, Telebirr).
- **Indexer dependency.** The `INDEXER_CONFIRMED` step relies on an external indexer for Horizon reconciliation. Source not yet picked; we will not promise a specific provider in this whitepaper.
- **Multisig handoff.** Treasury withdrawals require multisig. Until the signer set is named and devnet-tested, the protocol explicitly disables withdrawals.

### 11.3 Token

- **Sybil farming on referrals.** Acknowledged. Mitigated by the dues floor + per-wallet cap + velocity guard + monthly sub-cap + pepper dedup + phase price ceiling. Council research (Seku filing `f025`) documents the live attack landscape; the gate is designed to be replaced by an identity-credential mechanism before IDO price.
- **Founder concentration.** Combined founder allocation is 15% with a 1-year cliff and 3-year vest. This is conventional but not negligible; investors should review the vest curve before strategic round close.
- **Liquidity at IDO.** 80M BRZA is reserved for liquidity provision, unlocked at IDO and locked for 12 months. Slippage risk on launch day is bounded by the LP depth and the IDO sale size (100M).

### 11.4 Architectural

- **Cross-chain coordination.** BRZA is Stellar-native. Bridging is planned (Phase 4). Cross-chain consistency is a hard problem; the protocol explicitly does **not** rely on cross-chain settlement for Phase 0–3.
- **AI dependency.** Akili is a Claude consumer. The protocol degrades to a static response when the API key is absent; AI is never a signer. Investors should treat Akili as a UX layer, not as core protocol logic.

### 11.5 Honesty

Several features in marketing material across the project (`README.md`, `app/docs/PRD.md`, `CLAUDE.md`) are in different states. Where this whitepaper and code disagree, the code is authoritative. Where features are described in future tense, they are not yet shipped.

---

## 12. Why now

- Mobile money is mature enough that a feature-phone member can pay dues without friction.
- Stellar's payment-first chain and stablecoin support make settlement cheap and verifiable.
- Claude-class AI makes proposal drafting and Swahili-English translation cheap enough to put into every community, removing the literacy barrier that previously gated formal governance.
- WhatsApp + paper-ledger fatigue is real and rising — chairpersons we have spoken to are asking for a better ledger, not asking for crypto.

The convergence of these four — mobile money, low-fee settlement, accessible AI, and rising demand for auditable community treasuries — is recent and African-specific. Baraza is built for that convergence.

---

## 13. Asks

What we are looking for, in priority order:

1. **Strategic capital** that brings African mobile-money or cooperative-finance distribution.
2. **Pre-seed / seed capital** with patience for an 18-to-24-month Phase 0 → IDO ramp.
3. **Operational partners** for VASP licensing, Daraja/MNO approvals, and SACCO sector outreach in Kenya/Uganda.
4. **Audit partners** for the Stellar payment-verification path, the Solana Anchor programs, and the EVM Aragon OSx integration.

---

## 14. Contact

- Founder: Aziz Mohammed — `wethem2022@gmail.com`
- GitHub: `github.com/Azizudinly/baraza-protocol`
- Live: `baraza-protocol.vercel.app`

---

## 15. Disclaimers

This whitepaper is a working draft, not a final offering document. Nothing in it constitutes an offer to sell or a solicitation to buy a security in any jurisdiction. BRZA is presented as a utility and participation token pending counsel review; final classification per jurisdiction will be appended before any sale opens. Tokenomics, allocation, and vesting are governed by the on-chain constants in `app/src/lib/brza/constants.ts` — that file is the source of truth and supersedes anything written here. Forward-looking statements (roadmap phases, revenue surfaces) are subject to change. Past activity on the protocol does not predict future BRZA value. Recipients of this document agree not to redistribute it without the founder's consent.
