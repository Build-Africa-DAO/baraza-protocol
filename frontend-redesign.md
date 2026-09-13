# Baraza Frontend Redesign Plan

**Owner:** Eugene Mutembei (frontend)  
**Backend counterpart:** Simon Wandera  
**Date:** 7 September 2026  
**Branch:** `front-end`  
**Status:** Working plan. Visual and integration work happens in small PRs. Backend directories stay untouched unless Simon ships a contracted endpoint.

This document continues the 7 September product/UX review. It is the exhaustive redesign and integration plan: every current route, shared chrome piece, overlay, dashboard tab, and journey; what is wrong; what it should become; what frontend can ship alone; and what Simon must implement, with request/response intent.

It is not a claim that every archived PDF or vendored contract was re-audited. Older docs (including the 25 August Frontend Integration PRD) still mention Privy as the login system, screens that do not exist (`Disbursements.tsx`, `SaccoCompliancePortal.tsx`), and chains that are not the launch rail. Where documents conflict, **current code plus the 7 September custom-auth handoff win**.

---

## 1. What this product is

Baraza is group money with a shared record. Members of a chama, SACCO, or cooperative:

1. Join a specific group.
2. Pay dues in local currency.
3. Vote before spending.
4. Inspect contributions and releases.

Organizers set rules, admit members, and prepare releases. Officers approve. Compliance holds restrict payouts without pretending the whole group is dead.

Six facts must stay separate on every screen:

1. The person is signed into Baraza.
2. The person has a membership in this group.
3. That membership is activated and in standing.
4. The person may perform this action.
5. A payment was received and verified.
6. An approved release actually settled to the recipient.

Total funds, reserved funds, and available funds are different numbers. A passed vote is not a payout.

**Launch design reference:** a Kenyan savings chama, phone-first M-Pesa, Stellar as the settlement rail that members should not have to name. Other group types and rails enter only when the backend actually supports them.

---

## 2. Constraints (do not break the backend)

The `main` → `front-end` diff does not change `app/api`, root `api`, `contracts`, `programs`, `packages`, `supabase`, `scripts`, or `.github`. Keep it that way.

| Work | Who |
|---|---|
| Layout, type, color, copy, navigation, empty/loading/error states, accessibility | Eugene, frontend PRs |
| Mapping existing JSON into UI, polling, adapters, membership hooks | Eugene, after a written contract |
| New or changed API semantics, fees, auth, authorization, provider callbacks, signing | Simon |
| Migrations, ledgers, chain programs, infra | Simon / infra |

`app/src` is not automatically "safe." Hooks there already submit payments, votes, and local memberships. A layout change that also rewrites `useBarazaData` is out of bounds unless the contract is agreed.

Workflow from `_chat.txt`: branch `front-end` → merge/test on `dev` with backend → then `main`.

**Demo vs live.** Simulated M-Pesa, local order IDs, and fake RECONCILED sequences must be explicit preview mode, never the default success path. Do not ask Simon to loosen simulator gates so the UI looks finished.

---

## 3. Inventory of what exists today

### 3.1 Routes (`app/src/App.tsx`)

| Route | Page | Audience | Notes |
|---|---|---|---|
| `/` | `Index` | Visitors | Redirects signed-in users to `/home` |
| `/home` | `Home` | Signed-in | My groups + invite paste + launch |
| `/communities` | `Communities` | Public | Search, type filter, grid/list |
| `/bounties` | `Bounties` | Public | Global bounty board |
| `/bounties/:bountyId` | `BountyDetail` | Public | Brief, updates, group link |
| `/evaluate` | `Evaluate` | Public | Static checklist, not a live scorer |
| `/create/purpose` | `CommunityPurpose` | Signed-in | Multi-select that is mostly discarded |
| `/create` | `CreateCommunity` | Signed-in | Long setup + payment + success |
| `/dao/:id`, `/dao/:id/proposals`, `/dao/:id/vote` | `CommunityDashboard` | Public/member | Same page, tab from path/query |
| `/dashboard/:id` | `CommunityDashboard` | Public/member | Canonical group URL |
| `/dashboard/:id/decisions/create` | `CreateDecision` | Gated | New proposal |
| `/dashboard/:id/decisions/:decisionId` | `ProposalDetail` | Gated | Vote, comments, audit |
| `/dashboard/:id/treasury` | `TreasuryDetail` | Gated | Hardcoded rows today |
| `/join/:id` | `JoinDao` | Public | Dues payment |
| `/join/:id/status` | `JoinStatus` | Public | Activation tracker; can mock-advance |
| `/profile` | `Profile` | Public/gated | Account, memberships, security |
| `/onboard` | `LeverageOnboarding` | Internal | Sandbox that writes real records |
| `/onboarding` | redirect | — | → `/onboard` |
| `/claim` | `ClaimIdentity` | Wallet | Phone ↔ wallet claim |
| `/admin` | `AdminReconciliation` | Operator | Review queues |
| `/admin/akili` | `AkiliCouncilFilings` | Operator | Council notes |
| `/admin/retro` | `RetroRounds` | Operator | BRZA rounds |
| `/retro/:communityId` | `RetroCommunity` | Members | Open/view round |
| `/retro/:communityId/vote` | `RetroVote` | Members | Allocate weights |
| `/retro/:communityId/results` | `RetroResults` | Members | Settled allocations |
| `/proposals`, `/vote` | redirect | — | → `/communities` |
| `*` | `NotFound` | Anyone | Shared status screen |

