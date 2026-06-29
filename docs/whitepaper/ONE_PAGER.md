# Baraza Protocol — One-Pager

*Community finance and governance, built for African groups, settled on Stellar, opened by a phone call.*

**Founder:** Aziz Mohammed · `wethem2022@gmail.com` · **Live:** baraza-protocol.vercel.app · **Draft:** 2026-06-19

---

**What it is.** A shared treasury and governance protocol for African chamas, stokvels, SACCOs, cooperatives, DAOs, and 19 other community types. Members join with a phone number, pay dues by M-Pesa, vote on how funds move, and earn BRZA for participating. No seed phrases. No bank account required.

**The wedge.** Phone-first onboarding (USSD + SMS on any feature phone) plus mobile-money settlement (M-Pesa → Kotani Pay → XLM → community treasury). Crypto stays in the plumbing.

**The moat.** A portable, on-chain community track record — dues collected, proposals passed, contributors paid — that previously did not exist. Communities self-select in because the alternative (WhatsApp + paper ledger + treasurer's personal account) fails predictably.

---

### Tokenomics, capped

| | |
|---|---|
| **Token** | BRZA — Stellar custom asset, 7 decimals |
| **Supply** | 1,000,000,000 (capped) |
| **Phase 0 / Seed / Strategic / IDO** | $0.02 / $0.04 / $0.06 / $0.10 |
| **Community emission cap** | 2,000,000 BRZA / month |
| **Source of truth** | `app/src/lib/brza/constants.ts` |

| Bucket | % | Vesting |
|---|---|---|
| Community Rewards | 20% | 2M/mo cap, 5-year curve |
| Founder A + B | 7.5% each | 1y cliff + 3y vest |
| Operations | 15% | 1y cliff + milestone-gated |
| Public Sale | 12% | Phase 0 (20M) + IDO (100M), 6mo cliff + 12mo vest |
| Reserve | 10% | 2y cliff + 3y vest (governance-released) |
| Liquidity Pool | 8% | Unlock at IDO, locked 12mo |
| Grants | 8% | 6mo cliff + 2y vest |
| Referral | 5% | Phase-0-only, gated by council conditions |
| Events | 4% | Per event |
| Baraza TV Creators | 3% | Per content milestone |

---

### Revenue surfaces

1. **2%** protocol fee on outbound treasury transactions.
2. **10%** protocol share of Baraza TV creator subscription + tip revenue (70% creator, 20% community DAO).
3. **0.5%** swap fee on the community-token DEX (Phase 5).

No discretionary marketing spend. Growth budget is Community Rewards emission + Grants bucket.

---

### What ships today

- Community creation, 23 type presets, phone-first onboarding, USSD + SMS, web onboarding.
- M-Pesa dues via Kotani Pay (sandbox), Stellar treasury G-accounts, BRZA mint on confirmed dues.
- Proposal + voting (web and USSD), membership attestation, admin order review.
- Akili relay (Claude streaming) + Akili Council (5 specialists, never a signer).
- Multisig withdrawals **disabled** until devnet-tested handoff.

### What's next

| Phase | What ships |
|---|---|
| 1 | Stellar mainnet verification end-to-end, indexer reconciliation |
| 2 | Bounty market — communities post, contributors complete, members rate, BRZA pays out |
| 3 | Baraza TV creator economics live, weekly cadence |
| 4 | Solana governance programs to mainnet, cross-chain BRZA |
| 5 | Community-token DEX, LP unlock |
| IDO | Public sale at $0.10 |

---

### Why now

Mobile money is mature, Stellar settlement is cheap and verifiable, Claude-class AI removes the literacy barrier to formal governance, and chairpersons are asking for a better ledger — not for crypto. The convergence is recent and African-specific.

### Active blockers, declared

ANTHROPIC_API_KEY · Supabase env vars · Supabase migrations 001–012 · Stellar testnet treasury funding · Indexer source · M-Pesa Daraja approvals (6-week lead) · VASP/securities posture per jurisdiction · Notion allocation reconciliation (code is authoritative).

### The ask

Strategic capital with African mobile-money or cooperative-finance distribution. Pre-seed / seed with patience for an 18–24-month Phase 0 → IDO ramp. Operational partners for Daraja and SACCO sector outreach. Audit partners for Stellar, Solana, and EVM surfaces.

---

*BRZA is presented as a utility and participation token pending counsel review. This is not a solicitation or an offer of securities. Tokenomics, vesting, and allocation are governed by the on-chain constants in `app/src/lib/brza/constants.ts` and supersede anything written here.*
