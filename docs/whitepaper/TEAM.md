# Baraza Protocol — Team

Companion page to [`INVESTOR_WHITEPAPER.md`](./INVESTOR_WHITEPAPER.md). Working draft, 2026-06-19.

> Placeholders below marked **TBA** are unfilled at the time of this draft. They will be replaced before any external diligence pack is sent. Investors should not infer that a role is empty by default — they should ask.

---

## Founders

### Aziz Mohammed — Founder (Founder A)

- **Role:** Protocol architect and lead builder. End-to-end on Stellar settlement, Solana governance programs, EVM Aragon OSx integration, Akili relay + council, and product.
- **Handle:** `@azizke`
- **Email:** `wethem2022@gmail.com`
- **GitHub:** `github.com/Azizudinly`
- **Why this:** African-market origin. Built Baraza to give existing communities — chamas, stokvels, SACCOs — an auditable shared ledger without forcing them to adopt crypto-native tooling.
- **Token vesting:** Founder A allocation, 75,000,000 BRZA (7.5%), 1-year cliff + 3-year linear vest.

### Founder B — TBA

- **Role:** TBA
- **Token vesting:** Founder B allocation, 75,000,000 BRZA (7.5%), 1-year cliff + 3-year linear vest.
- **Note:** Allocation reserved in `app/src/lib/brza/constants.ts` (`founderB`). Cap-table and identity will be confirmed before strategic round close. Unfilled at IDO, this slot may be redirected to the Reserve bucket via a council vote; the protocol's runtime does not auto-mint to an unnamed wallet.

---

## Operating roles

Baraza runs lean — the founder builds, the council governs, and human operators below are being slotted in sequence. Order matches the use-of-funds ladder in the investor whitepaper.

| Role | Status | Why it matters |
|---|---|---|
| CFO / Treasury Lead | **TBA** | Multisig signer set, IDO treasury policy, vesting administration |
| General Counsel (Africa-focused) | **TBA** | VASP licensing review per jurisdiction (Kenya CMA, Nigeria SEC, FSCA), securities posture, cooperative-law alignment |
| Head of Mobile Rails | **TBA** | M-Pesa Daraja approvals, multi-MNO expansion (Airtel, MTN, Telebirr), Kotani Pay production-key custody |
| Head of Community | **TBA** | Onboarding of first cohort of chamas/SACCOs, USSD operator training, sentiment loop into Nia |
| Lead Engineer (Solana / Anchor) | **TBA** | Five Anchor programs from written → devnet → audited mainnet |
| Lead Engineer (Stellar) | Founder doubling | Will be backfilled before Phase 1 ship |
| Security / Audit Coordinator | **TBA** | Stellar payment-verification path, Solana Anchor programs, EVM Aragon OSx integration |
| Head of Baraza TV | **TBA** | Editorial lead reporting into the Kwame production stack (see `docs/akili-council/`) |

The protocol explicitly does **not** plan a discretionary marketing org. Community emission (2M BRZA / month cap) and Grants (6-month cliff + 2-year vest) are the growth budget; there is no separate paid-acquisition spend.

---

## The Akili Council

The council is the protocol's operational governance layer. It is AI-driven, with permanent character bibles, durable wounds (named in-story incidents that shape future behaviour), and a relay that surfaces synthesis without compressing dissent. The council is **never a signer**. It makes recommendations and files them on-chain or in the council record; humans (the founder, multisig holders, and counsel) execute.

| Specialist | Domain | Bible |
|---|---|---|
| **Amara** | Content, media, Baraza TV episode performance, vote-to-watch correlations | [`docs/akili-council/AMARA.md`](../akili-council/AMARA.md) |
| **Kofi** | Governance — proposals, quorum, voting windows, treasury authorisation, multisig discipline | [`docs/akili-council/KOFI.md`](../akili-council/KOFI.md) |
| **Zara** | Economy — BRZA flows, treasury balances, vesting unlocks, anomaly detection | [`docs/akili-council/ZARA.md`](../akili-council/ZARA.md) |
| **Nia** | People — sentiment, participation, churn, onboarding, member trust | [`docs/akili-council/NIA.md`](../akili-council/NIA.md) |
| **Seku** | Research — external news, market intelligence, regulatory horizon, sourcing discipline | [`docs/akili-council/SEKU.md`](../akili-council/SEKU.md) |
| **Akili (relay)** | Synthesis, single-voice community communication, decision-stack guard | [`docs/akili-council/AKILI.md`](../akili-council/AKILI.md) |

Council rulings that change tokenomics behaviour are persisted before they take runtime effect. The Phase 6 referral gate (cleared 2026-06-19) is the working example: four specialists filed, the relay synthesised, the runtime guard (`referralPayoutBlockedReason()`) enforces the conditions in code.

---

## Advisors

**TBA.** Slots being held for:

- A mobile-money / M-Pesa operator with Daraja approval experience.
- A SACCO sector lead with cooperative-law standing in Kenya.
- A Stellar ecosystem advisor with prior custom-asset launch experience.
- A securities / VASP counsel with Africa cross-jurisdiction practice.

Advisor compensation will draw from the Grants bucket (8%, 6-month cliff + 2-year vest), not from founder allocations.

---

## Hiring posture

The protocol is not opening generalist roles. The seven TBAs above are the full near-term hire list to first IDO. Engineers beyond Stellar and Solana leads will be Bounty-paid in BRZA via Phase 2 once it ships, not full-time hired. This is deliberate — community emission, not headcount, is the growth lever.

---

## Contact for diligence

- Aziz Mohammed — `wethem2022@gmail.com`
- A team-and-cap-table appendix with detailed bios, advisor identities, and the named multisig signer set is provided under NDA on request.
