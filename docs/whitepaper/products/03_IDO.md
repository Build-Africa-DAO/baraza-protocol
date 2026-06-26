# 03 — IDO / Public Launch

The public sale that takes BRZA from internal pricing phases to a market-listed asset, unlocks liquidity, and starts the public reserve clock. Jurisdictionally gated — the IDO is **not** a launch we drive; it is a regulatory event we have to clear into.

---

## What it is

BRZA's public launch is the fourth and last of four pricing phases encoded in `BRZA_PHASES` (`app/src/lib/brza/constants.ts`):

| Phase | Price (USD) | Label |
|---|---|---|
| `phase0` | $0.02 | Pre-Sale — Community Seed |
| `seed` | $0.04 | Seed Round |
| `strategic` | $0.06 | Strategic Round |
| **`launch`** | **$0.10** | **IDO Launch** |
| `market` | (market) | Post-IDO market price |

`CURRENT_PHASE` at the time of this draft is `phase0`. The IDO opens BRZA to the public at $0.10 and is the *first* moment any retail-facing participation outside the existing Phase 0 community pre-sale is permitted.

## What ships at IDO

1. **Public sale of 100M BRZA at $0.10** from the Public Sale bucket (`BRZA_ALLOCATION.publicSale = 120,000,000`; Phase 0 already drew 20M at $0.02; IDO draws the remaining 100M at $0.10).
2. **Liquidity Pool unlock — 80M BRZA** (`BRZA_ALLOCATION.liquidityPool = 80,000,000`, 8%) becomes available and is locked into the public LP for **12 months** from the IDO moment.
3. **Reserve cliff clock continues.** The Reserve bucket has a 730-day cliff and remains locked through IDO; release additionally requires a governance vote (not just time).
4. **Liquidity-pool LP token custody.** Held by the protocol multisig; release governed.
5. **Public sale buyer vesting** kicks in: 180-day cliff + 365-day linear vest from IDO close.
6. **Referral mechanic disables.** `BRZA_REFERRAL.priceCeilingPhase = 'phase0'` — referral payouts must not persist into IDO price until identity continuity (Celo G$ or Soroban credential) is live. Enforced at runtime by `referralPayoutBlockedReason()`.

## Mechanic summary

| Field | Value |
|---|---|
| IDO price | $0.10 USD per BRZA |
| Public sale at IDO | 100M BRZA (10% of supply) |
| Public sale at Phase 0 (already underway) | 20M BRZA @ $0.02 |
| Liquidity Pool unlock | 80M BRZA (8%), locked 12 months in public LP |
| Public sale buyer vesting | 180-day cliff + 365-day linear vest |
| Referral mechanic | Disabled above Phase 0 price until identity continuity live |

## Jurisdictional gating

**The IDO will not open in any jurisdiction without a clear legal position.** The counsel-review checklist matrix governs which markets open at IDO.

Priority gates, in dependency order:

1. **Kenya VASP Act, 2025 compliance.** Act passed 7 Oct 2025, draft Regulations 2026 under joint CMA + CBK oversight. Kenya-domiciled operating entity, physical office, director KYC are 8–12-week processes. This is the **#1 IDO blocker.** Investor whitepaper §10.1.
2. **South Africa FSCA posture.** Crypto declared a financial product Oct 2022. Any stokvel-facing IDO marketing pulls FSCA in. Mitigation: BRZA is participation, not yield.
3. **Nigeria SEC Rules on Digital Assets (2022, as amended).** Utility-token exemption is narrow.
4. **US persons.** Excluded by default at IDO unless Reg S / Reg D structure is in place.
5. **EU / UK MiCA scope.** Determined per counsel before any UK/EU marketing.

## Use of IDO proceeds

Same ladder as the investor whitepaper §6:

| Bucket | % | Use |
|---|---|---|
| Engineering | 35% | Stellar mainnet hardening, indexer integration, Solana program audit + devnet, Aragon OSx audit |
| Mobile rails | 20% | Kotani Pay production keys, Daraja approvals, multi-MNO expansion |
| Legal & compliance | 15% | VASP licensing, jurisdictional securities posture, cooperative-law alignment |
| Community + creator payouts | 12% | Seeding Community Rewards emission, Baraza TV creator advances, bounty pool top-ups |
| Treasury reserve | 10% | Stablecoin + XLM, multisig-controlled |
| Liquidity provision | 8% | LP seeding alongside the 80M Liquidity Pool unlock |

No discretionary marketing line. Growth budget is Community Rewards emission + Grants bucket.

## Status

Planned. Not opened. Not scheduled.

A pre-IDO checklist will live in a separate operations doc once Phase 1 is verified on Stellar mainnet and the Kenya operating entity is registered.

## Risks and constraints

- **Securities classification.** BRZA is a utility / participation token *pending counsel review.* Final classification per jurisdiction is the gating risk. The IDO close date is downstream of this question, not upstream.
- **Liquidity at launch.** 80M BRZA seeded into LP against a 100M sale is a meaningful float relative to depth. Slippage and price discovery risk on launch day are real. The 12-month LP lock is the mitigation.
- **Public-sale buyer vesting (180-day cliff + 365-day vest).** Reduces float dump risk but must be disclosed clearly to buyers before they participate. Buyer expectations management is a counsel-review item.
- **Reserve release requires a governance vote.** This is intentional — Reserve is not a time-only unlock. Investors should expect the Reserve bucket to behave as a true emergency / strategic pool, not as a scheduled tranche.
- **Referral mechanic disables at IDO.** Phase 0 referral participants should know in advance that the rewards path closes at IDO until identity-continuity rails are live.
- **Multisig signer set must be named** before IDO close (Kofi council cond 4(d)). No exceptions.
- **`withdrawals_enabled = false` until devnet-tested handoff.** This applies to the IDO LP custody too.

## Open questions

- Listing venue(s) — DEX-only at IDO, or CEX co-list? Counsel + listing-team decision; not made.
- Lockup contract — on Stellar (Soroban) or off-chain (escrow agent)? Engineering + counsel decision.
- Reserve release governance — what vote structure? Default is the Akili council's standard proposal flow plus a multisig signoff; finalise before IDO.
- Diaspora participation — KYC vendor, jurisdictions opened, sale caps per jurisdiction.