### 3.2 Marketing homepage sections (`Index`)

Rendered in this order:

1. `HeroSection` — headline, two CTAs, `PolaroidGallery`, three illustrated step cards, `LogoMarquee`
2. `FeaturesSection` — collect / vote / trail, same two CTAs again
3. `AIPlatformSection` — stats (27 types, 4 markets, 0 seed phrases) plus more CTAs
4. `FlowWalkthrough` — four-step timeline, same story again
5. `FaqSection` — six questions; heading implies conversation
6. `CTASection` — close card, same two CTAs

**Built but not on the live homepage:** `ShowReelSection`, `CommunityMarquee`. Do not add them until the member product is truthful.

### 3.3 Group dashboard tabs (`GroupSidebarNav`)

Thirteen sections, query `?tab=`:

| Tab | Current job | Keep in primary nav? |
|---|---|---|
| Overview | Banner, stats, mixed gallery/bounties/security | Yes, rebuild |
| Roles | Officer/role list | Officer only |
| Suggestions | Suggestion box | Secondary |
| Leaderboards | Rankings | Secondary / later |
| Roadmap | Roadmap | Secondary |
| Board | Combined board | Secondary |
| Governance | Proposals | Yes, as Decisions |
| Bounties | Community bounties | Secondary |
| Members | Directory | Yes |
| Gallery | Photos | Secondary |
| Activity | Feed | Yes |
| Account (`wallet`) | Credential / chain copy | Merge into Profile |
| Settings | Group settings | Officer only |

### 3.4 Shared chrome and overlays

| Surface | File | Role |
|---|---|---|
| Public header | `Header.tsx` | Logo, Groups, How It Works, Features, FAQ, theme, Sign In / Sign Up |
| Public footer | `Footer.tsx` | Product / For Groups / Company |
| Public mobile nav | `MobileBottomNav.tsx` | Home, Groups, Launch, Profile, Log In |
| Signed-in shell | `AppShell.tsx` | Sidebar: My Groups, Browse, Launch, group list, Account |
| Signed-in mobile nav | `AppShell` bottom bar | Home, Browse, Launch, Account |
| Auth modal | `AuthModal.tsx` | Phone / email / Google via Privy |
| Wallet gate | `WalletGate.tsx` | Full-page sign-in for gated routes |
| Akili chat | `AkiliChat.tsx` | Floating assistant |
| Toasts | `toaster.tsx` | Transient messages |
| Offline banner | `OfflineBanner.tsx` | Connection lost |
| Error boundary | `AppErrorBoundary.tsx` | 500 status screen |
| Status screens | `StatusPage.tsx` | 401 / 403 / 404 / 500 / offline |
| Page loader | `PageLoader.tsx` | Route suspense |
| Dev pill | `BackendStatus.tsx` | Local mock vs Supabase |
| Chain selector | `ChainSelector.tsx` | Funding rail; too prominent for members |
| Theme | `ThemeContext` | Light / dark |

### 3.5 Emails and notifications (already designed, not dispatching)

Thirteen HTML + text templates in `app/emails/`. Catalog in `app/emails/catalog.json`. Backend handoff: `baraza-protocol-docs/03-delivery-specs/Custom-Auth-and-Email-Notifications-Backend-Handoff.md`. Frontend does not redesign these; Simon wires send.

---

## 4. Honest diagnosis (keep this, do not soften it)

The new visual foundation is better than `main`. Orange, black, white, Geist, group language instead of DAO cosplay. Keep that.

The application still feels like several products stitched together: a marketing site, a DAO dashboard, a wallet console, a bounty board, and a BRZA game. Members who need to pay dues and vote should not wade through thirteen tabs.

**What is not nice**

