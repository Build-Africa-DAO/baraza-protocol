# TODOS

## Governance

## Gamification / rewards (P2 — design + scope before building)

Each item is small-blast-radius — uses tables/columns that already exist in the schema, no new token allocation beyond what's already documented in `app/src/lib/brza/constants.ts`. Order is build-order: first item is cheapest, last is the biggest swing.

### 1. Vote streak → voting weight multiplier
- `votes` table records `cast_at` per proposal. Compute the streak as "consecutive proposals in the same community where the member's last vote was within the previous proposal's window."
- Persist on a view, not as a column, until the read pattern is validated.
- Multiplier: capped at 1.5× weight after 6 consecutive votes; decays back to 1.0 after one skip. Decay schedule needs design — full reset is too punishing for chamas where one absence is normal.
- Display: small chip on Profile + ProposalDetail showing current streak. No leaderboard.
- Migration sketch lives in this PR thread; not yet a file.

### 2. Dues streak badge (no token reward, just standing)
- `payment_orders` already records every M-Pesa settlement. Compute `consecutive_months_paid_on_time` per member.
- Surface as a `member_standing` view + a "Good standing · 7 months" chip on the community page member list.
- No BRZA payout — this is reputational only. The cap-table doesn't need to absorb every engagement signal.

### 3. Referral 90-day survival gate
- Current referral pool (5% of supply per `brza/constants.ts`) currently allocates on signup per the docs comments. Gate the payout: referrer earns only after the referee stays an active member for 90 days AND pays at least 3 months of dues.
- Two-sided: referee gets X/2 BRZA on their 3rd successful dues payment. Halves Sybil incentive — the new account has to *do* something to unlock both sides.
- Update the cron promoter (CLAUDE.md flags this as a known-fake) to query `payment_orders` for the 90-day check before minting referral BRZA.

### Out of scope for now (bigger swings)
- Reputation badges (Founder / Quorum-keeper / Bounty-closer / Convener / Steward) — need a `member_badges` table + governance vote on each badge's criteria. Worth a separate spec.
- Curator economy on bounties (proposal-author share, reviewer share) — touches the bounty payout flow which is partly unbuilt.
- Cross-community reputation — opt-in, privacy-preserving design needed before any code.

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
