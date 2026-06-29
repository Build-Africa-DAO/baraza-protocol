# 04 — DEX

A community-token liquidity surface on Stellar. Lets a community optionally launch its own community token, pair it against BRZA or XLM, and trade it on an audit-trail-first DEX. **Phase 5 — last of the four products to ship.**

---

## What it is

The Baraza DEX is the swap and liquidity surface for community-issued assets. A community that wants to launch its own membership / utility / stable token does so on Stellar (as a custom asset), and the DEX provides:

- **Spot swap** between community token, BRZA, XLM, and any whitelisted stable (e.g. USDC on Stellar).
- **Liquidity pools** for community-token pairs.
- **A clean audit trail** that fits the same governance primitives a Baraza community already uses for treasury (proposals, multisig, vote).

The DEX is not a generalist DEX. It exists to serve the long tail of Baraza-launched community tokens that would otherwise have no venue. Headline competitors (StellarX, SDEX, Solana DEXs, Uniswap) are not addressing community-issued long-tail assets in African markets.

## Why it's a separate product

The Protocol product handles treasury, dues, voting, BRZA emission. The DEX is the surface where those primitives meet *external* liquidity — outside contributors, outside swappers, outside lenders. That boundary needs its own threat model, its own listing rules, and its own legal posture (a swap venue is a different regulatory animal than a community treasury).

Mixing them into a single product would have collapsed those distinctions. Keeping them separate keeps the Protocol pristine and the DEX scoped.

## Fee model

| Field | Value | Source |
|---|---|---|
| Swap fee | **0.5%** | `BRZA_FEES.swapPct = 0.005` (`app/src/lib/brza/constants.ts`) |
| LP fee share | TBD (post-IDO governance) | — |
| Protocol fee share | TBD (post-IDO governance) | — |

Swap fee is encoded; the LP-vs-protocol split is not yet finalised. Default split will be a council ruling before Phase 5 ships, persisted on-chain ahead of runtime effect (same pattern as the Phase 6 referral ship).

## Loan terms (DEX-adjacent)

Lending on top of LP-deposited assets is a near-DEX surface. Loan parameters are **global, hardcoded, never configurable per community** — per `CLAUDE.md`. From `LOAN_TERMS` in `app/src/lib/brza/constants.ts`:

| Field | Value |
|---|---|
| Max LTV | 50% |
| APR | 5% |
| Term | 12 months |

These constraints make any DEX-adjacent loan product behave more like a co-op credit window than a leverage market. That is deliberate — Baraza's audience is members, not traders.

## Liquidity Pool unlock

The **80M BRZA Liquidity Pool bucket** (`BRZA_ALLOCATION.liquidityPool`, 8% of supply) unlocks at IDO and is locked into the public LP for 12 months. The DEX inherits this LP as its initial BRZA-side depth.

Without the IDO unlock, the DEX has no seed liquidity. So the dependency chain is: **Phase 1 (Stellar mainnet) → IDO (LP unlock) → Phase 5 (DEX live)**. The DEX cannot ship before the IDO.

## Listing rules

A community can list its token if and only if:

1. The community has been live on the Protocol for a minimum tenure (TBD; default proposal will be 6 months).
2. The community has passed a council review (Zara on economy, Kofi on governance, Seku on sourcing — analogous to the Phase 6 referral gate flow).
3. The community's multisig is named and KYC-cleared.
4. The community's token is a Stellar custom asset following the same metadata posture as BRZA.
5. The community has at least one paired-asset depth commitment (BRZA / XLM / whitelisted stable).

The DEX does not list arbitrary tokens. Communities are the only issuers.

## Status

Planned (Phase 5). Not started. No code shipped.

What *does* ship before Phase 5:

- Stellar mainnet verification (Phase 1) — required for any swap to settle reliably.
- Liquidity Pool bucket — encoded, unlocked at IDO.
- Swap fee parameter — encoded.

## Roadmap

| Phase | What ships | Status |
|---|---|---|
| 5.0 | DEX MVP: BRZA / XLM / USDC pairs, swap-only (no LP UX) | Planned |
| 5.1 | Community LP creation, multisig-gated, council-reviewed listings | Planned |
| 5.2 | DEX-adjacent loan window: 50% LTV, 5% APR, 12-month term against LP positions | Planned |
| 5.3 | Cross-chain BRZA bridging into the DEX (depends on Phase 4) | Planned |
| 6+ | RWA-collateralised loans — community on-chain history as underwriting input. Crosses into the Goldfinch / Centrifuge / Huma surface. | Planned (post-Phase 5) |

## Risks and constraints

- **Securities classification of community tokens.** Each community token could land in a different regulatory bucket per jurisdiction. The DEX listing rules above are conservative deliberately — they exclude arbitrary issuers.
- **MEV / front-running on Stellar.** Lower than EVM but non-zero. Listing rules constrain attack surface; settlement model must be reviewed before DEX MVP.
- **Loan default risk.** 50% LTV is conservative. APR is fixed. Default handling is governance-decided per community on first incident — no auto-liquidation in MVP.
- **Liquidity fragmentation.** A community-token-per-community model produces many thin pools. Counter: pair everything against BRZA or USDC as the common asset; depth concentrates on those routes.
- **Listing-rule capture.** The council process must remain independent. Risk: a large community / single founder buys influence and forces a listing. Mitigation: Kofi-governed flow with persisted filings; ruling visible in the council record.
- **Swap fee not yet split.** Decide LP-vs-protocol share before Phase 5 ships. Persist the ruling on-chain.
- **`withdrawals_enabled = false`** until devnet-tested multisig handoff. Applies to LP withdrawals as well as treasury withdrawals.

## Open questions

- Order-book vs AMM. Default is AMM (Stellar Soroban contract); Stellar SDEX order-book integration is an option for blue-chip pairs.
- Native venue or fork. Build the DEX directly on Stellar Soroban, or fork an existing Stellar DEX UI and constrain it? Engineering decision; not made.
- Cross-chain bridge venue. Stellar ↔ Solana ↔ Base BRZA routing — partner with an existing bridge or build minimal native? Phase 4 decision, not Phase 5.