- Homepage retells collect → vote → release four times. It is long without teaching more.
- Polaroids, orange illustrations, and dashboard banners are three image systems. The photos look generic. They show gathering, not the product.
- Copy is accusatory and absolute ("no quiet withdrawals", "keep the group honest"). Explain controls. "No seed phrases" introduces crypto jargon to people who never heard of a seed phrase.
- FAQ heading says the team always listens; it is an FAQ. Support is `hello@barazaprotocol.com`, not a vibe.
- Featured-group panel contrast is poor. Tiny labels. Bounty CTAs clip. Orange is brand, action, and status at once.
- Gallery JPEGs are ~7.8MB with no responsive sources or lazy load.
- Auth modal is a marketing poster. At 360×640 it is ~868px tall, body scroll-locked, no inner scroll. Unusable.
- Public group dashboard at 390px: content width measured **zero**. Long blank page. Flex sibling fight in `CommunityDashboard.tsx`.
- Dashboard is a feature catalog. Leaderboards, roadmap, suggestions, board, gallery, and "Akili cleared" bury dues and votes.
- "Akili cleared" is a rubric (description length, dues range, quorum range). It is not a security audit. A bounty with a numeric KES reward is labeled funded without proving money exists.
- Purpose screen lets you pick several focuses, then uses only the first matching preset. "Social gathering" maps to "professional". People answered a questionnaire that was thrown away.
- Join can call `/api/mpesa/simulate`, mint local order IDs, and `JoinStatus` can tick a timer to "Active member" without a confirmed server outcome.
- Create Community can continue after payment simulation or chain failure and still say the group is live and payment was received. Paybill/USSD numbers are generated locally.
- FAQ says there is no hardcoded KES 6,500 launch fee; creation still calculates one.
- "Bank or international transfer" asks for a 64-character Stellar hash and shows XLM. That is not a bank transfer.
- Creation offers WhatsApp, mobile money, Privy wallet, and SWIFT as if all four settle.
- Membership identity is split: Privy account, Solana wallet, Stellar/Freighter, local memberships, and `/api/user/memberships` unused by `useMyMemberships`.
- Voting accepts abstain while Stellar is binary; chain errors fall through to a local data-store vote that still looks successful.
- Treasury page uses fixed rows and a 1,248,500 fallback. Export is disabled. A statement API already exists unused.
- `/onboard` writes real community records from a sandbox. It must not be a public acquisition path.

These payment/membership fallbacks largely predate the visual redesign. They are still the product members will feel.

---

## 5. Design principles for the rebuild

1. **Truth over theater.** Pending stays pending. Failed stays failed. Preview data is labeled Preview. Never fill a layout with invented balances or fake receipts.
2. **One job per screen.** Overview answers: who I am here, what I owe, what I must vote on, where the money is, what moved.
3. **Phone first.** Every primary journey at 360×640 with reachable controls. Desktop is a wider version of the same hierarchy, not a different product.
4. **Status is a first-class type.** Pending, confirmed, delayed, rejected, restricted, offline/stale. Color plus word plus icon. Orange is brand/CTA only.
5. **Roles see different workspaces.** Founder setup, pending member progress, active member dues/votes, officer approvals. Same URL, different composition.
6. **Do not ask questions whose answers are discarded.**
7. **Do not show rails the environment cannot complete.**
8. **Keep existing deep links.** Reorganize navigation; do not delete `/dashboard/:id?tab=roadmap` until a redirect exists.
9. **Title case on titles and buttons** (Chicago-style helper already in `toTitleCase`). Body copy stays sentence case.
10. **One image language in the app** (product UI, receipts, avatars). Marketing may keep richer illustration, but not four competing treatments.

### Visual system (keep, then discipline)

- Type: Geist. Display for titles, tabular numbers for money.
- Color: white / near-black + site orange (`hsl(25 95% 53%)`).
- Add semantic tokens: pending (amber), confirmed (existing `--confirmed`), destructive (existing), restricted (neutral + lock), stale (muted).
- Radius: already tight (`0.25rem`) with pill buttons. Keep pills for primary actions; do not pill every chip.
- Motion: existing wipe buttons and `rise` entrance. Respect `prefers-reduced-motion`.
- Do not introduce a new font, a second accent, or a purple "AI" gradient.

---

## 6. Target information architecture

### Global (signed out)

- Baraza (home)
- Groups
- How it works (one section, not four)
- FAQ / help
- Sign in / Sign up

### Global (signed in)

- My groups (`/home`)
- Browse groups
- Account
- Launch a group (secondary, not competing with "pay dues")

Remove the giant Launch orb as the visual center of signed-in mobile nav. Members already in a group need Overview and Account more than Create.

