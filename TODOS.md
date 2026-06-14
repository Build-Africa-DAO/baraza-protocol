# TODOS

## Governance

## Completed

### 2026-06-14 — Profile double-fetch + useBrzaBalance cache eviction
- Profile.tsx dropped the `fetchTotalBrzaBalance(address)` round trip — it queried the same memberships rows as the adjacent `fetchMembershipsForWallet` effect. `totalBrza` is now a `useMemo` summing `record.brzaBalance` across `myMemberships` (which already carries `voting_weight` via rowToRecord).
- `fetchTotalBrzaBalance` removed from useBrzaBalance.ts (Profile.tsx was the only caller).
- Added `sweepExpiredCache()` invoked on every cache lookup so the module-level Map drops entries past TTL instead of growing forever.

### 2026-06-14 — Landing vibrancy phase 2 (a/b/c/d)
- (a) Body font Inter → Public Sans (USWDS-derived humanist sans). Display stays Hanken Grotesk.
- (b) Editorial offset on the symmetric card grids: FeaturesSection's 2×2 workflow grid and FlowWalkthrough's 4-col flow row now drop every other card by a half-step on desktop. Breaks AI-grid symmetry without changing semantics.
- (c) Extended `whileInView` reveals to FlowWalkthrough (was the only landing section without an on-scroll reveal).
- (d) Light surfaces shifted from neutral cream (`hsl(0 0% 98%)`) to brand-hue warm (`hsl(22 30% 97%)` background, `hsl(22 20% 99%)` card). Matches the existing warm `--muted`/`--surface` tokens; whole palette now reads as intentional.

### 2026-06-14 — knowledgeGraph stopped selecting nonexistent memberships.created_at
- Dropped `created_at` from the Supabase select at `app/src/lib/knowledgeGraph.ts:425`, the optional field on `MembershipRow`, and the `row.joined_at ?? row.created_at` fallback in `membershipFromRow`.
- Migration 004 only defines `joined_at`; the query was failing with PostgREST 42703 and the column-level GRANT correctly omits the missing column.

### 2026-06-14 — Chain-adapter boundary cleanup
- Deleted empty root `lib/adapters/` scaffold. Real chain code already lives in `app/src/lib/adapters/`.
- Updated `.github/PULL_REQUEST_TEMPLATE.md` checklist to reference `app/src/lib/adapters/index.ts`.

### 2026-06-14 — Phone/email-identity voter gate + USSD vote menu honesty (443f9dc)
- `useWalletGuard` now accepts phone/email session as a fallback identity (`phone:<num>` / `email:<x>`), matching USSD membership key shape.
- USSD vote menu replaced misleading "Vote queued. Will broadcast when online." with honest copy, and added Abstain to match web's three-way vote.

### 2026-06-14 — Wallet-migration double-vote guard + payment_orders hash columns
- Migration 013 adds a BEFORE INSERT trigger on `votes` that walks the `migrated_from` / `migrated_to` chain and rejects a vote if any chain member already voted on the same proposal. DB-level backstop so the future vote-casting API can't bypass it by forgetting to walk.
- `stellar/verify-payment.ts` now writes `intent_token_hash` (sha256 of the signed intent), `user_id_hash` (HMAC-peppered payer address), and `amount_xlm` when persisting orders, activating migration 010's intent-token unique index. Intent-replay attempts now surface as a distinct `stellar_intent_reused` 409.
