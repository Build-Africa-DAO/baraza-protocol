# Baraza — Per-Product Briefs

Four products are named in `CLAUDE.md`. Each gets its own brief here, anchored in code and consistent with the whitepaper pack one level up.

| # | Product | Status |
|---|---|---|
| 01 | [Baraza Protocol](./01_PROTOCOL.md) — community treasury + governance rail | Phase 0, in active build |
| 02 | [Baraza TV](./02_BARAZA_TV.md) — community-led video, creator economics | Pre-launch, editorial council ready |
| 03 | [IDO / Public Launch](./03_IDO.md) — BRZA public sale, liquidity unlock | Planned, jurisdictionally gated |
| 04 | [DEX](./04_DEX.md) — community-token liquidity and swap surface | Planned (Phase 5) |

## Reading order

- **Investor / partner first read:** 01 → 03 → 04 → 02.
- **Builder / engineer first read:** 01 → 04 → 02 → 03.
- **Community / member first read:** 01 → 02. (03 and 04 are not yet user-facing.)

## Source of truth

Same rule as the parent pack: when a number here disagrees with `app/src/lib/brza/constants.ts` or `app/src/lib/constants.ts`, the code wins and this doc is wrong. Re-run the tokenomics audit before any external send.

## Cross-product invariants

These hold across all four products and never change without a council ruling persisted on-chain:

- **BRZA ≠ XLM.** Token is not the payment rail. Dues settle in mobile money / XLM; rewards mint in BRZA.
- **AI is never a signer.** Akili relay and council recommend; humans and multisigs execute.
- **Withdrawals disabled** until multisig handoff is devnet-tested. Applies to every product, including Baraza TV creator payouts and DEX LP withdrawals.
- **Stellar-first.** Every product launches on Stellar before any other chain.
- **Wallet support is restricted** to Phantom, Solflare, Coinbase Wallet. No exceptions per product.