### Inside a group

**Member primary:** Overview · Contributions · Decisions · Members · Activity  
**Officer extra:** Funds · Approvals · Settings  
**Tucked (keep routes, drop from primary nav):** Bounties, Gallery, Roadmap, Suggestions, Board, Leaderboards, Retro, Roles

Akili stays as a helper that explains a fee, rule, or proposal in the group's language. It does not stamp "cleared."

---

## 7. User journeys (design these end to end)

For every journey: happy path, empty, loading, pending, delayed, rejected, offline/stale, forbidden, and "backend field missing" (show "Not provided yet", never invent).

### J1. Visitor understands Baraza

Land on `/` → one story → browse a real group or start launch. Outcome: they can explain dues, vote, release in one sentence.

### J2. Member joins with an invite

Open `/join/:id` → see group, rules, quote → sign in if needed → pay **only** a live method → `/join/:id/status` polls **server** status → pending until verified → active → `/dashboard/:id` overview in pending or active composition.

### J3. Founder launches a group

Purpose (one primary type) → setup fields the API actually stores → pay launch fee **if and only if** backend quotes one → wait for confirmation → empty-group overview with setup checklist (invite members, first dues rule, first decision). No "live + payment received" unless both are true.

### J4. Member pays dues

Overview shows next contribution. Pay. Receipt with reference, amount, currency, status, date. Streak only from server.

### J5. Member votes

Decisions list → proposal → rules in plain language (quorum, threshold, deadline, tie behavior) → Support or Object (no fake abstain unless chain supports it) → pending until confirmed → receipt.

### J6. Officer releases funds

Funds: available vs reserved vs total. Approved proposal → approval queue → release status (queued / submitted / confirmed / failed). Statement export when API allows.

### J7. Exception

Payment disputed, compliance hold, failed mint. Member sees restriction and next step. Officer sees the case. Support path: `hello@barazaprotocol.com`.

### J8. Lost phone / new device

Sign in → recover access without a seed phrase. Copy must explain this without "seed phrase" as the first noun.

Do not design J8 as if it works until Simon confirms the recovery contract.

---

## 8. Page-by-page redesign

Each subsection: current job, problems, target, states, backend.

### 8.1 `/` Marketing home — `Index` + sections

**Problems.** Repetition, generic photos, heavy images, absolute copy, FAQ is not contact, CTAs duplicated.

**Target sections (shorten; one pass down the page):**

1. **Hero.** One headline, one supporting sentence, two actions: Launch a Group, Browse Groups. One product visual: a real-looking contribution list + a vote + a receipt (clearly labeled example). Kill or defer PolaroidGallery until images are ours and compressed.
2. **How a group runs.** Three steps only. Remove FeaturesSection *or* FlowWalkthrough, not both. Prefer one illustrated sequence.
3. **Who it is for.** Chama, SACCO, cooperative. One line each. Link into `/create/purpose` with the matching type, not a discarded multi-select.
4. **Proof.** One anonymized or example statement screenshot. No fake 99% claims.
5. **FAQ.** Practical: fees, mistakes, lost phone, who can spend, how to start, privacy. Heading is FAQ. Link `hello@barazaprotocol.com`.
6. **Close.** One CTA pair.

**Cut from first paint:** AIPlatformSection stats that cannot be proven live, LogoMarquee if logos are decorative only, ShowReel until there is a real film, second and third identical CTA bands.

**Backend.** None required to ship the shorter page. Do not invent live TVL.

### 8.2 `/home` My groups — `Home`

**Problems.** Memberships loaded via wallet helper, not `/api/user/memberships`. Cards are thin. Invite form is fine.

**Target.** Signed-in home is the product hub.

- List of my groups: name, type, my status (pending / active / restricted), next due if contract exists, open votes count.
- Empty: invite field + launch. No fake groups.
- Each card: one primary action (Open group). Status chip is real.
- Invite paste stays.

**Backend.** `GET /api/user/memberships` as canonical. Fields needed: `communityId`, `name`, `type`, `membershipStatus`, `role`, `joinedAt`. Optional later: `nextContribution`, `openProposalCount`. If a field is missing, hide the slot.

### 8.3 `/communities` Browse — `Communities`

**Problems.** Banner contrast. "Payment rails are configured inside join…" is engineer-speak. Type filters may not match what join can actually do.

**Target.** Search, type chips that match backend types, grid/list. Card: name, type, member count if real, dues if real, Join / View. Empty and error states already conceptually exist; make them the Status/empty pattern. Do not show chain names to members.

**Backend.** Existing community list/read. Do not display a fee the list payload does not include.

