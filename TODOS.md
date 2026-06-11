# TODOS

## Architecture

### Make the chain-adapter boundary real or drop the rule
**Priority:** P1
The PR template requires "all chain calls go through `/lib/adapters/index.ts`", but the root `lib/adapters/*` files are empty stubs outside the Vite module graph — every real chain call lives in `app/src` (hooks/useBarazaContract.ts, lib/stellar, lib/programs). Either move the adapter boundary into `app/src/lib/adapters` and refactor chain calls behind it, or remove the root scaffold and the checklist rule until the migration actually happens.
Noticed on: feat/brza-core (review, 2026-06-11)

## Governance

### Wallet-migration double-vote check in the vote-casting API
**Priority:** P1
`votes_member_proposal_unique` is per `member_id`, but migration 004 supports wallet migration (`migrated_from`/`migrated_to`) — one human can hold two member_ids and vote twice on one proposal. The vote-casting API must walk the migration chain before accepting a vote.
Noticed on: feat/brza-core (adversarial review, 2026-06-11)

### Wire payment code to the new payment_orders columns
**Priority:** P2
Migration 010 added `intent_token_hash`, `user_id_hash`, `amount_xlm`, `amount_kes`, `brza_allocated`, but verify-payment.ts/activate.ts don't write them yet — the intent token stays in the request body only. Store sha256(intentToken) into `intent_token_hash` so the unique index and replay protection actually guard something.
Noticed on: feat/brza-core (data-migration review, 2026-06-11)

## Data

### knowledgeGraph selects a memberships column that doesn't exist
**Priority:** P2
`app/src/lib/knowledgeGraph.ts:425` selects `created_at` from `memberships`, but no migration defines that column — the query fails with 42703 (and the new column-level GRANT correctly omits it). Drop `created_at` from the select and the `row.joined_at ?? row.created_at` fallback, or add the column.
Noticed on: feat/brza-core (delta review, 2026-06-11)

## Performance

### Profile page double-fetches memberships
**Priority:** P3
`fetchTotalBrzaBalance(address)` queries the same memberships rows as `fetchMembershipsForWallet(address)` in the adjacent effect. Compute the total from the already-fetched records (sum of `brzaBalance`) and drop the second round trip. Also: `useBrzaBalance`'s module-level cache never evicts expired entries.
Noticed on: feat/brza-core (performance review, 2026-06-11)

## Completed
