# TODOS

## Governance

## Data

### knowledgeGraph selects a memberships column that doesn't exist
**Priority:** P2
`app/src/lib/knowledgeGraph.ts:425` selects `created_at` from `memberships`, but no migration defines that column — the query fails with 42703 (and the new column-level GRANT correctly omits it). Drop `created_at` from the select and the `row.joined_at ?? row.created_at` fallback, or add the column.
Noticed on: feat/brza-core (delta review, 2026-06-11)

## Design

### Make the landing vibrant — phase 2 (deferred from /design-review 2026-06-12)
**Priority:** P2
Fixed in phase 1: hero entrance stagger, brand-black CTA band, hero gradient intensity, tactile CTAs, chain-name copy leak. Still deferred: (a) swap Inter body font for a characterful sans (Geist/Satoshi) — both installed taste skills ban Inter; (b) break the symmetric identical card grids in FeaturesSection/FlowWalkthrough into asymmetric layouts; (c) extend framer-motion `whileInView` reveals (pattern exists in CTASection) to all landing sections; (d) consider a more committed color strategy mid-page (cream near-white base is the flagged AI default).
Noticed on: feat/brza-core (/design-review, 2026-06-12)

## Performance

### Profile page double-fetches memberships
**Priority:** P3
`fetchTotalBrzaBalance(address)` queries the same memberships rows as `fetchMembershipsForWallet(address)` in the adjacent effect. Compute the total from the already-fetched records (sum of `brzaBalance`) and drop the second round trip. Also: `useBrzaBalance`'s module-level cache never evicts expired entries.
Noticed on: feat/brza-core (performance review, 2026-06-11)

## Completed

### 2026-06-14 — Chain-adapter boundary cleanup
- Deleted empty root `lib/adapters/` scaffold. Real chain code already lives in `app/src/lib/adapters/`.
- Updated `.github/PULL_REQUEST_TEMPLATE.md` checklist to reference `app/src/lib/adapters/index.ts`.

### 2026-06-14 — Phone/email-identity voter gate + USSD vote menu honesty (443f9dc)
- `useWalletGuard` now accepts phone/email session as a fallback identity (`phone:<num>` / `email:<x>`), matching USSD membership key shape.
- USSD vote menu replaced misleading "Vote queued. Will broadcast when online." with honest copy, and added Abstain to match web's three-way vote.

### 2026-06-14 — Wallet-migration double-vote guard + payment_orders hash columns
- Migration 013 adds a BEFORE INSERT trigger on `votes` that walks the `migrated_from` / `migrated_to` chain and rejects a vote if any chain member already voted on the same proposal. DB-level backstop so the future vote-casting API can't bypass it by forgetting to walk.
- `stellar/verify-payment.ts` now writes `intent_token_hash` (sha256 of the signed intent), `user_id_hash` (HMAC-peppered payer address), and `amount_xlm` when persisting orders, activating migration 010's intent-token unique index. Intent-replay attempts now surface as a distinct `stellar_intent_reused` 409.