### 8.4 `/evaluate` — `Evaluate`

**Problems.** Speaks of DAOs, Akili security review, score rows that the page does not compute.

**Target.** Keep as a public explainer: membership clarity, treasury rules, voting rules, records. Remove AI-security theater. Optional: "Open this group" if they came with an id. Not a live auditor until Simon exposes real compliance flags.

**Backend.** None for v1 of the rewrite. Later: `GET /api/compliance/status?communityId=` for SACCOs only, shown as regulatory status, not "Akili cleared."

### 8.5 Auth modal + WalletGate + Profile sign-in

**Problems.** Oversized modal; Privy still underneath; custom-auth APIs not live.

**Target (visual, now).** Compact sheet on mobile: title, method tabs (Phone, Email, Google), input, submit, legal line. Image optional on desktop only. Inner scroll. Focus trap. Sign in vs Sign up remain distinct (no silent account create on sign in).

**Target (integration, after Simon).** Swap Privy SDK calls for Baraza OTP + Google + session cookie/header as specified in the 7 September handoff. Keep officer wallet proof for actions that require it.

**Backend.** Implement that handoff. Frontend must not fake OTP success.

### 8.6 `/create/purpose` — `CommunityPurpose`

**Problems.** Multi-select discarded; wrong mapping.

**Target.** One primary type: Savings chama, Welfare, Investment, SACCO, Cooperative. Short help under each. Continue to `/create?type=`. Optional secondary tags only if `createCommunityRecord` stores them.

**Backend.** Confirm allowed `type` enum. If secondary purposes are stored, say so; otherwise do not collect them.

### 8.7 `/create` — `CreateCommunity`

**Problems.** Hardcoded launch fee; four payment methods that do not all settle; local paybill/USSD; success copy after failure.

**Target.** One form: name, description, type (from previous step), contribution amount, voting defaults with plain-language preview, country/currency. Then a **quoted** launch charge from the server, or "No launch fee in this environment." Pay with the methods the quote lists. Success screen lists what is actually true: record created? payment confirmed? paybill provisioned?

**Backend needed.**

- `POST` community create (existing) — keep fields Simon already accepts.
- **Launch quote:** amount, currency, fee breakdown, allowed methods, expiresAt. If this does not exist, do not calculate 6,500 in the client.
- **Paybill/USSD provision** as a real provider result, or omit from UI.
- Status of launch payment, same family as membership orders.

### 8.8 `/join/:id` — `JoinDao`

**Problems.** Client-side fee engine; simulate; local wallet orders; Stellar hash labeled as bank transfer; activation tracker UI is good, data is not.

**Target.** Group summary, rules, **server quote**, phone for M-Pesa if that method is listed, Baraza account pay if listed. Remove bank/SWIFT/WhatsApp until they have endpoints. Free join only if quote says zero.

**Backend needed.**

- Read community (existing).
- **Membership quote:** `POST /api/…/quotes` or documented equivalent: `amountExpected`, `currency`, `carrierPassThrough`, `methods[]`.
- **Initiate M-Pesa:** the endpoint that actually sends STK, not `create-payment-intent` unless Simon confirms it does.
- **Initiate account payment** if that is real.
- **Verify Stellar tx** (existing `/api/stellar/verify-payment`) — label it as on-chain transfer, never "bank."
- Stop calling `/api/mpesa/simulate` in production builds.

### 8.9 `/join/:id/status` — `JoinStatus`

**Problems.** `MOCK_SEQUENCE` to RECONCILED; local membership write.

**Target.** Keep the stepper. Drive it only from `GET /api/payment-orders/status` (or the documented order status). States: requested → confirmed → mint queued → mint submitted → indexer confirmed → reconciled / failed. Failed: reason + hello@. No local activate.

**Backend.** Existing payment-order status + membership activate. Document the enum the UI may show. Do not add client-side timers that invent the next state.

### 8.10 Group overview — `CommunityDashboard` tab `overview`

**This is the first design deliverable.**

**Problems.** Mobile zero-width. Overview dumps stats, gallery, bounties, security review.

**Target hierarchy (mobile):**

1. Identity: name, type, my role, membership status.
2. Next contribution: amount, due date if known, status, Pay.
3. Decisions needing me: title, amount, deadline, progress.
4. Funds: available and reserved, as-of time.
5. Recent movements: last few contributions/releases with receipt links.

Founder empty: checklist. Pending member: verification progress. Officer: approvals count.

**Fix first (no API):** the flex layout so main has width at 390px. Contained PR.

**Backend.** Group read; membership for me; open proposals; statement or balances; recent ledger lines. If due date is not in the API, do not show a due date.

### 8.11 Other dashboard tabs

| Tab | Redesign |
|---|---|
| Governance | Rename Decisions. List active / passed / failed / executed. Honest tallies. Link to create if allowed. |
| Members | Directory, status, invite link for officers. |
| Activity | Real events only. |
| Settings | Officers: name, description, dues, voting defaults, dangerous actions. Members: read-only rules. |
| Roles | Officer page, not primary nav. |
| Suggestions, Roadmap, Board, Leaderboard, Gallery, Bounties | Keep components, move under "More" or later IA. Do not delete backend. |
| Account tab | Remove; use `/profile`. |

**Mobile dashboard chrome.** Overlay drawer or bottom sheet for group nav, not a flex sibling that collapses content.

### 8.12 `/dashboard/:id/decisions/create` — `CreateDecision`

**Target.** Title, description, amount (cannot exceed **available** funds if known), duration. Show quorum/threshold in words. Submit → pending until the create API confirms. Token-gate messaging only if the group actually has a gate.

**Backend.** Existing governance create. Return proposal id and status. Do not treat local insert as chain-final.

### 8.13 `/dashboard/:id/decisions/:decisionId` — `ProposalDetail`

**Problems.** Abstain; quorum math includes abstain; success after chain error.

**Target.** Binary Support / Object unless Simon confirms a third option on-chain. Show snapshot size, quorum, threshold, time left, tie rule. Votes pending vs confirmed. Comments if the API stores them. Audit trail from server. After vote: "Recorded on Baraza" vs "Confirmed on the group record" as two steps if they differ.

**Backend.** `POST /api/governance/vote` with the real ballot shape. `GET` proposal with official tallies. Finalize/execute remain officer actions with pending states.

### 8.14 `/dashboard/:id/treasury` — `TreasuryDetail`

**Problems.** Hardcoded attestations, releases, 1,248,500 fallback, dead export.

**Target.** Three balances. Movement list from `GET /api/communities/statement`. Each row: date, type, amount, currency, status, reference, link to detail/dispute. Empty: "No movements yet." Error: status screen, not a healthy sample. Export when the API provides a file.

**Backend.** Statement endpoint exists — consume it. Confirm available vs reserved vs total. Dispute: `POST /api/payment-orders/dispute` with the enums the handler actually accepts (docs currently drift).

### 8.15 `/profile` — `Profile`

**Problems.** Mixed wallet/account; local memberships; "Akili" on profile; country control is good.

**Target.** Display name, country/currency, memberships (same source as Home), security (sign out, devices when API exists), notifications preferences when API exists. Badges/streaks only from server. Remove security-review theater.

**Backend.** `GET /api/user/profile`, `GET /api/user/memberships`, patch country. Streak endpoints exist (`payment-orders/streak`) — use or hide.

### 8.16 `/bounties` and `/bounties/:bountyId`

**Target.** Keep as a secondary work surface. Honest status. Reward labeled as promised amount, not "funded," unless treasury says so. Create bounty only for members of that group.

**Backend.** Existing bounty helpers/API. Do not imply escrow that is not there.

### 8.17 `/claim` — `ClaimIdentity`

**Target.** Keep for wallet↔phone linking. Compact. Use status screens for 401. Copy: you are linking a phone to this account.

**Backend.** Existing `initiate-claim` / `verify-claim`. Coordinate with new Baraza auth so we do not run two identity systems forever.

### 8.18 `/onboard` — `LeverageOnboarding`

**Target.** Gate behind admin or `import.meta.env.DEV`. Label "Internal sandbox." It writes real records; it is not marketing onboarding.

### 8.19 Retro: `/admin/retro`, `/retro/:id`, vote, results

**Target.** Secondary BRZA experiment. Do not put it in member primary nav. If shown: explain it is retroactive distribution, not dues. Wallet proof stays until auth migration says otherwise.

**Backend.** Existing retro-rounds / ballot / allocations / settle. No new UI scope in phase 1–4.

### 8.20 Admin: `/admin`, `/admin/akili`

**Target.** Operator console. Keep gated. Relabel review queues in human language. Do not call heuristic scores "security cleared." Filings stay internal.

**Backend.** Existing admin lists. Test identity headers in `auth-session.ts` are Simon's to lock down; frontend must not depend on them.

### 8.21 Status, offline, 500

**Target.** Keep the shared `StatusPage` family (404, missing resource, 401, 403, 500, offline). Use them instead of one-off centered headings. Title case already applied.

### 8.22 Akili chat (`AkiliChat`)

**Target.** Helper: "What is quorum?", "Why is my payment pending?", "What does reserved mean?" Route by page. Never "cleared." Council filings stay admin.

**Backend.** `POST /api/agent/chat` existing. Do not expand council UX in the member app.

### 8.23 Emails

Out of visual scope. Simon implements send per handoff. Frontend may later add "Resend code" using those APIs.

---

## 9. Shared component work

| Component | Action |
|---|---|
| `Header` / `Footer` | Shorter nav; How it works one anchor; FAQ; hello@ |
| `MobileBottomNav` / `AppShell` | Signed-in: My Groups, current Group, Account. Launch demoted |
| `AuthModal` | Compact, scrollable, focus trap |
| `WalletGate` | Same copy system as Status 401 |
| `CommunityCard` | Contrast, dues only if real, no clipped CTAs |
| `DecisionCard` | Binary vote, pending/confirmed, no silent local success |
| `CommunityBanner` | Contrast; do not put body text on busy photos |
| `LiveStatCard` | Tabular numbers; no placeholder millions |
| `InviteLink` | Officer overview and members tab |
| `ChainSelector` | Hide from members; keep for officers/dev |
| `PolaroidGallery` | Compress, lazy, or remove from hero |
| `BackendStatus` | Dev only (already) |
| `AkiliSecurityReview` | Rename to setup checks or remove from overview |

---

## 10. Required states (every primary screen)

Design before polish:

- Loading (skeleton matching layout)
- Empty (next action)
- Pending (payment, vote, mint)
- Delayed (provider slow)
- Rejected / failed (reason + support)
- Restricted (compliance/payout hold)
- Offline / stale (banner + last updated)
- Forbidden / signed out
- Not found (existing status screens)
- **Unimplemented field:** omit or "Not available yet" — never sample data in production

---

## 11. Copy rules

- Speak to chamas and SACCOs, not DAOs, unless the user chose that type.
- Name the control: "Spending needs a vote that meets quorum," not "we keep groups honest."
- Prefer "Baraza account" for members. "Wallet" only when an officer must sign.
- Money always has currency and status.
- Title case: titles and buttons. Sentence case: descriptions, FAQ answers, helper text.
- Support: `hello@barazaprotocol.com`. OTP from: `no-reply@barazaprotocol.com`.

---

## 12. Backend contract catalog

Frontend consumes; Simon owns semantics. Mark each: **exists**, **exists but unused/wrongly used**, **needed**, **do not build yet**.

### 12.1 Auth and session (needed — 7 Sept handoff)

See `Custom-Auth-and-Email-Notifications-Backend-Handoff.md`. Summary frontend will call:

- Request OTP (email or phone), sign-in vs sign-up flag
- Verify OTP → Baraza session
- Google OAuth start/callback → same session
- Logout
- Session attach on API (in addition to current Privy JWT / wallet proof)

Until this ships, keep Privy. Do not parallel-invent a third client-only auth.

**Simon also:** remove or env-guard test identity headers in `app/api/_lib/auth-session.ts` before production.

### 12.2 Account and memberships

| Endpoint | Status | UI use |
|---|---|---|
| `GET /api/user/profile` | Exists | Profile |
| `GET /api/user/memberships` | Exists, **unused by `useMyMemberships`** | Home, Profile, overview role |
| Membership activate | Exists | Join status only after payment confirmed |
| Officers | `GET/POST /api/communities/officers` | Roles / approvals |

**Needed from Simon:** canonical id for "this human" vs "this signing key." Document which actions need wallet proof after custom auth.

### 12.3 Communities

| Endpoint | Status | UI use |
|---|---|---|
| List/get communities | Exists | Browse, join, dashboard |
| Create community | Exists | Launch |
| Invites accept | Exists | Invite links |

**Needed:** launch quote (amount, currency, methods) if launch is charged. Provisioned paybill/USSD as provider results or not at all.

### 12.4 Payments

| Endpoint | Status | UI use |
|---|---|---|
| `POST /api/mpesa/simulate` | Exists | **Production UI must not call** |
| `POST /api/stellar/create-payment-intent` | Exists | Only if it is the real initiate path |
| `POST /api/stellar/verify-payment` | Exists | On-chain transfer proof |
| `GET /api/payment-orders/status` | Exists | Join status, receipts |
| `POST /api/payment-orders/dispute` | Exists | Funds / receipts |
| `GET /api/communities/statement` | Exists, **unused by Treasury UI** | Funds page |
| Kotani / Paystack / Minisend / Daraja callbacks | Exists on server | Invisible to UI except status |

**Needed:**

1. Written mapping: which client call starts an M-Pesa STK for membership vs launch vs dues.
2. Quote object the client must render (no client fee engine as source of truth).
3. Order status enum, frozen.
4. Distinguishing available / reserved / total on statement or a balances endpoint.

### 12.5 Governance

| Endpoint | Status | UI use |
|---|---|---|
| Proposals | Exists | Decisions |
| Vote | Exists | Proposal detail |
| Finalize / execute | Exists | Officer |

**Needed from Simon:** confirm ballot is binary; how abstain should behave if at all; snapshot/quorum/tie/48h rules the UI must display; what "success" means if chain submit fails.

### 12.6 Compliance and identity

| Endpoint | Status | UI use |
|---|---|---|
| Compliance status / SACCO license | Exists | SACCO settings / evaluate later |
| Treasury unfreeze | Exists | Admin |
| Identity initiate/verify claim | Exists | `/claim` |

Show compliance as a hold banner, not a vanity score.

### 12.7 Explicitly later (do not block member journey)

Bounties polish, retro BRZA, Akili council, Minisend off-ramp portal, public StatusDashboard, Disbursements page from the old PRD. Keep APIs; do not build those screens in phases 1–5.

---

## 13. Implementation sequence

Small PRs. No backend folder edits. No "while we're here" refactors.

### Phase 0 — Contract freeze (Eugene + Simon, before more UI)

Written answers:

1. Canonical membership list: `GET /api/user/memberships` yes/no, payload.
2. How M-Pesa membership payment is initiated in launch environment.
3. Order status enum.
4. Vote shape (binary?).
5. Statement payload and balance fields.
6. Custom auth ETA; Privy remains until then.
7. Launch fee: quoted or zero.

### Phase 1 — Containment (frontend only)

1. Fix mobile dashboard width (`CommunityDashboard` flex).
2. Auth modal fits 360×640, scrolls, focus.
3. Featured/browse contrast; bounty button overflow.
4. Stop displaying hardcoded 1,248,500 and unlabeled sample treasury rows (empty/error instead).
5. Hide `/onboard` from public nav if linked anywhere.

### Phase 2 — Identity read path

1. Point `useMyMemberships` / Home / Profile / dashboard `isMember` at agreed membership API.
2. Honest loading/empty/error.
3. Do not remove wallet proof from officer actions.

### Phase 3 — Overview redesign (the design center)

1. New overview hierarchy (section 8.10).
2. Nav: Overview, Contributions (can start as join/dues + statement snippet), Decisions, Members, Activity.
3. More menu for the rest, redirects preserved.

### Phase 4 — Truthful join

1. Render server quote only.
2. Live methods only.
3. Status page polls server only; delete production mock sequence.
4. Relabel Stellar path as on-chain transfer.

### Phase 5 — Decisions then funds

1. Vote pending/confirmed; no local success on chain failure.
2. Statement-backed funds; dispute entry.

### Phase 6 — Launch form

1. Purpose = one type.
2. Quote-driven fee.
3. Honest success.

### Phase 7 — Marketing homepage

Shorten once 3–5 exist so the hero can screenshot the real app.

### Phase 8 — Auth swap

When Simon's OTP/Google/session land, replace Privy in the modal only. Keep session tests.

### Phase 9 — Secondary

Bounties, gallery, retro, admin language, Akili helper copy, image compression, bundle measurement.

---

## 14. What frontend will not do

- Change `app/api`, contracts, programs, supabase, CI.
- Call simulate endpoints in production UI.
- Invent due dates, balances, or "funded" claims.
- Ship abstain if the chain is binary.
- Treat Privy removal as a redesign task; it is an adapter swap.
- Add ShowReel / more marquee / more CTAs to buy time.
- Broad-rewrite `useBarazaData` inside a CSS PR.

---

## 15. Validation

Each phase:

- Typecheck and the tests that cover the touched flow.
- Browser: 360×640, 390×844, 1440×900. Dark and light.
- Journey test: the happy path plus pending and failed.
- No claim of live M-Pesa or production auth until those environments are used on purpose.

Codex review already: typecheck pass, production build pass (large chunks), 72 targeted tests, local screenshots of the mobile dashboard collapse and oversized auth modal.

---

## 16. First week, concretely

1. Sit with Simon on Phase 0 (one page of endpoint answers).
2. PR: mobile dashboard containment + auth modal containment + treasury sample-data removal.
3. PR: memberships from `GET /api/user/memberships` into Home.
4. Design comps (even low-fi) of the mobile overview in four roles: founder empty, pending member, active member, officer.

That is the start. Homepage decoration waits. Backend stays intact. Simon can implement anything in §12 as long as the contract is written before the UI depends on it.
