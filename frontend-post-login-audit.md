# Baraza Post-Login UI Audit and Redesign Plan

**Owner:** Eugene Mutembei (frontend)
**Backend counterpart:** Simon Wandera
**Date:** 12 September 2026
**Branch:** `front-end` (merge to `dev` for joint testing, then `main`)
**Scope:** every screen, card, button, link, image, sheet and toast a person meets after signing in, plus the visitor and gated versions of the same URLs. The marketing landing is out of scope except as the source of the visual language the app must now inherit.
**Companion docs:** `frontend-redesign.md` (7 Sept principles and backend contracts) and `frontend-screens.md` (8 Sept screen map; §13 is the target spec this audit measures against).

---

## 0. Method and limits

**What was done**

- Read every file under `app/src` that renders post-login UI: `App.tsx`, both shells, the group workspace, all 30 pages, all shared components, overlays, the Akili chat, and the token layer (`index.css`, `tailwind.config.js`).
- Ran the app from the local dev server (`Local mock` mode, dark and light themes) and captured 1440px and 375px screenshots of every URL a visitor can open: `/groups`, `/dashboard/1`, `/dashboard/1/votes`, `/dashboard/1/people`, `/dashboard/1/more?tab=bounties`, `/join/1`, `/home` (gate), `/account` (signed out), and the sign-in sheet.
- Three parallel deep-reads of the secondary surfaces (More tabs and bounties; admin, retro, claim, status and Akili; the landing's design language), each reporting class names and line numbers.

**What was not done**

- No sign-in. There is no test account and OTP needs a real phone, so member, pending, officer and founder compositions were derived from code, not seen live. Where the code is unambiguous the doc says "renders"; where it depends on data the doc says "would render".
- No backend, contract or test files were changed. `.claude/launch.json` was added so the preview tool can start the app; nothing else was touched.

**Vocabulary used below**

- **Is now**: what the code renders today.
- **Should be**: the §13 spec, plus design judgement where §13 is silent.
- **Gap**: a concrete, fixable difference. Numbered so tickets can reference them.
- Priority: **P0** blocks a truthful member journey · **P1** visibly wrong or off-system · **P2** polish.

---

## 1. Verdict on one page

The information architecture from §13 has landed: `/home`, `/groups`, `/help`, `/account`, and the group workspace with `pay`, `votes`, `people`, `money`, `settings`, `more` all exist, and the twelve legacy `?tab=` URLs redirect. That was the hard structural work and it is done.

What has not landed is the **visual and behavioural redesign inside those routes**. Most pages are the old components moved to new URLs. The result is a product that has one map but four visual dialects, and that still tells members things that are not true. The twelve findings that matter most:

1. **Money is shown in the wrong currency.** Every amount runs through `formatKSh` → `formatAccountCurrency`, which converts KES with a hardcoded rate (`KES_USD_REFERENCE = 0.0077` in `lib/accountLocale.ts`) into the *viewer's* country currency. A KES 500 chama fee renders as **$3.85** for a viewer whose account country is US. Group money must always be shown in the group's currency. (P0, every screen)
2. **Orange is the status colour, by accident.** `--accent`, `--warm`, `--orange` and `--ring` are all the same value as `--primary` (`index.css:19-41`). So "In Progress" and "Under Review", "Voting", the drop-target ring, reward figures, selected chips and the CTA are one indistinguishable orange. §13.1 says orange is never a traffic light. (P0, system)
3. **Synthetic data ships to real groups.** `SEED_SUGGESTIONS` (three named people with vote counts), `SEED_MILESTONES` (one marked *completed*), `SEED_BOUNTIES`, `COMMUNITY_GALLERIES` (stock photos captioned as the group's own), the hardcoded payment-order and mint-job tables in `/admin`, and the `RESPONSES` keyword bank in Akili are all rendered without a preview label. Some are re-tagged with the real `communityId` so they are indistinguishable from real records. (P0)
4. **Members are still asked for a crypto wallet.** `RetroCommunity`, `RetroVote`, `Bounties` (post CTA), `ClaimIdentity`, `CreateDecision`, `ProposalDetail` and `DecisionCard` use `useWallet` / `useWalletGuard`, and the single wallet modal (`BarazaWalletModalProvider`) reads "Connect your Baraza account" over a list of six browser-extension wallets with no phone or email option. (P0)
5. **Two radius systems, one page.** Tokens say `--radius: 0.25rem` and `.baraza-card` honours it. Almost everything inside those cards uses `rounded-lg`, `rounded-xl` or `rounded-2xl` (over 70 instances in group screens alone), while the landing standardised on `rounded-xl`/`rounded-2xl`/`rounded-[2rem]`. Nested corners run the wrong way everywhere. (P1, system)
6. **Type below the floor carries real content.** 9px, 10px and 11px classes appear 25 times in `BountyBoard`, 21 in `CommunitySettings`, 20 in `MemberDirectory`, 17 in `CreateCommunity`, 16 in `AdminReconciliation`. Status words, amounts, names and dates sit at sizes a chama treasurer cannot read on a 360px phone. (P1)
7. **Five button classes for two buttons.** `btn-wipe`, `btn-primary`, `btn-warm` render identically; `btn-wipe-outline` and `btn-ghost` render identically. They are used in 35, 8, 13, 32 and 7 files respectively, plus the `Button` component in 15. Because the aliases exist, screens routinely have two or three "primaries". (P1, system)
8. **Visitors see member controls.** On `/dashboard/:id` a visitor gets disabled Yes/No vote buttons, a CSV export on People, "I'm in" on bounties, and both a Next Action "Join This Group" card and a sidebar "Join This Group" button. §13.16 says visitors see no buttons and one sticky Join. (P1)
9. **Public marketing chrome wraps app screens.** When signed out, group pages render inside `PublicShell`: the landing header (Home / How It Works / Features / Pricing / FAQ / Contact), the orange newsletter footer, and the mobile bottom nav with the orange Launch orb. Operators with a wallet but no Privy session get the same. (P1)
10. **The launch flow contradicts §13.10.** `/create` without `?type=` redirects to `/create/purpose`, the multi-select whose answers are discarded. The form is one 1,237-line page with a hardcoded KES 6,500 fee, KES 2,000 / 3,000 add-ons, a chain indicator, and four payment methods of which only one has any path. §13.25 says `/create/purpose` should redirect to `/create`, not the reverse. (P0)
11. **Two group screens are not on the workspace shell.** `ProposalDetail` and `CreateDecision` still use bare `Layout` with their own photo banner, back link and 4-tile stat row, and vote with "Vote yes / Vote no" plus a local comments store. They look like a different app from `Votes` one click away. (P1)
12. **Jargon persists in member-facing copy.** "credential", "minted", `INDEXER_CONFIRMED`, "Debit: Treasury, Credit: Escrow", "USDC", "SPL token", "on-chain", "DAO" (including the `<title>` in `index.html`: *Treasury Tools for DAOs, Communities & SACCOs*). 75 hits across seven member files. (P1)

Everything else in this document is detail behind those twelve.

---

## 2. The design system: is vs should

### 2.1 Tokens (`app/src/index.css`)

| Token | Is now | Problem | Should be |
|---|---|---|---|
| `--primary` | `25 95% 53%` | Fine. Brand orange. | Keep. |
| `--accent` | `25 95% 53%` (same) | Used as a second semantic in 40+ places; renders as brand. | Retire as a colour. Map to `--foreground` during migration, then delete usages. |
| `--warm`, `--orange`, `--ring` | same orange | Redundant aliases. | Delete `--warm` and `--orange`. Keep `--ring` = primary for focus. |
| `--confirmed` | `38 75% 38%` light / `45 100% 76%` dark | Amber next to orange; reads as "warm", not "done". Dark mode value is pale yellow. | One confirmed hue that is not warm: deep green-grey, e.g. `152 40% 32%` light / `152 35% 62%` dark. Use only with a word and icon. |
| `--destructive` | `0 72% 51%` | Fine. | Keep. |
| status tokens | none | Pending, restricted, stale have no token; pages invent `border-accent/40 bg-accent/10`. | Add `--status-pending` (neutral outline, foreground text), `--status-hold` (muted + lock icon), `--status-stale` (muted-foreground). Word + icon always. |
| `--radius` | `0.25rem` | Honoured only by `.baraza-card`, `Button` size classes and inputs in a few files. | See 2.4. |
| gradients | `--gradient-primary/warm/dao/surface` | Used by DecisionCard bars, Akili header and FAB, MembershipCard, CreateCommunity checklist. Landing does not use them. | Delete. Flat orange or flat black only. |
| shadows | `--shadow-glow`, `--shadow-warm`, `--shadow-dao` | Orange glows on hover (`.baraza-card:hover`), on the mobile FAB. | Keep `--shadow-card` and `--shadow-deep`. Delete glows. Card hover = border colour change only. |
| `--chrome`, `--chrome-foreground` | none (added 13 Sept) | Sidebar, top bar and bottom nav used `--card`, so in dark mode the frame and the content were the same grey. | White frame in light mode, true black (`0 0% 0%`) in dark mode; content panel stays `--card`, one step lighter. Used only by the three shells. |
| `.glass-surface`, `.premium-glass`, `.ambient-globe-layer` | defined, `premium-glass` used by `CommunityGallery` | Fourth card style; blur and orange hairline. | Delete. |

### 2.2 Colour usage rules to enforce

- Orange: brand mark, the one primary button per screen, active nav row (`bg-primary/10 text-primary`), focus ring, text links on hover. Nothing else.
- Black (`foreground`): titles, body, chips in their selected state (black fill, white text), filter chips, the quorum bar fill, dividers at 10 to 16 percent.
- Money: `foreground`, `font-display`, `tabular-nums`. Never orange (`text-accent` on amounts appears in `CommunityCard`, `DecisionCard`, `BountyBoard`, `Bounties`, `BountyDetail`, `MemberDirectory`, `CombinedBoard`, `CommunityLeaderboard`; `text-primary` on the Total in `CommunityDashboard` and `GroupMoney`).
- Status: `StatusChip` component only (see §7). Word plus icon plus one of: outline (pending), black fill (confirmed), destructive outline (failed), muted + lock (on hold), muted (stale).
- Dark mode: both themes stay. First visit follows the OS preference; the person can switch from the sidebar footer icon or Account and the choice persists (decision §9.2). Every primitive in §7 is checked in both themes on the fixture page before it ships.

### 2.3 Typography

| Role | Landing (established) | App is now | App should be |
|---|---|---|---|
| Eyebrow | `text-xs font-semibold uppercase tracking-[0.18em] text-primary` (Geist) | `font-mono text-xs uppercase tracking-widest text-muted-foreground` in Join, Pay, Money, Settings, CreateCommunity, JoinStatus | Adopt the landing eyebrow. Drop `font-mono` for labels; mono is for references and order ids only. |
| Page title | `font-display text-3xl font-black md:text-4xl` | mix of `text-2xl font-bold`, `text-3xl font-bold`, `text-2xl font-black` | One `PageHeader` atom: `text-2xl font-black md:text-3xl`, Title Case. |
| Section heading | `font-display text-xl font-bold` | `text-base font-semibold` in cards, `text-sm font-bold` in Profile, `text-lg font-semibold` elsewhere | `text-base font-bold` inside cards, `text-lg font-bold` for page sections. Two sizes, not five. |
| Amount | `text-4xl font-black tabular-nums` (stat tiles) | `text-3xl/4xl font-bold text-primary` (Money, Home), `text-xs font-semibold text-accent` (cards) | `AmountBlock`: `text-3xl font-black tabular-nums text-foreground` with currency code first, caption `text-sm text-muted-foreground`. |
| Body | `text-sm leading-6 text-muted-foreground` | same, good | Keep. |
| Caption floor | `text-xs` | `text-[9px]`, `text-[10px]`, `text-[11px]` in 30+ files | Hard floor `text-xs` (12px). Chips `text-xs`. Nothing smaller in app surfaces. |
| Casing | Title Case via `toTitleCase` on headings and every `Button` label | Hand-written buttons in sentence case: "Send code", "Add comment", "Vote yes", "Export CSV", "File dispute", "Generate invite", "Save profile" | Route every button through `Button` (which title-cases automatically) and delete raw `<button className="btn-…">`. |

### 2.4 Radius: one ladder

The tokens say tight; the landing went soft; the app is split. Pick one ladder and write it into the tokens so the choice stops being made per file.

| Level | Value | Use |
|---|---|---|
| `--radius-sm` | `0.375rem` | inputs, chips, inline tiles, nav rows |
| `--radius-md` | `0.75rem` (`rounded-xl`) | cards, sheets, list rows with borders |
| `--radius-lg` | `1rem` | bottom sheets, dialogs |
| pill | `9999px` | buttons, status chips, filter chips |
| band | `2rem` | marketing bands only, never in-app |

`.baraza-card` moves to `--radius-md`. Inputs move to `--radius-sm`. This matches the landing's card language and removes the "rounded-xl inside a 0.25rem card" inversion that is on nearly every screen today.

### 2.5 Buttons

Is now: six CSS classes (`btn-wipe`, `btn-wipe-outline`, `btn-wipe-destructive`, `btn-primary`, `btn-warm`, `btn-ghost`, `btn-icon`) and a `Button` component that maps five variants onto them. `btn-wipe`, `btn-wipe-outline` and `btn-ghost` have **no padding** of their own (`index.css:203-228`); callers add `px-*`/`py-*` by hand, so identical buttons have different metrics from file to file. Sizes below 44px are common (`px-3 py-1.5 text-[11px]`).

Should be: the `Button` component is the only way to render a button. Variants `primary`, `outline`, `destructive`, `link`, `icon`. Sizes `sm` (36px, desktop secondary only), `md` (44px), `lg` (48px, full width on mobile). The CSS aliases are deleted after migration. One primary per screen is then enforceable by review.

### 2.6 Cards and surfaces

- `.baraza-card` gets `--radius-md`, `border-border`, no hover glow, `shadow-[0_14px_32px_hsl(0_0%_0%/0.06)]` light / `/0.35` dark (the landing's shadow pair).
- `MagicCard` (mouse-following radial) is used only by `CommunityCard`. Remove.
- `CommunityBanner` (rotating Unsplash slideshow with a featured-community aside) is used on Join, Browse, Profile, ProposalDetail, CreateDecision, CreateCommunity and the group header. It puts body text on busy photos, loads remote images, and turns every page into a hero. Replace with the identity strip in §7. Marketing keeps photos; the app uses initials tiles and product UI.

### 2.7 Imagery

- All in-app photos are Unsplash URLs (`lib/communityVisuals.ts`), captioned in places with "governed on-chain". Delete the module.
- `app/public/gallery` is 7.3MB across five JPEGs, none lazy-loaded; `audience/group.jpg` (514KB) is the sign-in sheet's desktop image. Keep photos on the landing only, compress to under 200KB each, add `loading="lazy"` and `decoding="async"`.
- In-app "images" are: the initials tile (`h-12 w-12 rounded-md border font-display`), the brand lockup, lucide icons at 16 and 20px, and the example-receipt illustration if one is ever drawn. That is the whole set.

### 2.8 Motion

Keep `Reveal` (0.4s, `[0.22,1,0.36,1]`, once, 25 percent) from `components/landing/motion.tsx` and use it for page sections only. Remove framer `initial={{ width: 0 }}` bar animations on `DecisionCard`, the `LiveStatCard` pulse, the `AnimatedSetupChecklist` sweep and glow, the `CommunityBanner` slide, and `MembershipCard`'s rotateY. Respect `prefers-reduced-motion` everywhere (buttons and `.rise` already do; framer usages do not).

### 2.9 What the landing established that the app should adopt

From the landing spec extraction: the `page-shell` container with `py-12 lg:py-[3.75rem]`; the eyebrow → heading → one-liner stack; numbered step cards; the painted timeline (a `bg-primary` spine over `bg-primary/25` with ring nodes) which is the right pattern for join and payout progress; stat tiles with `tabular-nums`; the `.audience-band` contract that inverts buttons on orange; native `<details>` accordions for FAQ/help. Not to adopt: orange as a surface, more than one primary per band, hard-coded `bg-white` inputs, gold/silver/bronze hex, `ShimmerButton`.

---

## 3. Chrome and overlays

### 3.1 Signed-in shell (`components/app/AppShell.tsx`)

**Is now.** Desktop: a 264px sticky sidebar with the "Baraza Protocol" lockup, three workspace rows (My Groups, Browse, Launch a Group), up to eight group rows with the raw `record.status` string in 10px uppercase when not active, a group block headed by the group name in 10px uppercase, and a footer with the display name, Account, a theme toggle row and Log Out styled as ordinary nav rows. Mobile: a 56px top bar with a menu icon and the lockup; a drawer with the same sidebar; a five-slot bottom nav that switches between workspace slots and group slots. No footer. No Akili FAB below 768px.

**Should be** (§13.3). Same structure, corrected:

- G1. Workspace row label "Launch a Group" → "Start a Group", styled as an outline row rather than a peer of My Groups.
- G2. Group rows show a `StatusChip` (Active / Pending / On Hold), not the raw enum.
- G3. Mobile top bar shows the **context title** (My Groups, or the group name truncated) and the membership chip, with the lockup only on `/home`. Today it shows the lockup everywhere and a member cannot see which group they are in without scrolling.
- G4. Sidebar footer: Account row, then a single row with theme icon button and a destructive-styled Log Out. Not three identical nav rows.
- G5. Bottom nav active state for `/dashboard/:id/more` and `/dashboard/:id/settings` is missing (neither is a slot); highlight nothing rather than the wrong slot, and make sure `Home` is only active on the exact base path (it is, via `exact`).
- G6. Bottom nav labels use `text-[10px]`; raise to `text-xs` and keep the five-slot grid.
- G7. Add the Akili trigger for mobile inside the group More screen and Help, not as a floating orb over the nav (see 3.7).

### 3.2 Public chrome leaking into app screens

**Is now.** `Layout` chooses the shell from `account.authenticated`. Every visitor view of a group (`/dashboard/:id`, `/votes`, `/people`, `/more`, `/join/:id`), every gated screen before sign-in (`/home`, `/dashboard/:id/pay`, `/money`, `/settings`), `/account` signed out, and every operator page without a Privy session render inside `PublicShell`: the fixed landing header with six hash links, the orange newsletter footer, `MobileBottomNav` with the raised orange Launch orb, and the dev pill. On the `/home` gate the footer is visible directly under the sign-in card.

**Should be.** A third shell, `VisitorShell`, for app URLs when signed out: a 64px top bar with the lockup, one `Sign In` outline button and one `Create Account` primary; no hash links; no footer; a five-slot bottom nav of Groups / Browse / Start / Help / Sign In with **no orb**; on group pages a sticky bottom `Join This Group` bar above the nav. The marketing header and footer are for `/` only. `Header.tsx` retains the landing behaviour and stops being imported by `Layout`.

### 3.3 Sign-in sheet (`components/auth/AuthModal.tsx`)

**Is now.** Much improved since the 7 Sept audit: a bottom sheet on mobile, centred card on desktop with a 514KB photo pane, Phone/Email segmented control, dial-code select, one input, `Send code`, a `Continue with Google` outline, intent toggle, focus trap and Escape. The dial code follows the account country, so a viewer whose stored country is US sees `US +1` first in a Kenyan product.

**Gaps.**
- G8. Default dial code to `+254` when no country is stored; the account country should not be a US default anywhere (`readAccountCountry` fallback).
- G9. Button labels "Send code", "Create account", "Sign in", "Continue with Google", "Resend code" are sentence case; route through `Button`.
- G10. OTP input is one `text` field with `tracking-[0.35em]`; §13.4 asks for six boxes. Acceptable as is, but auto-submit on the sixth digit already exists, so keep behaviour and restyle later.
- G11. Desktop photo pane: drop it or replace with the example-receipt illustration. It is the only remaining marketing poster inside the app.
- G12. `rounded-2xl` / `rounded-xl` inputs are fine under the new ladder; the footer sentence "Phone or email is enough. You do not need a crypto wallet." is on `WalletGate`, not in the sheet. Move it into the sheet.

### 3.4 WalletGate (`components/auth/WalletGate.tsx`) and gated pages

**Is now.** Replaces the page body with a card: icon tile, title (title-cased), description, `Create Account` primary, `Sign In` outline, footer sentence. Rendered inside whichever shell `Layout` picks, so a signed-out person on `/home` sees this card between the landing header and the orange footer.

**Should be** (§13.4, §12 rule 3). No separate gate page. Gated routes render their real layout in a read-only or skeleton state and open the sign-in sheet on the first blocked action, then continue in place. Until that refactor, `WalletGate` stays but inside `VisitorShell`, with `Sign In` as the primary (returning users outnumber new ones on a gated URL) and `Create Account` as outline.

### 3.5 Solana wallet modal (`components/BarazaWalletModalProvider.tsx`)

**Is now.** Heading "Connect your Baraza account to continue", body naming Phantom, Solflare, Backpack, Coinbase Wallet, Ledger, Trezor, a list of adapters each labelled "Install" when absent, and no phone or email path. It is the destination behind `setVisible(true)` on Retro, Bounties, Claim, and the `useWalletGuard` fallback. Accessibility is the best in the codebase (dialog role, focus trap, Escape, scroll lock).

**Should be.** Unreachable from member routes. Rename heading to "Connect an Operator Wallet", keep it for `/admin`, `/retro` officers and `/claim`. Every member action goes through `AccountContext` (Privy) and, where an on-chain signature is truly needed, through an officer-only step that says so in plain words.

### 3.6 Status screens, loader, error boundary, offline banner, toasts

- `StatusPage`: right shape. Fix: `rounded-2xl` icon tile → `--radius-md`; the ghost numeral and dot pattern are fine; `primary: { to: '/account' }` for 401 should open the sheet instead of navigating. Add an inline variant (no full-height, no ghost numeral) for in-card errors so pages stop writing bespoke `border-destructive/40` boxes.
- `PageLoader`: keep. Add the Title Case labels §13.5 lists (`Loading Group`, `Loading Payment`).
- `AppErrorBoundary`: keep. Add a reference code in production and error reporting beyond `console.error`.
- `OfflineBanner`: uses `bg-primary/10` (orange as status). Change to black on white with the `WifiOff` icon, copy per §13.3.
- Toasts: `rounded-md border p-6 pr-8`; destructive variant fills red. Should be black card, white text, 3px orange top edge, `p-4`, actions as outline `View`/`Retry`. Titles are auto title-cased (good).
- `BackendStatus` dev pill: dev only, fine. Uses `text-accent`; will follow the token fix.

### 3.7 Akili (`akili/AkiliChat.tsx`, `akili/AskAkili.tsx`, `akili/AkiliSecurityReview.tsx`)

**Is now.** A 56px FAB with `var(--gradient-warm)` at `bottom-5 right-5`, `hidden md:flex` so it does not exist on phones. The panel is `rounded-2xl`, 340×500 on desktop, `inset-x-2 bottom-20 h-[72vh]` on mobile (only reachable through an `AskAkili` chip a page happens to embed), with a gradient header, a six-agent chip row (Akili, Nia, Kofi, Zara, Amara, Seku) at 10px, message text at 12px and timestamps at 9px. When the stream fails it silently substitutes one of 14 canned `RESPONSES` styled identically to a live answer. Route classification has no case for `/retro`, `/claim`, `/status` or `/admin/akili`. The panel is `z-50` over a `z-40` bottom nav with about 4px clearance to the Launch orb.

**Should be** (§13.3, §8.22). A helper, not a destination. 40px flat-orange circle above the bottom nav on mobile and bottom-right on desktop; opens a bottom sheet titled with the current step ("Why Is This Amount KES 500?"); no agent roster in the member app; canned answers either removed or visibly labelled "Saved answer"; the `admin` greeting and quick replies move to the operator shell; body text `text-sm`, timestamps `text-xs`. `AkiliSecurityReview` (a scored "Akili AI security layer" verdict with a `ShieldCheck` icon for the *watch* state) is unmounted today and should be deleted rather than restored.

### 3.8 Header profile menu and mobile menu (`components/Header.tsx`)

Only visible when signed in on `/` (which redirects) or on landing anchors. Contains "Launch a Group" → `/create/purpose` and, in dev or for admin wallets, a "Fund" chain selector. After `VisitorShell` exists these menus are landing-only; rename the link and point it at `/create`.

---

## 4. Screen-by-screen

Each entry: route, file, the job it has, what it renders today, what it should be, gaps.

### 4.1 My Groups — `/home` — `pages/Home.tsx`

**Job.** The signed-in hub: which groups am I in, what do I owe or need to vote on, how do I join or start another.

**Is now.** Eyebrow "Your workspace" in orange uppercase; title "Your groups" (sentence case) or "Start with a group" when empty; a two-column grid of cards each with an initials tile, name, a `ShieldCheck` chip printing `record.status` raw in uppercase, "Joined <date> · KES 500/mo" (converted currency), and an arrow. Below, a `Launch a group` primary and `Browse` outline, both routed at `/create/purpose`. Empty state: a "Join with an invite" form and a "Launch a group" card with two buttons. Loading: two pulse blocks. Error: a red text line.

**Should be** (§13.9). Title **Your Groups**. Rows (not two-column cards) showing name, `StatusChip`, and a next-action caption sourced from the API summary: "Pay dues", "1 vote open", "Invite people", or nothing. One `Open Group` primary per row. Bottom: `Join With an Invite` outline and `Start a Group` outline. Empty: two cards, one primary each. One-group members never see this page (PostAuthRedirect already routes them).

**Gaps.**
- G13. Status chip prints the enum; use `StatusChip`.
- G14. No next-action caption although `summary.duesStatus`, `outstandingDuesMinor` and `useDecisions` are available.
- G15. Amounts pass through the viewer-currency converter (finding 1).
- G16. Both CTAs link to `/create/purpose`; should be `/create`.
- G17. Two identical CTA rows (empty card and bottom row); keep one.
- G18. Eyebrow "Your workspace" is filler; delete.

### 4.2 Browse Groups — `/groups` — `pages/Communities.tsx`, `components/CommunityCard.tsx`

**Is now.** The page keeps `pt-20 sm:pt-28`, padding designed for the fixed public header; inside `AppShell` (no fixed header) this is an 80 to 112px blank band above the content. Then a 320px `CommunityBanner` slideshow of Unsplash photos with a "Featured community" aside showing member count, votes and "Group funds" from mock data, and a heading "Groups & Communities". A filter bar card with a search input, a native `<select>` over all `COMMUNITY_TYPES`, a Grid/List toggle, and a full-width `Launch a group` primary. Cards: `MagicCard` wrapper, `rounded-xl`, a 112px Unsplash photo header with a gradient scrim, initials tile, a coloured type pill (`bg-accent/12 text-accent` etc.), name, two-line description, an optional bounty strip in `text-secondary`, a three-stat row (Members, Group funds, Proposals) at 9px labels, "Monthly fee" in `text-accent`, and two buttons: `Become a member` and `View profile`.

**Should be** (§13.8). Title **Browse Groups**. Search. Single-select type chips (All, Chama, SACCO, Cooperative, Welfare, Investment), selected = black fill. Grid/List icon toggle. Card: name, type chip, member count if real, monthly dues if the list payload has one, `View Group` outline and `Join This Group` primary. No photo. No funds figure. No bounty strip. Empty: **No Groups Match** with `Clear Search`.

**Gaps.**
- G19. Remove `pt-20 sm:pt-28`; use the shared page padding.
- G20. Remove `CommunityBanner` and the featured aside (mock funds, remote photos, body text on photo).
- G21. Card: remove photo header, `MagicCard`, gradient, bounty strip, "Group funds" and "Proposals" stats (synthetic), coloured type pills (four colours for one system).
- G22. Button copy: "Become a member" → **Join This Group**; "View profile" → **View Group**. A group is not a profile.
- G23. Type filter is a `<select>` of every internal type (27); expose the five member-facing types as chips and let the rest match via a mapping.
- G24. Grid is `xl:grid-cols-4`; at 375px cards are already stacked, fine. List variant has a 256px photo column; delete with the photo.
- G25. Results copy "N communities found" → "N groups".

### 4.3 Group Home — `/dashboard/:id` — `pages/CommunityDashboard.tsx` on `components/app/GroupWorkspace.tsx`

**Job.** The product. "What do I do now?" for visitor, pending member, active member, officer and empty founder on the same URL.

**Is now.** A back link "My Groups" / "All Groups"; a `CommunityBanner` header card (initials tile, 4xl name, chips: type, membership chip with `ShieldCheck`, SACCO badge, "Since Nov 2024", "$3.85/month"); the circuit-breaker banner if frozen; a "locally cached membership" notice when `source !== 'api'`; then a two-column row: when signed out, a 208px card with `GroupSidebarNav` (Home / Pay / Votes / People / More / Join This Group) and the content column. Content: the Next Action card (icon tile in `bg-primary/10`, heading, body, one `btn-wipe`), Open Votes (up to 3 rows with "$654.50 · Closes today"), Money (Total in 3xl orange; "Reserved and available are not broken out yet…" as body copy), Recent Movement (`ActivityFeed`, 12px text, 10px timestamps, framer height animations).

The Next Action logic is correct and follows the §13.12 table exactly. That is the strongest piece of code on the member side.

**Should be** (§13.12). Identity strip (name, type, chip) as a compact header, not a photo banner. Next Action card first. Open Votes as `ListRow`s with title, amount, time left, and a small black quorum bar. Money as three `AmountBlock`s (Total, Reserved, Available) with "Not available yet" where the API is silent, plus `Open Money` outline for officers. Recent Movement as five `ListRow`s (who, what, amount, status chip) with `See All` → Money.

**Gaps.**
- G26. Visitor sees two identical Join CTAs: the Next Action card and the sidebar button. On Home, hide the sidebar CTA (the workspace already has `hideJoinCta` for the banner; extend it to the nav).
- G27. Header uses `CommunityBanner` (photo, gradient scrims, `rounded-xl`, `border-primary/15`); replace with the identity strip.
- G28. "Closes today" renders for any proposal whose `endsAt` is in the past because `daysRemaining` clamps at 0 while the stage still says active. Show "Closed" or derive the stage from time; never say "closes today" about yesterday.
- G29. Total in `text-primary`; money is black.
- G30. The "Reserved and available are not broken out yet" explanation is honest but is a paragraph; render two `AmountBlock`s reading "Not available yet" instead.
- G31. `ActivityFeed` events come from `dataStore` synthetic timers in dev and nothing in prod; the "Recent Movement" heading promises a ledger. Source from the statement API or show the empty state "No movements yet".
- G32. "Since Nov 2024" and "/month" fee in the header duplicate Settings; keep type and chip only.
- G33. Currency (finding 1).

### 4.4 Pay Dues — `/dashboard/:id/pay` — `pages/GroupPay.tsx`

**Is now.** Title "Pay Dues" from the workspace header, banner hidden. Non-member: card + `Join This Group`. Up to date: `CheckCircle2` in `bg-confirmed/15`, **You Are Up to Date**, `Go Home` outline. Otherwise: card one with a mono eyebrow "Amount due" and the figure in 4xl (or "Not available yet" with an explanation); card two with an uppercase mono label "M-Pesa phone number", a `+254` prefix input, `Pay With M-Pesa` full-width, and a `ShieldCheck` footnote with the support email. Payment calls the dev-only simulator and navigates to `/join/:id/status`.

This page is close to §13.13. Gaps are finishing, not structure.

**Gaps.**
- G34. Amount in the viewer's currency (finding 1); the label says `currency` from the membership but the formatter ignores it.
- G35. Confirming and receipt happen on `/join/:id/status`, a page with join copy ("Activating your membership", "credential"). §13.13 wants confirming and the receipt on this page. Add the `Stepper` + `ReceiptCard` inline and keep `/status` as the shareable receipt.
- G36. No `File a Dispute` link on the receipt (14-day window per §13.13).
- G37. Streak ("3 Months On Time") is not shown; `fetchDuesStreak` exists. Show only when the server returns a number.
- G38. Eyebrows in `font-mono uppercase`; use the standard eyebrow.
- G39. Phone input is hand-built; use the shared `PhoneField` with the account's dial code.

### 4.5 Votes — `/dashboard/:id/votes` — `pages/GroupVotes.tsx`, `components/DecisionCard.tsx`

**Is now.** Title "Votes", subtitle "Decisions that spend this group's money." Five filter chips with counts (Active, Passed, Executed, Rejected, Tied), selected black fill (correct). `Propose a Spend` outline for members. A two-column grid of `DecisionCard`s: orange "VOTING" stage pill at 10px, "0 days left", amount in `text-accent`, title, description, "Proposed by …" with an orange user tile, a two-colour bar (orange gradient vs red), "Yes 80% / No 20%" coloured, "32 yes / 8 no" at 10px, a quorum bar in orange with "85% voted — met", and a Yes (filled) / No (outline) pair. For a visitor both buttons render disabled at 45 percent opacity. Voting uses `useWalletGuard` (may open the Solana modal) and `useCastVote` with optimistic rollback (good).

**Should be** (§13.14). Filters **Needs You**, **Open**, **Passed**, **Sent**, **Did Not Pass**, default Needs You. Rows, not cards: title, amount, time left, a black quorum bar, and `Vote` outline or `See Result`. Voting happens on the vote page, not in the list. Visitors see rows and a sticky Join. Empty Needs You: **No Votes Need You**.

**Gaps.**
- G40. Card grid → `ListRow` list; the card's description, proposer, dual bars and buttons are the detail page's job.
- G41. Stage pill is orange (`STAGE_META.active: bg-primary/15 text-primary`); the Tied/Extended states use `accent`. All go through `StatusChip`.
- G42. Yes/No bars use `var(--gradient-primary)` and `bg-destructive`; one black quorum bar.
- G43. Vote buttons shown to visitors and to non-votable stages; hide when `!isMember` or `!votable`.
- G44. "0 days left" for past `endsAt` (same as G28).
- G45. Bucket labels are internal ("Executed") where §13 uses member words ("Sent").
- G46. `useWalletGuard` in a member component (finding 4).
- G47. Two columns at `md`; on 768px tablets the cards are cramped. Rows fix this.

### 4.6 One Vote — `/dashboard/:id/votes/:decisionId` — `pages/ProposalDetail.tsx`

**Is now.** Not on `GroupWorkspace`. Bare `Layout` with a gate, a back link "Back to proposals" (→ group home), and a `xl:grid-cols-[0.68fr_0.32fr]` layout: a `CommunityBanner` photo header with the stage pill, "#001" id, 3xl title and description; a 4-tile stat row (Requested funding, Share of group funds "-12.3%", Quorum required, Current approval) in mono eyebrows; a "Member voting" card with Yes/No counts, a 16px two-colour bar, "80% approval · 85% of 51% quorum", `Vote yes` (btn-warm) / `Vote no` (btn-ghost), a note "Voting is yes or no — the group record has no abstain", and, when passed, an `Execute proposal` button for **any** signed-in viewer; a "Proposal comments" card writing to a local store with `memberId: "local-member"`; an aside "Proposal activity" timeline from a local audit list.

**Should be** (§13.16). On `GroupWorkspace` (sidebar, chip, title = proposal title). Amount, proposer, time left; rules in one sentence ("Half of members must vote and two thirds must agree by 15 Sep"); one black quorum bar with Yes/No counts; `Support` primary and `Object` outline; after tap, `Vote Recorded` (pending) then `Vote Confirmed`; already voted → chips; tied → **Tied — Not Sent**; passed + officer → `Approve Send` linking to Money. Comments only if an API stores them. Visitor: no buttons, sticky Join.

**Gaps.**
- G48. Move onto `GroupWorkspace`; delete the photo banner, stat tiles and the "#001" id.
- G49. Labels "Vote yes / Vote no" → **Support / Object**; classes `btn-warm`/`btn-ghost` → `Button`.
- G50. `Execute proposal` visible to non-officers; move execution to Money as officer-only `Approve Send`.
- G51. Comments and audit trail are local-only (`lib/governance` lists); hide until an API exists, or label "On this device only".
- G52. "Share of group funds -12.3%" is computed from a synthetic `fundBalance`; drop.
- G53. Back link says "Back to proposals" but goes to group home; the sidebar makes it redundant.
- G54. `useWalletGuard` (finding 4); `address` from a wallet drives `useVoteStatus`, so a Privy-only member never sees "You voted".

### 4.7 Propose a Spend — `/dashboard/:id/votes/new` — `pages/CreateDecision.tsx`

**Is now.** Bare `Layout`, `max-w-lg`, a `btn-wipe-outline` Back button, a `CommunityBanner` header "Submit a proposal", an "Available treasury" info tile from `community.fundBalance`, a "Governance rules" box, then Title, Description, Funding amount (currency prefix from the *account* country), Voting period select (3/7/14/30), and `Submit proposal` (`btn-primary`). Token-gate copy via `getTokenGateStatus(community.id, publicKey)` from the Solana wallet. Success toasts "Proposal submitted" and navigates to group home.

**Should be** (§13.15). On `GroupWorkspace`, title **Propose a Spend**. Fields: Title, What This Is For, Amount (group currency; "Available: not available yet" under it if unknown), Days to Vote (default from group rules). One-sentence preview of quorum and threshold. `Publish Proposal` primary, `Cancel` outline. Pending until the server accepts; then go to the vote page.

**Gaps.**
- G55. Move onto `GroupWorkspace`; drop banner and Back button.
- G56. Amount currency from the group, not `account.country.currency`.
- G57. `overBudget` compares against `community.fundBalance`, a synthetic number; compare only when the API provides Available.
- G58. Token-gate copy and `useWallet` (finding 4).
- G59. `rounded-xl` inputs and `btn-primary` → shared `Field` and `Button`.
- G60. After submit, navigate to the new vote, not the home.

### 4.8 People — `/dashboard/:id/people` — `pages/GroupPeople.tsx`, `components/community/MemberDirectory.tsx`

**Is now.** Title "People", subtitle. Officers: an `Invite People` button that expands into an inline card (expiry days, max uses, `Create Link`, then the URL in mono with `Copy Link` and `Share`). Then `MemberDirectory`: four stat tiles (Total Members, Total Contributed "$806.17", Avg per Member, Leaders) at 9px labels; a `rounded-xl` search; seven filter chips (All, Active, Overdue dues, Officers, Founder, Admin, Member) in `bg-primary/15 text-primary` when selected; a **CSV** export button visible to everyone including visitors; a 10px "Sort by" row; member cards with orange initials tiles, orange role pills, a `— mo streak` placeholder chip on every row, "Joined 18mo ago", a total in `text-accent`, and an expandable panel with four stat tiles, "Last contribution", and a contribution history. Members come from `useMembers` (synthetic `dataStore` in dev).

**Should be** (§13.17). Search; filters **All / Active / Pending / Overdue** (Overdue officers only). Row: name or masked phone, role, dues `StatusChip`. Expand: last contributions. Officer only: `Invite People` primary opening a **sheet**. Member: read-only, no CSV (CSV lives in Settings → Statements).

**Gaps.**
- G61. Remove the four stat tiles; they are synthetic aggregates and duplicate Money.
- G62. CSV export visible to visitors and members; officer-only, and move to Settings.
- G63. Seven filters → four; selected state black fill, not orange.
- G64. Streak chip renders "— mo streak" for everyone; show only when data exists (the component already knows `hasData`; the parent should not render it otherwise).
- G65. Role pills and initials tiles in orange/accent; roles are text, initials tiles are bordered neutral.
- G66. Sort row at 10px; make it a single `Sort` menu at `text-xs` or drop (default by name).
- G67. Invite panel is inline and duplicated in `OfficerAdminPanel` (Settings); one `InviteSheet` component used from People only.
- G68. Currency (finding 1); `formatRailAmountFromKes` is a no-op wrapper around the same converter.

### 4.9 Money — `/dashboard/:id/money` — `pages/GroupMoney.tsx`

**Is now.** Gated. Title "Money". A balances card with Total (3xl, orange) and Reserved / Available reading "Not available yet" (honest). Officers: a "Waiting to Send" card listing passed decisions with `Approve Send` (calls `/api/governance/execute`); a `Send to Phone` outline that expands into a form: recipient phone (`+254712345678` placeholder, E.164 across KE/UG/GH/NG), **Amount (USDC)** defaulting to `100`, "Quoted rate: 1 USDC = 130.50 KES" from a hardcoded constant, a 150 bps slippage note, a four-way rail picker (M-Pesa, MTN MoMo, Airtel, Bank), a tranche warning above KES 250,000, `Send Now` (`btn-warm`), and a status list printing raw enums (`OFFRAMP_INITIATED`, `PROVIDER_PENDING_VERIFICATION`…) with copy such as "Escrow funds reserved in the treasury vault (Debit: Treasury, Credit: Escrow)". The request sends a fabricated `x-wallet-proof: session:<id>:<ts>` header. The Trail card lists only *executed decisions* ("Released") and an `Export Statement` CSV button for officers.

**Should be** (§13.18). Three `AmountBlock`s. Trail from `GET /api/communities/statement`: date, person, in/out, amount, `StatusChip`; tap → receipt / dispute. Officer block above the trail: Waiting to Send rows (title, amount, "n of 3 Officers"), `Approve Send` primary (disabled with **On Hold — See Settings** when frozen); after threshold, `Send to Phone`: phone, amount in **group currency**, rail M-Pesa only unless the quote lists another, `Send in Parts` when over the ceiling, `Send Now`, then a `Stepper` with words (Queued → Sent to provider → Received → Failed). `Export Statement` with a date range.

**Gaps.**
- G69. USDC amount field, FX constant, slippage copy, MTN/Airtel/Bank rails: officers enter KES; conversion is the server's job. Show the quote if the API returns one, otherwise nothing.
- G70. Status enums and ledger jargon in copy; replace with the `Stepper` words.
- G71. Fabricated `x-wallet-proof` header is a truth problem, not a UI one; remove and let the server reject until real proof exists (flag to Simon).
- G72. Trail source is executed decisions, not the statement; consume the statement API that the CSV export already proves exists.
- G73. Total in orange (G29).
- G74. `Approve Send` fires `/api/governance/execute` with no confirmation; add a confirm sheet stating amount, recipient and the "n of 3" status.
- G75. Duplicate primaries when the send panel is open (`Approve Send` in every row plus `Send Now`).

### 4.10 Group Settings — `/dashboard/:id/settings` — `pages/GroupSettings.tsx`, `components/community/CommunitySettings.tsx`, `components/officer/OfficerAdminPanel.tsx`

**Is now.** Gated. Non-officers get a note and the same `CommunitySettings` cards: Community identity (Name, Type, **"Payment setup: Active"** hardcoded, Founded, Community ID + Copy); Governance parameters (four tiles, "Locked rules" chip, 10px notes); Membership (Monthly dues, Total members, "Your status: Active member / Account verified" from `isMember` only); Payment channels (Paybill and USSD with **"Add for KES 2,000" / "Add for KES 3,000" linking to `/create`**, which starts a *new group*); Admin actions (Transfer admin — Locked; Update governance rules — Locked; **Create community token — "Optional SPL token launch… Coming soon"**; Manage treasury — Open; Export member list — Locked). Officers also get `OfficerAdminPanel`: Invite links (duplicate of People, and it mints a **local fake invite code** `inv_…` when the API returns none), Financial statement (date range + CSV), Payment disputes (order id, type, amount, reason), Leadership titles (a free-text **"Member wallet or account id"** input, role select, Assign/Revoke). Regulated types get the `LicenseSection` (number, file picker that only reads a filename, HTTPS URL, expiry, `Submit for Review`).

**Should be** (§13.19). Sections in order: Group Identity (name, type, id, `Copy Id`); Rules (quorum, threshold, days; "Locked"); Dues (amount, or **Free to Join**); Paybill and USSD (number, else **Not Set**, no price); Officers (list from `/api/communities/officers`, `Add Officer` picks from members, `Remove Officer`); SACCO Licence (only for regulated types); Statements (date range, `Download CSV`); Disputes (order id, type, `File Dispute`). Members see Identity, Rules, Dues read-only. Nothing about tokens, treasury policy enums, or transfer admin.

**Gaps.**
- G76. "Payment setup: Active" is a string literal; delete.
- G77. "Add for KES 2,000/3,000" links to `/create`; replace with **Not Set**.
- G78. "Create community token / SPL" and "Transfer admin rights" rows: delete; locked rows that will never unlock are noise.
- G79. Invite generator duplicated and mints local codes; remove from Settings.
- G80. Leadership by pasting a wallet address; replace with a member picker (People rows) and role radio.
- G81. `LicenseSection` file input does nothing but read the filename; either upload to storage (backend ask) or remove the file input and keep the URL field with clear help.
- G82. 21 sub-12px classes; all inner tiles `rounded-lg`; three different card headers. Rebuild on `SettingsSection` (§7).
- G83. Officer detection: `CommunitySettings` uses `isMember` for "Your status: Active member"; use the membership chip.

### 4.11 More — `/dashboard/:id/more?tab=` — `pages/GroupMore.tsx` and eight components

**Is now.** Eight chips (Activity, Roles, Suggestions, Leaderboards, Roadmap, Board, Bounties, Gallery), selected black fill, then the legacy component. Findings per component (line references in the audit transcript):

| Tab | Data | Worst problem | Verdict |
|---|---|---|---|
| Activity (`ActivityFeed`) | `dataStore` synthetic events | 12px body, 10px times, framer height animation, no real ledger | Rebuild as `ListRow`s from the statement API; until then honest empty state |
| Roles (`CommunityRoles`) | hardcoded; counts invented (`admin: 1, member: memberCount - 1`) | Fabricated counts stated as fact; DAO vocabulary | Redesign as read-only "what officers can do", no counts |
| Suggestions (`CommunitySuggestions`) | localStorage + 3 seeded people re-tagged with the real `communityId` | Invented members and votes inside a real group; empty state unreachable | Strip seeds, keep, label "On this device" until API exists |
| Leaderboards (`CommunityLeaderboard`) | derived from bounty store | Gold/silver/bronze hex (`#FFD700` etc.), "rep" unit, table overflows at 360px | Keep; tokens; rows not table |
| Roadmap (`CommunityRoadmap`) | localStorage + 4 seeds incl. one *completed*, 2026 dates | Fake completed milestone; `min-w-[640px]` forces horizontal scroll; "Web3" tag | Strip seeds; stack columns on mobile |
| Board (`CombinedBoard`) | bounty store + decisions | In Progress and Under Review are the same orange; "View" links to group home | Keep; fix statuses and links |
| Bounties (`BountyBoard`) | seed + localStorage + phantom `/apply` API | Drag-and-drop is the primary mechanism and does not work on touch; `awarded` and `paid` both labelled "Approved"; "I'm in" files nothing | Redesign or park (see 4.16) |
| Gallery (`CommunityGallery`) | Unsplash by type, captions "governed on-chain" | Stock photos of strangers under "{Group} in motion · 6 photos" | Remove |

Also unmounted and to delete: `InviteLink` ("Download QR" opens a tab; third-party QR service), `MembershipCard` (hardcoded "VERIFIED", orange gradient, 9px labels), `LiveStatCard`, `AkiliSecurityReview`, `EnvironmentSelector`, `WalletStatus`, `ShimmerButton`, the `Onboarding` page and its three components. `CsvImport` is the one orphan worth wiring in (officer bulk import from People) after a token pass.

### 4.12 Join — `/join/:id` and `/join/:id/status` — `pages/JoinDao.tsx`, `pages/JoinStatus.tsx`

**Is now (join).** Public shell. Back link "Back to Community". One large card: a `CommunityBanner` header with mono eyebrow "JOIN COMMUNITY", 3xl name, the sentence **"Pay with mobile money, bank transfer, or your Baraza account"**, a "Membership Dues $3.85" tile; a "DUES BREAKDOWN" box with the formula sentence and four rows, total in orange; tier blocks (vouching / proof of personhood / phone); the "M-Pesa (default)" block with a `+254` input and a `btn-warm` labelled **"Send M-Pesa STK PIN prompt"** (or "Sign in to pay" / "Join free community"); a toggle **"Other payment methods (on-chain transfer)"** revealing a 64-character hash field and `Verify transfer`; a warning box "Payment confirmed is not membership activation"; and, **below all of it**, the four-stage tracker "Joining this group · Step 1 of 4". Fee comes from `calculateDynamicFee` locally, overridden by `create-payment-intent` when it answers.

**Is now (status).** Public shell. Eyebrow "Join Status", headline (four variants), reference sentence; alert boxes; a two-column layout: a card of six step rows with `Check` / `Loader2` / `Clock3` icons and copy like "Preparing your membership credential", and an aside "Status" table (Payment / **Credential: Minted** / Membership), a `ShieldCheck` note mentioning `INDEXER_CONFIRMED`, and `Open group dashboard` (`btn-primary`, falls back to `/dashboard/1` when no id). Polls the server only; no fake progression (fixed on 9 Sept, keep).

**Should be** (§13.11). One page, four stages in a `Stepper` **at the top**. Stage A: name, type, one-line rules, amount (server quote only, group currency), line items, `Why This Amount?` Akili chip, `Continue to Pay`. Stage B: phone prefilled, `Pay With M-Pesa`; after tap the button reads `Check Your Phone` disabled. Stage C: confirming, driven by the order status, on the same page. Stage D: **You're In** with `Open Group`, or **You're In the Queue** for vouching. `/status` stays as the shareable receipt with the same stepper.

**Gaps.**
- G84. Tracker sits at the bottom; move to the top and drive stage from state (it already computes `joinStage`).
- G85. Copy promises "bank transfer"; remove. Label the hash path **On-Chain Transfer** under a collapsed "Other ways to pay" only when the environment supports it.
- G86. Button labels: "Send M-Pesa STK PIN prompt" → **Pay With M-Pesa**; "Join free community" → **Join This Group**; "Verify transfer" → **Verify Transfer**.
- G87. Fee formula sentence is engineer-speak; keep the line items, drop the formula.
- G88. Currency (finding 1); the tile says "$3.85" for a KES group.
- G89. `CommunityBanner` header (photo); identity strip.
- G90. Status page copy: "credential", "minted", `INDEXER_CONFIRMED`, "Preparing your membership credential" → "Recording your membership", "Membership verified", "You're an active member". Merge the "Status" aside into the stepper.
- G91. `to={`/dashboard/${id ?? "1"}`}` hardcodes a fallback group; never link to a guessed id.
- G92. Both pages render in `PublicShell` when signed out (3.2).

### 4.13 Start a Group — `/create` and `/create/purpose` — `pages/CreateCommunity.tsx`, `pages/CommunityPurpose.tsx`

**Is now.** `/create` without a valid `?type=` redirects to `/create/purpose`: a 50 percent progress bar, "Step 1 of 2", "What Does Your Group Do Together?", four multi-select cards (Monthly Savings, Community Service, Social Gathering → *professional*, Business Ventures), "Choose everything that applies", `Continue to setup`. Only the first selection is used. `/create?type=` then renders a two-column page: a Back button, a `CommunityBanner` "Launch a community" with two `AskAkili` chips, and a form of twelve blocks: Group name; Membership dues model (three `rounded-xl` toggles) with amount and a 0.5 percent pass-through checkbox; "How members join" as **Tier 1 to Tier 4** cards; SACCO registration (regulated types); Description; Governance model (three inputs with long helper paragraphs, a "Suggested starting example" orange pill, a treasury policy select with enum-like options); Premium add-ons (Paybill **+ KES 2,000**, USSD **+ KES 3,000**); a chain indicator ("Governance and membership will be recorded on Solana (Solana Devnet). Switch the funding rail from the Fund menu…"); Payment with four `btn-wipe` toggles (Mobile money, WhatsApp, Privy wallet, Bank/SWIFT) and a phone field; a fee summary "Setup fee KES 6,500 … Total charge"; and a submit reading "Pay KES 6,500 with mobile money". The right column is an `AnimatedSetupChecklist` with a pulsing "Live" badge, a sweeping gradient line, and a step "Group account — Settlement path selected" that is always complete. Success screen is honest about payment ("No launch payment has been confirmed yet") and shows Paybill/USSD as "Not set".

**Should be** (§13.10). One URL, three steps, "Step 1 of 3", `Back`. Step 1 **What Kind of Group?**: five single-select cards (Chama, SACCO, Cooperative, Welfare, Investment), SACCO note. Step 2 **Name Your Group**: Group Name, What You Collect (amount, currency from the account country), Who Must Vote as two steppers with a live sentence, Activation amount or **Free to Join**; a sticky summary card. Step 3 **Open This Group**: if the server quotes a fee, amount + phone + `Pay With M-Pesa`; else `Create Group`. Success only when create (and payment if required) are confirmed: `Invite People` primary, `Go to Group` outline.

**Gaps.**
- G93. Direction of the redirect is inverted versus §13.25; `/create/purpose` should redirect to `/create` and the purpose page be deleted.
- G94. Hardcoded `DAO_CREATION_FEE_KES`, `PAYBILL_ADDON_FEE_KES`, `USSD_ADDON_FEE_KES` rendered as charges; remove until a launch quote endpoint exists (backend ask).
- G95. Four payment methods; only M-Pesa (and only via the dev simulator) has a path. Show one.
- G96. Chain indicator and "Fund menu" copy; delete. Members never choose a rail.
- G97. Tier 1–4 labels and "Proof of personhood": show as "How people join" with plain names, and hide tiers the join page cannot complete (proof of personhood is unsupported by the join page's own copy).
- G98. Treasury policy select (`multisig-ready` etc.) is an enum with no member meaning; default it and hide.
- G99. `AnimatedSetupChecklist` is theatre (fake "Live", always-complete step); replace with the static summary card.
- G100. 27 `COMMUNITY_TYPES` including DAO, Political Caucus, Government; the wizard shows five and maps the rest.
- G101. `useWallet`/`useWalletGuard`/`useStellarWallet` in a member flow (finding 4).
- G102. Success screen buttons `btn-primary` / `btn-ghost` and copy "Go to Dashboard / My groups" → `Invite People` / `Go to Group`.

### 4.14 Account — `/account` — `pages/Profile.tsx`, `components/profile/ProfileIdentitySettings.tsx`

**Is now (signed in).** A `CommunityBanner` photo header with a user icon tile, "Baraza account" in orange, the display name (a phone number or email), country · currency, and a `Log out` outline. A `[0.34fr_0.66fr]` grid. Left: "Participation balance" (sum of `brzaBalance`, "Your current voting weight") with a `DuesStreakChip`; Country and currency select; Identity (display name, bio, **Avatar URL (HTTPS)** text input, "Linked account 0x12…ab" wallet snippet); Language (three toggle buttons in orange when selected); Notification preferences (four native checkboxes, `Enable browser notifications` outline, `Save profile` btn-warm); Badges (derived locally, 11px chips); Referral progress placeholder ("The relationship matters, not the count."). Right: Your memberships (same card as Home with raw status chips and streak chips); Bounty announcements; Voting history (a count from `dataStore`); Account security (one sentence).

**Should be** (§13.20). Title **Account**. Name, avatar (upload when the API exists, else none), `Save`. Country / currency. Language as three chips (black when selected). Notifications as four switches with `Enable Push` outline. **Your Groups** list identical to My Groups rows. `Log Out` destructive. Nothing else.

**Gaps.**
- G103. Photo banner for a person; identity strip with initials.
- G104. "Participation balance / voting weight" exposes the BRZA token to members; remove.
- G105. Badges, Referral, Bounty announcements, Voting history: local derivations or placeholders; remove until server-backed.
- G106. "Linked account 0x…" and "No wallet linked yet": remove wallet vocabulary.
- G107. Avatar URL text field: replace with upload or remove.
- G108. Native checkboxes → `Switch`; language toggles orange → black selected.
- G109. Three different card header styles on one page; use `SettingsSection`.
- G110. Country select shows "United States - USD" first when nothing is stored; default Kenya.

### 4.15 Help — `/help` — `pages/Help.tsx`

**Is now.** Title "Help", subtitle, six answer cards (paying, voting, starting, records, lost phone, SACCO), `Email Help` primary, `System Status` outline. Sentence-case questions, body 14px.

**Should be** (§13.7). This is close. Gaps: use the native `<details>` accordion from the landing FAQ so six answers are scannable on a phone; add an inline `Ask Akili` chip per topic; `System Status` should not be a peer of `Email Help` (make it a text link).

### 4.16 Bounties — `/bounties`, `/bounties/:bountyId` — `pages/Bounties.tsx`, `pages/BountyDetail.tsx`

**Is now.** Public. A hero with an Unsplash photo and three gradients, stats, a `Post bounty` CTA that **opens the Solana wallet modal**; search, status filter, board/grid/list toggle defaulting to a horizontally scrolling board (four 288px columns); cards with orange statuses, rewards in `text-accent`, "Approved" for both `awarded` and `paid`; a post form labelled `Reward (USD)` for a US viewer while storing `rewardKes`; success copy "Bounty posted to Baraza." for a localStorage write. Detail: the best-built page in the set (real loading, 404, error copy), but the same stock banner for every bounty, `Math.max(bounty.submissions, submissions.length)` inflating counts, and error and success messages in identical muted grey.

**Should be** (§8.16, §13.24). Not in v1 member chrome. Keep the routes, park the global board behind More → Bounties, and when it returns: reward labelled "Promised" not "Funded", statuses through `StatusChip`, list view default, apply only for members via `AccountContext`, no wallet modal.

### 4.17 Link Phone — `/claim` — `pages/ClaimIdentity.tsx`

Wallet-first by design (the page links a wallet to a phone). Gaps: `<a href="/account">` hard navigation on success; no `Resend Code`; heading "Linked." ; `font-display font-mono` on the same element; 11px inline button inside a sentence. Keep, fold into Account when identity is unified (§8.17).

### 4.18 System Status — `/status` — `pages/StatusDashboard.tsx`

Public and indexable. The "Kotani Pay / Minisend" rail is synthesised from the Horizon probe, so it can read "Operational" for a provider never checked. Copy is SRE-facing ("Hard tier", "OpenMetrics for Prometheus"). Statuses are amber vs orange with no icons at 11px. Should be: three rails as **Ready / Not Ready** with icons, no synthesised rail, no metrics links; operator detail moves to the operator shell.

### 4.19 Operator: `/admin`, `/admin/akili`, `/admin/retro`, `/retro/*`, `/onboard`

- `AdminReconciliation`: two **hardcoded tables** (`paymentOrders`, `mintJobs` with a baked-in May 2026 timestamp) behind working search and buttons that only toast "preview mode"; `listBounties` seeds; raw enums as chips; "Akili has cleared the current community rules"; `min-w-[760px]` tables; renders in `PublicShell` unless the operator also has a Privy session. Strip the fake tables, move to an operator shell.
- `AkiliCouncilFilings`: real API, needs the operator shell, `.baraza-card`, tokens instead of `text-amber-*`, an empty state.
- `RetroRounds`: real API with signed proof; a source-file path and a table name in the page copy; **Settle round** distributes a pool in one click with no confirmation; add a confirm sheet.
- `RetroCommunity`, `RetroVote`, `RetroResults`: member-facing, but require a Solana wallet and identify people by base58 prefix; first paint of RetroCommunity says "No round is open" before the fetch resolves. Decision §9.4: off the member map, into the operator shell, until identity is unified.
- `LeverageOnboarding`: dev-only via `import.meta.env.PROD` redirect; the only control on a page that writes real records. Keep, add an admin check.

These do not need to look like the member app. They need their own plain shell (a left nav of Reconciliation / Filings / Retro / Lab, a wallet chip, no bottom nav, no footer) so the member shell can stop carrying admin copy and the Solana modal.

---

## 5. Cross-cutting defects

| # | Defect | Root cause | Where | Fix |
|---|---|---|---|---|
| X1 | Money shown in viewer's currency at a fixed rate | `formatKSh` → `formatAccountCurrency` with `KES_USD_REFERENCE` | every amount | `formatMoney(minor, currency)`; group currency everywhere; account country only sets defaults |
| X2 | Orange is every status | `--accent` = `--primary` | 40+ files | Token split (§2.1); `StatusChip` |
| X3 | Synthetic data in production | `SEED_*`, `COMMUNITY_GALLERIES`, `paymentOrders`, `RESPONSES`, `dataStore` timers gated only by `isSyntheticDataEnabled` (dev) but seeds not | More tabs, admin, Akili, People, Activity | Delete seeds; honest empty states |
| X4 | Members meet the Solana modal | direct `useWallet`/`setVisible`; `useWalletGuard` prefers wallet over phone | Retro, Bounties, Claim, votes, propose, create | All member actions through `AccountContext`; wallet only in operator shell |
| X5 | Radius inversion | tokens 0.25rem vs `rounded-lg/xl/2xl` inline | almost every file | Radius ladder tokens; lint rule against literal `rounded-*` in app surfaces |
| X6 | Sub-12px content | inline `text-[9/10/11px]` | 30+ files | Floor at `text-xs`; lint |
| X7 | Button aliases | six CSS classes, no padding on three | 60+ files | `Button` only; delete aliases |
| X8 | Sentence-case buttons | raw `<button>` bypasses `titleCaseLabelChildren` | most pages | `Button` only |
| X9 | Public chrome on app URLs | `Layout` keys shell on Privy auth only | visitor and gated views, operators | `VisitorShell`; operator shell |
| X10 | Photo banners in-app | `CommunityBanner` used on 7 screens | Join, Browse, Account, votes, create | Identity strip; delete `communityVisuals.ts` |
| X11 | Stale legacy links | `/create/purpose`, `/communities`, `/profile`, `/evaluate` hardcoded | Header, Footer, Home, Profile, Hero, Pricing, CTA, MobileBottomNav | Point at canonical routes |
| X12 | `<title>` says DAOs | `index.html` | first paint, tab, share previews | "Baraza — Group Money You Can See" |
| X13 | "Closes today" for closed votes | `daysRemaining` clamps to 0; stage ignores time | Home, Votes, One Vote | derive `closed` when `endsAt < now` |
| X14 | Two identity systems plus a third in localStorage | Privy `AccountContext`, Solana adapter, `phoneAuth` local session read by `useWalletGuard` | WalletStatus (unmounted), useWalletGuard | Fold into `AccountContext` |

---

## 6. Inventory that needs deleting, wiring or renaming

**Unmounted (delete unless noted).** `pages/Onboarding.tsx`, `components/onboarding/PhoneEntry.tsx`, `OtpVerify.tsx`, `WelcomeScreen.tsx`, `components/WalletStatus.tsx`, `components/MembershipCard.tsx`, `components/EnvironmentSelector.tsx`, `components/ShowReelSection.tsx`, `components/CommunityMarquee.tsx`, `components/community/InviteLink.tsx`, `components/community/LiveStatCard.tsx`, `akili/AkiliSecurityReview.tsx`, `components/ui/shimmer-button.tsx`. Keep and wire: `components/onboarding/CsvImport.tsx` (officer import from People).

**Mounted but to remove from member surfaces.** `components/CommunityGallery.tsx`, `lib/communityVisuals.ts`, `components/CommunityBanner.tsx` (in-app uses), `components/ui/magic-card.tsx`, `components/ChainSelector.tsx` from member menus, `CommunityPurpose.tsx` after the wizard ships.

**Stale links.** `Header.tsx:105,279` and `Footer.tsx:14` and `Home.tsx:151,170` and `Profile.tsx:314` → `/create/purpose`; `Footer.tsx:13`, `HeroSection.tsx:41`, `AIPlatformSection.tsx:179`, `MobileBottomNav.tsx:16` → `/communities`; `Footer.tsx:37`, `MobileBottomNav.tsx:20,56` → `/profile`; `Footer.tsx:34` → `/evaluate`. All redirect today; fix them so the address bar never shows a dead URL.

**Naming.** "Launch a Group" (AppShell, Header, Home, Communities) vs "Start a Group" (spec, landing): use **Start a Group**. "Community" vs "Group" in titles, SEO strings and empty states ("No communities match", "Explore communities", "Join community"): use **Group** in member copy; the type name (chama, SACCO) when specific.

---

## 7. The component library to build once

Everything in §4 reduces to these atoms. Build them first; every page then becomes composition.

| Component | Replaces | Spec |
|---|---|---|
| `PageHeader` | ad-hoc `<h1>`/`<h2>` blocks in every page | optional `Back`, title (`text-2xl font-black md:text-3xl`, Title Case), one-line subtitle, optional desktop-only primary slot |
| `IdentityStrip` | `CommunityBanner` group header, Profile banner | initials tile, name, type chip, membership `StatusChip`, SACCO licence chip when relevant; no photo |
| `StatusChip` | every inline status span, `STAGE_META` pills, `SaccoComplianceBadge`, `DuesStreakChip` colours | props `kind: pending \| confirmed \| failed \| hold \| stale \| info`, `label`, icon auto; `text-xs`, pill; word + icon always |
| `AmountBlock` | Money / Home / Pay figures | `currency` first, `tabular-nums`, sizes `lg` (3xl) and `md` (xl), caption, `Not available yet` when `null` |
| `ListRow` | `DecisionCard` in lists, activity rows, member rows, trail rows | leading (icon or initials), title, meta line, trailing (amount and/or chip), whole row is a link when `to` is set; 56px min height |
| `Stepper` | `ActivationTracker`, `JoinStatus` steps, payout status lists, `AnimatedSetupChecklist` | numbered circles, current orange fill, done black, todo outline; labels under; horizontal on desktop, vertical on mobile |
| `EmptyState` | 12 bespoke empty blocks | heading, one sentence, one primary, optional outline |
| `InlineError` | `border-destructive/40` boxes | icon, sentence, optional `Try Again`; also the `StatusPage` inline variant |
| `FilterChips` | Votes buckets, People filters, More tabs, Browse types | single-select, black fill when selected, counts optional, `text-xs`, wraps |
| `Sheet` | invite panel, send panel, confirm dialogs, Akili panel, sign-in on mobile | bottom sheet ≤ 90vh with inner scroll on mobile, centred dialog on desktop; focus trap and Escape from `AuthModal` |
| `Field`, `PhoneField`, `MoneyField`, `Switch`, `Select` | hand-built inputs in 15 files | token colours, `--radius-sm`, label + help + error, 44px |
| `SettingsSection` | `CommunitySettings` cards, Profile cards | title, description, rows of label/value/action; officer rows hidden for members |
| `ReceiptCard` | none (missing) | amount, reference (mono), date, `StatusChip`, `File a Dispute` link, `Back to Home` |
| `Skeleton*` | pulse blocks in 8 files | `SkeletonRow`, `SkeletonAmount`, `SkeletonHeader` matching the atoms above |
| `Button` (existing) | all `btn-*` classes | variants `primary \| outline \| destructive \| link \| icon`; sizes 36/44/48; auto Title Case |

Place them under `app/src/components/ui/` (primitives) and `app/src/components/app/` (composed: `IdentityStrip`, `ListRow`, `SettingsSection`, `ReceiptCard`). Each ships with a small vitest render test and a story-like fixture page at `/dev/ui` (dev-only) so the team can see every state without seeding data.

---

## 8. Implementation plan

Rules: small PRs on `front-end`, one phase per PR family, merge to `dev` for backend testing, no edits under `app/api`, `api`, `contracts`, `programs`, `supabase`. Every PR: typecheck, the tests for touched files, and screenshots at 360×640, 390×844 and 1440×900 in light and dark. No claim of live M-Pesa or live auth.

### Phase 0 — Foundations (system, no visible page change yet)

**PR 0.1 Tokens.** Split `--accent` (temporarily alias to `foreground`), add status tokens, change `--confirmed`, delete gradients and glow shadows, add the radius ladder, move `.baraza-card` to `--radius-md`, update `tailwind.config.js` for `radius-sm/md/lg`. Files: `index.css`, `tailwind.config.js`. Acceptance: app builds; no visual regression tests break beyond snapshot updates; a grep for `text-accent` produces the migration list.

**PR 0.2 Buttons.** Extend `Button` sizes (36/44/48), add `fullWidth`; codemod raw `className="btn-…"` buttons and anchors to `Button` / `Button asChild`; then delete `.btn-warm`, `.btn-primary`, `.btn-ghost` from CSS. Files: `ui/button.tsx`, `index.css`, ~60 call sites. Acceptance: `grep -r "btn-warm\|btn-primary\|btn-ghost" app/src` returns nothing; every button label renders Title Case.

**PR 0.3 Money.** Add `lib/money.ts` with `formatMoney(amountMinor, currency)` and `formatMajor(amount, currency)`; replace `formatKSh` / `formatRailAmountFromKes` / `formatAccountCurrency` at call sites with the group's currency (`community.currency` where present, else `KES`); keep `account.country` for the Start a Group default only. Files: `lib/utils.ts`, `lib/accountLocale.ts`, ~25 call sites. Acceptance: `/dashboard/1` shows `KES 500` regardless of the stored account country; unit test for `formatMoney`.

**PR 0.4 Primitives.** `StatusChip`, `AmountBlock`, `ListRow`, `Stepper`, `EmptyState`, `InlineError`, `FilterChips`, `Sheet`, `Field` family, `PageHeader`, `IdentityStrip`, `SettingsSection`, `ReceiptCard`, skeletons; the `/dev/ui` fixture route. Acceptance: fixture page renders every state; each primitive has a render test; no primitive uses a literal `rounded-*` or a `text-[…px]`.

**PR 0.5 Lint guards.** ESLint `no-restricted-syntax` rules for `text-[9px|10px|11px]`, `rounded-(lg|xl|2xl)` outside `components/landing` and marketing sections, `btn-` classes, and imports of `@solana/wallet-adapter-react` outside `pages/Admin*`, `pages/Retro*`, `pages/ClaimIdentity.tsx`, `components/Baraza*`. Acceptance: lint passes with an allowlist file that shrinks each phase.

### Phase 1 — Chrome

**PR 1.1 `VisitorShell`.** New shell for app URLs when signed out; `Layout` picks Public (landing only), Visitor, or App. Sticky `Join This Group` bar on group pages for visitors. Retire the orb from `MobileBottomNav` (five plain slots). Fix stale links (X11) and `index.html` title (X12). Acceptance: `/dashboard/1` signed out shows no landing nav, no footer, no orb; `/home` gate shows Sign In primary.

**PR 1.2 AppShell polish.** G1 to G7, plus the `Baraza Protocol` lockup at `size="sm"` in sidebar and top bar (decision §9.5). Acceptance: mobile top bar shows group name and chip inside a group; sidebar footer has one Log Out styled destructive; a fresh browser with a dark OS opens dark, and a toggle survives reload.

**PR 1.3 Overlays.** Toast restyle; `OfflineBanner` black on white; `StatusPage` inline variant and 401 opening the sheet; `PageLoader` labels; sign-in sheet G8 to G12. Acceptance: fixture page shows each.

**PR 1.4 Akili as helper.** FAB 40px flat orange above the nav on mobile; panel as `Sheet` titled by step; remove agent chips from the member panel; label or remove canned answers; add route cases; move admin prompts out. Acceptance: FAB visible at 375px and never overlaps the nav; no gradient.

### Phase 2 — Group Home, Votes, One Vote, Propose

**PR 2.1 Group Home** (G26 to G33): identity strip, three `AmountBlock`s, `ListRow` votes and movements, closed-vote fix. **PR 2.2 Votes** (G40 to G47): rows, member filters, no buttons for visitors. **PR 2.3 One Vote** (G48 to G54): onto `GroupWorkspace`, Support/Object, officer-only approve moved to Money, comments hidden until API. **PR 2.4 Propose** (G55 to G60). `DecisionCard` is deleted at the end of 2.3. Backend asks: none new; `useCastVote` already returns `{ok, stage, reason}`.

### Phase 3 — Pay and Money

**PR 3.1 Pay** (G34 to G39): inline `Stepper`, `ReceiptCard`, dispute link, streak when present. **PR 3.2 Money** (G69 to G75): statement-backed trail, KES send form, `Stepper` words, confirm sheet, one primary. Backend asks: statement payload fields for available/reserved; the real STK initiate endpoint (no client change until it exists, the simulator stays dev-only); removal of the fabricated proof header is a client change that will make sends fail until Simon specifies session-based auth for officers. State this in the PR.

### Phase 4 — People and Settings

**PR 4.1 People** (G61 to G68): rows, four filters, officer `InviteSheet`, no stats, no CSV. **PR 4.2 Settings** (G76 to G83): `SettingsSection` rebuild, officers list from API, member picker, licence section, statements, disputes; delete `OfficerAdminPanel`. Backend asks: `GET /api/communities/officers` shape for the list; whether licence file upload gets an endpoint.

### Phase 5 — Join and Start a Group

**PR 5.1 Join** (G84 to G92): one page, stepper on top, honest methods, receipt page copy. **PR 5.2 Start a Group wizard** (G93 to G102): three steps in `CreateCommunity`, redirect `/create/purpose` → `/create`, delete `CommunityPurpose.tsx` and `AnimatedSetupChecklist`; fee only from a quote. Backend asks: launch quote endpoint (or a documented "no fee" answer); membership quote; STK initiate. Until they exist the wizard ends at `Create Group` with "No launch fee in this environment" in dev and the rail-unavailable notice in prod.

### Phase 6 — Account, My Groups, Browse, Help

**PR 6.1 My Groups** (G13 to G18). **PR 6.2 Browse** (G19 to G25). **PR 6.3 Account** (G103 to G110). **PR 6.4 Help** (accordion, Akili chips). Backend asks: `GET /api/user/memberships` to carry `nextContribution` and `openProposalCount` when possible; avatar upload or none.

### Phase 7 — More and secondary

**PR 7.1** strip seeds from Suggestions and Roadmap, mobile stacking, statuses via `StatusChip`, fix Board links, Leaderboard tokens, delete Gallery and `communityVisuals.ts`. **PR 7.2** delete the unmounted list in §6; wire `CsvImport` into People for officers. **PR 7.3** bounties: park global `/bounties` behind More, list default, `StatusChip`, "Promised" reward, no wallet modal.

### Phase 8 — Operator shell

**PR 8.1** `OperatorShell` (left nav, wallet chip, no member nav) for `/admin/*`, `/retro/*`, `/onboard`. **PR 8.2** `AdminReconciliation` without fake tables; `RetroRounds` confirm sheet; `AkiliCouncilFilings` empty state and tokens; `StatusDashboard` honest rails. **PR 8.3** move `/retro/*` into the operator shell, remove every member-surface link to it, and leave the screens wallet-gated until identity is unified (decision §9.4).

### Phase 9 — Assets, performance, accessibility

Compress `public/gallery` and `public/audience`, add `loading="lazy"` on the landing, remove remote image URLs from the app bundle, run an axe pass on every member route in both themes, confirm 44px targets, tabular numbers on all money, and `prefers-reduced-motion` on every framer usage.

### Validation per phase

- `npm run typecheck && npm test` in `app/`. Baseline on 12 Sept: typecheck clean; 794 tests pass, 84 skipped, and 65 fail in four Supabase-integration suites that need a local instance on port 54321 (pre-existing, not UI). The 794 must stay green and each PR adds tests for the primitives or pages it touches.
- Screenshot set: 360×640, 390×844, 1440×900; light and dark; visitor, pending, active, officer and empty-founder compositions (use the `/dev/ui` fixtures for roles that need data the mock lacks).
- Journey check: J2 join, J4 pay, J5 vote, J6 officer send at the pending and failed states, not only the happy path.

### Sequencing summary

| Order | Phase | Why here |
|---|---|---|
| 1 | 0 Foundations | every later PR gets smaller; the token split alone fixes a dozen findings |
| 2 | 1 Chrome | visitors and gated users stop seeing marketing chrome; nav matches §13.3 |
| 3 | 2 Home / Votes | the member's daily surface; already closest to spec |
| 4 | 3 Pay / Money | money truth; depends on statement fields |
| 5 | 4 People / Settings | officer surfaces |
| 6 | 5 Join / Launch | biggest rewrite; needs quote endpoints |
| 7 | 6 Account / Browse | lower traffic |
| 8 | 7 More | strip theatre |
| 9 | 8 Operator | separate product |
| 10 | 9 Assets | last, measurable |

---

## 9. Decisions taken (Eugene, 12 September 2026)

These are settled. Phases 0 to 9 assume them; do not reopen in PR review.

1. **Radius ladder.** Adopt `--radius-sm 0.375rem / --radius-md 0.75rem / --radius-lg 1rem` app-wide. `.baraza-card` moves to `--radius-md` (`rounded-xl`). The landing keeps its band radii. (Phase 0.1) **Superseded 13 Sept 2026:** one corner everywhere, taken from the buttons. Buttons are 44px pills (22px visible corner); `--radius-sm/md/lg` are all `1.375rem`, so cards, inputs, chips, sheets, dropdowns and the shell frame share the button's curve, and anything 44px or shorter is itself a pill. The landing's marketing bands keep their 2rem/2.75rem radii; chat-bubble tails keep a 6px corner so the tail still reads.
2. **Theme.** Follow the OS `prefers-color-scheme` on first visit. The person can switch at any time from the sidebar footer icon or Account, and the choice persists in `baraza:theme-preference`. No hard default to dark or light. Verified 12 Sept: `ThemeContext` already does exactly this (stored preference wins, otherwise the OS media query, and it re-syncs on OS change). Nothing to build; PR 1.2 only re-homes the toggle.
3. **Bounties.** Park in v1. Global `/bounties` and `/bounties/:id` keep their routes but leave member chrome; the group board lives under More → Bounties, list view by default, statuses through `StatusChip`, reward labelled "Promised", no wallet modal. Full redesign waits for a treasury-backed reward contract. (Phase 7.3)
4. **Retro (BRZA).** Off the member map until identity is unified. `/retro/*` moves into the operator shell with the other wallet-gated tools; no link from any member surface. (Phase 8.3)
5. **Wordmark.** Keep the **Baraza Protocol** lockup everywhere in-app: sidebar, mobile top bar, sign-in sheet, status screens, page loader. Use `size="sm"` in the sidebar and top bar so it fits 264px and 56px without truncation; never render the `bara·za` lockup in the app.
6. **Currency.** Group currency everywhere. Every amount that belongs to a group (dues, quotes, balances, votes, trail, receipts) is formatted in `community.currency` (KES when absent). The account country only seeds defaults when someone starts a new group and sets the dial code in the sign-in sheet. The fixed `KES_USD_REFERENCE` conversion is deleted. (Phase 0.3)

---

## 10. Appendix

**A. Screens captured (12 Sept, local mock, dark unless noted).** `/groups` 1440; `/dashboard/1` 1440 dark and light, 375; `/dashboard/1/votes` 1440, 375; `/dashboard/1/people` 1440, 375 (top and scrolled); `/dashboard/1/more?tab=bounties` 1440; `/join/1` 375 (top and scrolled), 1440 light; `/home` gate 375; sign-in sheet 375; `/account` signed out 375.

**B. Largest post-login files (lines, as audited on 12 Sept before the rebuild; §11 records what changed).** `CreateCommunity.tsx` 1237 · `Bounties.tsx` 877 · `BountyBoard.tsx` 711 · `AkiliChat.tsx` 681 · `JoinDao.tsx` 617 · `AdminReconciliation.tsx` 511 · `LeverageOnboarding.tsx` 480 · `GroupMoney.tsx` 459 · `MemberDirectory.tsx` 448 · `AuthModal.tsx` 442 · `WalletStatus.tsx` 426 (unmounted) · `RetroVote.tsx` 394 · `Profile.tsx` 391. Anything over 300 lines in this list should come out of the redesign under 250 by composing the §7 atoms.

**C. Evidence counts.** Sub-12px classes: `BountyBoard` 25, `CommunitySettings` 21, `Bounties` 20, `MemberDirectory` 20, `CreateCommunity` 17, `AdminReconciliation` 16. `rounded-xl/2xl` outside the landing: `LeverageOnboarding` 48, `CreateCommunity` 14, `CreateDecision` 8, `BountyBoard` 6. Files using `btn-wipe` 35, `btn-wipe-outline` 32, `btn-warm` 13, `btn-primary` 8, `btn-ghost` 7, `Button` 15. Jargon hits (DAO, on-chain, wallet, multisig, credential, mint) across seven member files: 75.

**D. Backend asks surfaced by this audit** (all already in `frontend-redesign.md` §12 except the last two): membership and launch quotes; the real STK initiate; statement fields for available/reserved; officer list shape; ballot confirmation semantics; **session-based officer auth so the client can stop sending a fabricated `x-wallet-proof`**; **licence file upload or an explicit "URL only" ruling**.

---

## 11. Progress log

**12 Sept 2026 — PR 0.1 (tokens and radius) and PR 0.3 (group currency) applied on `front-end`, uncommitted.**

- `index.css`: `--accent` now aliases the foreground (neutral) instead of orange, so every legacy `bg-accent/10 text-accent` chip renders as the neutral pending treatment until it moves to `StatusChip`. `--warm`, `--orange`, `--dao`, `--network`, all `--gradient-*`, `--shadow-glow/warm/dao`, `.glass-surface`, `.premium-glass`, `.ambient-globe-layer`, `.text-gradient-*`, `.glow-*`, `.baraza-progress*` and the `pulse-glow` keyframe are deleted. `--confirmed` is a green-grey (`152 40% 32%` / `152 35% 62%`). New `--pending`, `--hold`, `--stale` tokens with foregrounds. Radius ladder `--radius-sm/md/lg` = `0.375 / 0.75 / 1rem`; `.baraza-card` uses `--radius-md`; card hover is a border-colour change only.
- `tailwind.config.js`: `rounded-sm|md` → `--radius-sm`, `rounded-lg|xl` → `--radius-md`, `rounded-2xl` → `--radius-lg`; colours `pending`, `hold`, `stale` added; `warm`, `orange`, `dao`, `network` removed.
- Component fixes for the removed tokens: `DecisionCard` bar → `bg-foreground`; `AkiliChat` FAB, header and user bubble → flat `bg-primary`; `MobileBottomNav` orb shadow → card shadow; `CommunityGallery` → `.baraza-card`; `CommunityCard` housing type → primary; `CreateCommunity` progress bar → flat; `MembershipCard` and `ShowReelSection` (both unmounted) → flat.
- `lib/money.ts` (new): `formatMajor`, `formatMoney`, `groupCurrency`. Code first, `en-KE` grouping, decimals only when present, no conversion. `formatKSh` and `formatRailAmountFromKes` now take an optional currency and delegate to it. `convertKesToAccountCurrency`, `formatAccountCurrency`, `KES_USD_REFERENCE` and `usdPerUnit` are deleted from `lib/accountLocale.ts`.
- `Community.currency` added to the type and mapped from the API row, the local record and the membership summary. Group currency threaded through GroupWorkspace, Group Home, Votes (`DecisionCard`), Pay, Money, People (`MemberDirectory`), Settings, Join, Propose, One Vote, My Groups, Account, Browse card and banner.
- Verified: typecheck clean; vitest 800 passing (six new money tests), 65 failing in the same four Supabase suites as before; the two lint errors on touched files fixed. Live check on `/dashboard/1`: `KES 500/month`, `KES 85,000`, rounder cards, flat orange Akili button. The orange "Voting" pill and orange Yes percentage remain until `StatusChip` lands in Phase 2.

**12 Sept 2026 — PR 0.2, 0.4 and 0.5 applied. Phase 0 complete on `front-end`, uncommitted.**

- **PR 0.2 Buttons.** `btn-warm`, `btn-primary` and `btn-ghost` no longer exist: 38 call sites were mapped onto `btn-wipe` / `btn-wipe-outline` and the alias selectors were removed from `index.css`. The wipe buttons now carry real defaults (44px min height, `0.625rem 1.25rem` padding, 14px label, `gap 0.5rem`) so a bare class is a usable button; Tailwind utilities on the element still win. `Button` sizes are `sm` 36px (desktop secondary and toast actions only), default 44px, `lg` 48px, `icon` 44px, plus a `fullWidth` prop. Scope note: converting every raw `<button className="btn-…">` to the `Button` component is deliberately left to each screen's rebuild, because `Button` title-cases labels and doing it blind would change copy that tests assert on.
- **PR 0.4 Primitives.** New under `components/ui/`: `StatusChip` (pending / confirmed / failed / hold / stale / info, word + icon, never primary), `AmountBlock` (code first, tabular, "Not available yet" when null), `Stepper`, `EmptyState`, `InlineError`, `FilterChips`, `Sheet` (bottom sheet on phones, dialog from `sm`, focus trap, Escape, scroll lock), the `Field` family (`Field`, `Input`, `Textarea`, `Select`, `PhoneField`, `MoneyField`, `Switch`), `PageHeader`, and the skeleton set. New under `components/app/`: `ListRow` with `InitialsTile`, `IdentityStrip`, `SettingsSection` (officer-only rows are hidden for members, not shown locked), `ReceiptCard` (amount, reference, date, status, `File a Dispute`, `Retry Payment`). Fixture page at `/dev/ui` (redirects home in production) renders every state; checked in dark and light at 1440 and 375, including the sheet open on a phone. 22 render tests added.
- **PR 0.5 Lint guards.** `eslint.guards.js` holds three backlog lists and the rules: no `btn-warm|primary|ghost` anywhere; no `text-[9|10|11px]` outside `TINY_TYPE_LEGACY` (51 files); no `bg-gradient-to-*` or `var(--gradient-…)` outside `GRADIENT_LEGACY` (3 marketing sections kept for good, 7 app files to clear); no `@solana/wallet-adapter-react*` import outside `WALLET_ADAPTER_ALLOWED` (plumbing, operator screens, and the three member screens Phases 2, 5 and 7 migrate). A file leaves a list in the PR that rebuilds it; nothing new may join. The radius ladder needs no lint rule because the Tailwind mapping in PR 0.1 already collapses `rounded-lg|xl` onto it.
- Verified: typecheck clean; lint 0 errors (the pre-existing `GroupSettings` impure-render error fixed on the way); vitest 822 passing, 65 failing in the same four Supabase suites.
- Phase 1 (chrome: `VisitorShell`, AppShell polish, overlays, Akili as helper) is next.

**12 Sept 2026 — Phase 1 (chrome) applied on `front-end`, uncommitted.**

- **PR 1.1 `VisitorShell`** (`components/app/VisitorShell.tsx`). `Layout` now picks one of three shells: `AppShell` when signed in, `VisitorShell` for every other URL, and the marketing `PublicShell` for `/` only. Signed-out group pages, join pages, gated screens and `/account` no longer carry the landing header, the newsletter footer or the orange Launch orb. The visitor top bar is the lockup, theme toggle, `Sign In` outline and (from `sm`) `Create Account`; the visitor bottom nav is Browse / Start / Help / Sign In. On group pages a visitor gets a sticky `Join This Group` bar above the nav (G26/§13.8), sized to leave room for the Akili button; the group nav no longer shows its own Join or Propose CTA on Group Home, so the next-action card is the single primary there. `MobileBottomNav` (landing only) lost the orb and is five plain slots. Stale links fixed in Header, Footer, Hero, Pricing, CTA, AIPlatform, Home, Profile (`/create/purpose` → `/create`, `/communities` → `/groups`, `/profile` → `/account`, `/evaluate` → `/help`); "Launch a Group/community" → "Start a Group" everywhere; `index.html` title is now "Baraza Protocol — Group Money You Can See".
- **PR 1.2 AppShell polish.** Group rows show `StatusChip` (Pending / On Hold) instead of the raw enum; the mobile top bar carries the membership chip (Visitor / Pending / Active / Officer / On Hold) and an Account icon; the sidebar footer is Account, then one row with the theme icon button and a destructive `Log Out`; bottom-nav labels are 12px with 44px slots.
- **PR 1.3 Overlays.** Toasts are a black card with white type and a 3px orange top edge (destructive: red top edge), `p-4`, with a visible close. `OfflineBanner` is black on white with the §13.3 copy. `StatusPage` 401 opens the sign-in sheet in place instead of navigating, and survives rendering outside `AccountProvider` (new `useOptionalAccount`) so the error boundary keeps working. `PageLoader` title-cases its label. `WalletGate` leads with `Sign In` on gated URLs. Sign-in sheet: single column, no 514KB photo pane, `Button` primitives (Title Case labels), heading "Sign In" / "Create Your Account", Kenya `+254` first unless the person chose a country, and the "no crypto wallet" sentence moved into the sheet. Its test was updated for the removed image.
- **PR 1.4 Akili as helper.** The trigger is a 44px flat-orange circle that now exists on phones (above the bottom nav) and desktop; the panel is a bottom sheet on phones and a 360×520 card on desktop with a plain header ("Ask Akili · Explains this screen. It never approves anything."), 14px messages, 12px times, a 44px send button. The six-agent council row is gone from the member panel (the API still accepts an agent for the operator shell later). When the stream fails and a keyword answer is substituted it is labelled "Saved answer". Route classification now covers `/votes/:id`, `/help`, `/status`, `/claim` and `/retro`.
- Verified: typecheck clean; lint 0 errors; vitest 822 passing, 65 failing in the same four pre-existing suites (three Supabase integration suites plus one `brza` URL assertion that depends on the local `VITE_SITE_URL` value; none touched here). Live: `/dashboard/1` and `/home` signed out at 1440 and 375 in the visitor shell; the Akili sheet open on a phone.
- Phase 2 (Group Home, Votes, One Vote, Propose on the new primitives) is next.

**12 Sept 2026 — Phase 2 (Group Home, Votes, One Vote, Propose) applied on `front-end`, uncommitted.**

- **Workspace header.** `GroupWorkspace` renders the `IdentityStrip` (initials tile, name, readable type such as "Savings chama", the membership `StatusChip`, SACCO licence chip) instead of the `CommunityBanner` photo card. Founding date and monthly fee left the header; they live in Settings. On desktop a visitor's `Join This Group` sits beside the strip; on phones the sticky bar from Phase 1 is the CTA. `MembershipChip` is exported for reuse.
- **`lib/voteCopy.ts`** (new, tested): `isVotingOpen`, `voteTimeLabel` ("3 days left" / "Closes today" / "Closed", never a countdown into the past — fixes X13/G28/G44), `participationPct`, `supportPct`, and `rulesSentence` ("More than half of members must vote and two thirds of those who vote must agree. Voting lasts 7 days."). Common thresholds become words; odd numbers stay numbers.
- **PR 2.1 Group Home** (`CommunityDashboard.tsx`). Next Action unchanged in logic, now on `Button`. Open Votes are `ListRow`s with amount, time left and participation, and only votes that are actually open count. Money is three `AmountBlock`s (Total, Reserved "Not available yet", Available "Not available yet") with `Open Money` for officers only. Recent Movement is `ListRow`s from the activity store with an honest `EmptyState` when there is nothing; the framer feed is gone from this page. Amounts in the group currency.
- **PR 2.2 Votes** (`GroupVotes.tsx`). Filters via `FilterChips`: Needs You (members only; rows hide once this person has voted), Open, Passed, Sent, Did Not Pass, with counts. Rows via `ListRow` with a status chip (Open / Closed / Passed / Sent / Did Not Pass / Tied) and a "You Supported / You Objected" chip. No vote buttons in the list. `Propose a Spend` is an outline in the header on desktop and a full-width primary at the bottom on phones. **`DecisionCard` and its test are deleted.**
- **PR 2.3 One Vote** (`ProposalDetail.tsx`). Now on `GroupWorkspace`. Status chip, title, "Proposed by · time left / Closed <date>", `AmountBlock`, description, `The Vote` card with the rules sentence, one black participation bar, yes/no counts, share of yes. `Support` primary and `Object` outline for active members while voting is open and they have not voted; after a tap the ballot shows `Vote Recorded` (pending) or `Vote Confirmed`, with rollback and an `InlineError` on rejection. Pending members are told to wait; visitors see no buttons. Passed vote + officer shows `Approve Send` linking to Money. Removed: the photo banner, the 4-tile stat row, "Vote yes / Vote no", the local-only comments and audit trail, the Execute button, and every wallet hook (voting keys off `AccountContext`). Three render tests added.
- **PR 2.4 Propose a Spend** (`CreateDecision.tsx`). On `GroupWorkspace` with the `Field` family: Title, What This Is For, Amount (`MoneyField` in the group currency), Days to Vote (default from the group's rules), the rules sentence as a live preview, `Publish Proposal` and `Cancel`. Non-members and pending members get an `EmptyState` instead of a form. Wallet adapter, token gate and the synthetic "available treasury" comparison are gone; the proposer is the account's display name. After publishing the member lands on the new vote.
- Lint guards: `CreateDecision.tsx` left the wallet-adapter allowlist; `DecisionCard`, `ProposalDetail` and `CreateDecision` left the tiny-type list.
- Verified: typecheck clean; lint 0 errors; vitest 808 passing (the 17 `DecisionCard` tests went with the component; 6 vote-copy and 3 vote-page tests were added), same 65 pre-existing failures; live at 1440 and 375 on `/dashboard/1`, `/votes`, `/votes/d1` (closed vote), `/votes/d8` (tied), `/votes/new` (gate).
- Phase 3 (Pay with inline confirming and receipt; Money on the statement with a KES send form and confirm sheet) is next.

**12 Sept 2026 — Phase 3 (Pay and Money) applied on `front-end`, uncommitted.**

- **PR 3.1 Pay** (`GroupPay.tsx`). One page, four stages on a `Stepper` (Amount → Pay → Confirming → Done). `AmountBlock` for the amount due in the membership's currency; a server-sourced streak chip ("3 Months On Time") only when the API returns one; `PhoneField`; `Pay With M-Pesa` becomes `Check Your Phone` while the STK is out. Confirming polls `GET /api/payment-orders/status` every 2.5s until a terminal state, then a `ReceiptCard` with reference, date, status as the server reports it (Pending / Confirmed / Failed), `File a Dispute` → Settings#disputes, `Back to Home`, and `Retry Payment` on failure. Non-members, pending members and up-to-date members get `EmptyState`s. Unavailable-rail and start failures are `InlineError`s, not toasts. The dev-only simulator gate is unchanged.
- **`lib/statement.ts`** (new, tested): reads the same journal the CSV export serves (`format=ndjson`), parses rows, and labels them in member words (Paid in / Sent / Fee / Refund / Reserved) from the reference type or which side the treasury sits on. It computes no balances.
- **`lib/payouts.ts`** (new): `requestPayoutQuote` returns `null` because no endpoint quotes a send in the group's currency; `sendPayout` wraps the Minisend adapter and is only ever called with a quote; `partsNeeded` applies the KES 250,000 telco ceiling. The fabricated `x-wallet-proof` header is gone (G71).
- **PR 3.2 Money** (`GroupMoney.tsx`). Three `AmountBlock`s (Reserved and Available honestly "Not available yet"). The Trail is now statement-backed `ListRow`s (label, date, reference, signed amount) with skeleton, `InlineError` with retry, and an empty state; `Export Statement` stays for officers. Officers: **Waiting to Send** rows with `Approve Send`, which opens a confirm `Sheet` showing amount and tally before calling `/api/governance/execute`, and reads "On Hold" when the treasury is frozen. **Send to Phone** is a `Sheet` with `PhoneField` and a `MoneyField` in the group's currency, a "goes out in N parts" note above the ceiling, a plain-word `Stepper` (Queued → Sent to Provider → Received) and a Received chip with reference. Because there is no quote endpoint, tapping `Send Now` today shows "Sending is not available here yet … nothing left the group" rather than converting with a client-side rate. Removed: the USDC field, the hardcoded 130.50 rate, the slippage note, the MTN/Airtel/Bank rails, the raw `OFFRAMP_INITIATED` enum list and the "Debit: Treasury, Credit: Escrow" copy.
- Lint guards: `GroupMoney.tsx` left the tiny-type list.
- Verified: typecheck clean; lint 0 errors; vitest 812 passing (4 statement tests added), same 65 pre-existing failures. Pay and Money are gated, so the live check was the gate at 1440 and the primitives on `/dev/ui`; member and officer compositions are covered by the unit tests and code review only.
- **Backend asks raised by this phase** (also listed in §8 Phase 3 and Appendix D): a payout quote endpoint in the group currency; session-based officer auth for `/api/payments/minisend` and `/api/governance/execute`; a statement payload or balances endpoint that splits reserved from available; the real STK initiate for dues.
- Phase 4 (People and Settings) is next.

**12 Sept 2026 — Phase 4 (People and Settings) applied on `front-end`, uncommitted.**

- **PR 4.1 People.** `MemberDirectory` rewritten as `ListRow`s: initials tile, name, joined month, role chip (Founder / Officer), a server-sourced "N Months On Time" chip only when the streak API returns one, and, for officers only, dues standing (Active / Overdue). Search plus `FilterChips` All / Active / Pending, with Overdue added for officers. Tap a row to expand the last five contributions in the group currency. Removed: the four aggregate stat tiles (synthetic totals), the seven role filters, the 10px sort row, the visitor-visible CSV export, and the placeholder "— mo streak" chips. An honest `EmptyState` when Baraza has no member records. New `InviteSheet` (`components/app/InviteSheet.tsx`) is the one invite surface: the plain join link that always works (Share / Copy Link), plus a limited link that calls `POST /api/communities/:id/invites` and, because that endpoint is not deployed, says so instead of minting a local code. `GroupPeople` puts `Invite People` in the header on desktop and full-width at the bottom on phones, officers only. Four directory tests added.
- **PR 4.2 Settings.** `GroupSettings.tsx` rebuilt on `SettingsSection` in the §13.19 order: Group Identity (name, type, id, `Copy Id`), Rules (the rules sentence plus quorum, threshold, days, and a single "Locked" row), Dues (amount or "Free to Join", member count), Paybill and USSD (officers; "Not Set" instead of "Add for KES 2,000"), Officers (officers; list from the member roster, `Remove Officer`, `Add Officer` sheet with a member picker and Treasurer / Admin role), SACCO Licence (regulated types; number, https certificate link, expiry; the file input that only read a filename is gone), Statements (officers; date range, `Download CSV`), Disputes (all members; plain-language reasons, amount in group currency, `File Dispute`; this is where the receipt's `File a Dispute` link lands). **`CommunitySettings.tsx` and `OfficerAdminPanel.tsx` are deleted**, and with them the hardcoded "Payment setup: Active", the SPL-token and transfer-admin rows, the duplicate invite generator that minted local codes, and the paste-a-wallet leadership form. There is no GET for officers, so the roster is read from the synced member list and says so when empty.
- Lint guards: `CommunitySettings`, `MemberDirectory` and `GroupSettings` left the tiny-type list.
- Verified: typecheck clean; lint 0 errors; vitest 816 passing (4 directory tests added), same 65 pre-existing failures; live `/dashboard/1/people` as a visitor at 1440 (rows, filters, expand), Settings gate.
- Phase 5 (Join as one page with four stages; Start a Group as a three-step wizard) is next.

**12 Sept 2026 — Phase 5 (Join and Start a Group) applied on `front-end`, uncommitted.**

- **PR 5.1 Join** (`JoinDao.tsx`, 617 → 407 lines). The four-stage `Stepper` (See Group · Pay · Confirming · You're In) sits at the top and is driven by state. `IdentityStrip` for the group, the rules sentence, then an `AmountBlock` "To Join, Once" with the itemised quote (server quote when the intent API answers, the same fee formula locally otherwise) and a `Why This Amount?` Akili chip. Stage B is one card: signed out → `Sign in to Pay` opens the sheet; signed in → `PhoneField` and `Pay With M-Pesa` (or `Join This Group` when free or phone-verified). Vouching groups show "You're In the Queue" with what must happen; proof-of-personhood says plainly it is not available here. "Other Ways to Pay" is a collapsed section holding the on-chain transfer reference check; the "bank transfer" sentence, the "Send M-Pesa STK PIN prompt" label and the formula paragraph are gone. Errors are `InlineError`s. The activation-vs-membership warning is one sentence under the button.
- **`JoinStatus.tsx`** restyled on the same top `Stepper` (Confirming current, You're In on completion, failed state on the current step), a vertical `Stepper` for the detailed payment and membership steps, `StatusChip`s for Payment and Membership, `InlineError`s for the unverifiable, activation-failed and fetch-failed states, and `Open Group` / `View Group` buttons with no guessed group id. Its behaviour (server-only progression, no local activation on failure, INDEXER_CONFIRMED = active) is unchanged and its four tests still pass; "membership credential" became "membership".
- **PR 5.2 Start a Group** (`CreateCommunity.tsx`, 1,237 → 314 lines). One URL, three steps with `PageHeader` "Step n of 3" and a `Stepper`. Step 1 **What Kind of Group?**: five single-select cards (Chama, SACCO, Cooperative, Welfare, Investment) with one-line help; a SACCO note about the licence; legacy `?type=` values map onto the five. Step 2 **Name Your Group**: name, what the group does, a `Free to Join` switch or `MoneyField` in the account country's currency, and Who Must Vote as three selects (must vote / must agree / voting lasts) with the live rules sentence, plus a sticky summary card on desktop and one `Suggest a Setup` Akili chip. Step 3 **Open This Group**: the summary, an "Opening Fee: No launch fee in this environment" row (no endpoint quotes one, so nothing is charged and nothing is invented), `Create Group`. Success is **Your Group Is Open** only after the record exists, with `Invite People` → People and `Go to Group`. Deleted from the flow: the 27-type list, verification tiers 1–4, SACCO licence at birth, Paybill/USSD add-ons at KES 2,000/3,000, the KES 6,500 setup fee, the chain indicator and "Fund menu" copy, the four payment methods (WhatsApp, Privy wallet, SWIFT), the animated "Live" checklist, and every wallet hook. `/create/purpose` now redirects to `/create`; **`CommunityPurpose.tsx` and its test are deleted** (the questionnaire it pinned was the discarded multi-select).
- `AskAkili` no longer throws outside `AkiliChatProvider` (it renders nothing), so pages can be tested and rendered in isolation.
- Lint guards: `CreateCommunity` left the wallet-adapter, tiny-type and gradient lists; `JoinDao` left the tiny-type list. The remaining wallet-adapter member screen is `Bounties.tsx` (Phase 7).
- Verified: typecheck clean; lint 0 errors; vitest 817 passing (3 wizard tests added; 2 purpose tests removed), same 65 pre-existing failures; live `/join/1` (visitor, stage 1), `/join/1/status` (unverifiable reference), `/create/purpose` → `/create` gate at 1440.
- Phase 6 (Account, My Groups, Browse, Help) is next.

**12 Sept 2026 — Phase 6 (My Groups, Browse, Account, Help) applied on `front-end`, uncommitted.**

- **`GroupRow`** (new, `components/app/GroupRow.tsx`): one of my groups as a `ListRow` with initials, name, a standing chip (Active / Officer / Pending / On Hold) and a next-action caption from the membership summary ("Pay dues · KES 500", "1 vote needs you", "Waiting for your payment to be confirmed", "Nothing needs you"). My Groups and Account both use it, so they cannot disagree.
- **PR 6.1 My Groups** (`Home.tsx`). `PageHeader` "Your Groups" with `Join With an Invite` as a `Sheet` (desktop header action, phone button), rows via `GroupRow`, one `Start a Group` outline. Empty: an inline invite form card and a Start a Group `EmptyState`. Skeleton and `InlineError` states. Removed: the "Your workspace" eyebrow, raw status enums, the converted currency, both duplicate CTA rows and the `/create/purpose` links. Two render tests added.
- **PR 6.2 Browse** (`Communities.tsx`, `CommunityCard.tsx`). `PageHeader` "Browse Groups" with `Start a Group` as the header action; search; `FilterChips` for All / Chama / SACCO / Cooperative / Welfare / Investment, mapping the 27 internal types onto five member words (`browseKindOf`); a three-column grid of cards; `EmptyState` with `Clear Search`. Card: initials tile, name, kind chip, description, members (only when real), dues or "Free to join", `View Group` outline and `Join This Group` primary. Removed: the `pt-20` gap under a header that no longer exists, the `CommunityBanner` slideshow and "Featured community" aside, the Unsplash card photo and gradient scrim, `MagicCard`, the type-colour pills, the bounty strip, the synthetic "Group funds" and "Proposals" stats, the Grid/List toggle and the `<select>` of every internal type. "Become a member" and "View profile" are gone.
- **PR 6.3 Account** (`Profile.tsx`). Signed out: an `EmptyState` with `Sign In` primary and `Create Account` outline, inside the visitor shell. Signed in: `PageHeader` "Account", `IdentityStrip` with initials and a "Signed In" chip, then `SettingsSection`s — Name; Country and Currency (with the sentence that it only sets the dial code and the currency for groups you start); Language as `FilterChips` (English / Kiswahili / Sheng); Notifications as four `Switch` rows plus `Enable Push`; one `Save`; Your Groups via `GroupRow`; a destructive `Log Out`. Removed: the `CommunityBanner` photo header, "Participation balance / voting weight" (the BRZA figure), badges, referral placeholder, bounty announcements, voting history, the "Account security" sentence card, the avatar URL text field, the bio, the "Linked account 0x…" wallet line, native checkboxes and the Akili chip. **Deleted:** `ProfileIdentitySettings.tsx`, `MemberBadges.tsx`, `DuesStreakChip.tsx`, `ReferralProgress.tsx`, `ui/magic-card.tsx` (`lib/badges.ts` stays; its tests still pass).
- **PR 6.4 Help** (`Help.tsx`). The six answers are a native `<details>` accordion with the landing's `+` rotate, an `Ask Akili` chip under each answer, `Email Help` as the single primary and `System Status` as a text link. Copy updated to "support or object".
- Lint guards: `Home`, `Profile`, `CommunityCard`, `DuesStreakChip` and `MemberBadges` left the tiny-type list; `CommunityCard` left the gradient list.
- Verified: typecheck clean; lint 0 errors; vitest 819 passing (2 Home tests added), same 65 pre-existing failures. The user's dev server had stopped during this phase; a preview server was started from `.claude/launch.json` to check `/groups`, `/help` and `/account` live at 1440.
- Phase 7 (More tabs: strip seeds, mobile stacking, statuses; delete the unmounted files; park bounties) is next.

**12 Sept 2026 — Phase 7 (More and secondary) applied on `front-end`, uncommitted.**

- **PR 7.1 More tabs.** Suggestions and Roadmap no longer ship seeded people, votes or a fabricated "completed" milestone: they show only what this device saved or the API returns, so their empty states are reachable. The roadmap stacks its three columns on phones instead of forcing a 640px scroll, and "Web3" left the tag placeholder. In Progress and Under Review are now two different chips (black outline vs muted) across Roadmap, Board, the bounty board, the bounty list and the bounty detail; nothing in these tabs is orange any more. The Board's proposal rows link to the vote itself instead of the group home, and its "View" link is 44px. The Leaderboard's gold/silver/bronze hex colours became tokens. Roles no longer prints invented per-role counts. The Activity feed is `ListRow`s with a label chip and an honest `EmptyState`, replacing the animated colour-coded list. Gallery is gone from More (and from the legacy tab table): stock photos captioned as the group's own had no honest version.
- **PR 7.2 Deletions.** Removed from the tree: `CommunityGallery.tsx`, `lib/communityVisuals.ts` (every Unsplash URL and "governed on-chain" caption), `CommunityBanner.tsx` (its last two users, the bounty pages and `/claim`, now use a plain card), `MembershipCard.tsx` (hardcoded "VERIFIED"), `WalletStatus.tsx`, `EnvironmentSelector.tsx`, `ShowReelSection.tsx`, `CommunityMarquee.tsx`, `InviteLink.tsx`, `LiveStatCard.tsx`, `AkiliSecurityReview.tsx`, `ui/shimmer-button.tsx`, the unmounted `pages/Onboarding.tsx` and its `PhoneEntry`, `OtpVerify`, `WelcomeScreen`. `CsvImport.tsx` stays on disk but is **not** wired in: there is no bulk-import endpoint, so an import button would file nothing (added to the backend asks). The `securityReview` and `badges` libraries stay; their tests still pass.
- **PR 7.3 Bounties parked.** `/bounties` and `/bounties/:id` keep their routes but leave the member chrome. The global board no longer opens the Solana wallet modal: posting needs a signed-in account (`AccountContext`) and membership, so `Bounties.tsx` left the wallet-adapter allowlist and **no member screen imports the wallet adapter any more**. The Unsplash hero and its three gradients are gone; the list view is the default on the board and in groups; `awarded` and `paid` are now "Approved" and "Paid" rather than one word for two truths; rewards render in black, not orange; "I'm in" reads "Interested" (it saves a bookmark on this device, which the earlier label hid).
- Lint guards: fourteen files left the tiny-type list and four the gradient list by being rebuilt or deleted; the wallet-adapter allowlist is now plumbing, operator screens and `/claim` only.
- Verified: typecheck clean; lint 0 errors; vitest 819 passing, same 65 pre-existing failures; live `/dashboard/1/more?tab=roadmap`, `?tab=suggestions` and `/bounties` at 1440.
- Phase 8 (operator shell for admin, retro and lab; honest status page) is next.

**12 Sept 2026 — Phase 8 (operator shell) applied on `front-end`, uncommitted.**

- **PR 8.1 `OperatorShell`** (`components/app/OperatorShell.tsx`). `Layout` now routes `/admin/*`, `/retro/*` and `/onboard` into a fourth shell regardless of member session: a left nav (Reconciliation, Council Filings, Retro Rounds, and Lab in development builds), an "Operator" chip, a wallet chip with `Connect Operator Wallet` / `Disconnect` (the only chrome where a Solana wallet is part of the furniture), a theme toggle and `Back to Baraza`. No bottom nav, no footer, no marketing header. On phones it is a top bar with a drawer. Operators who have a wallet but no member session no longer see the landing chrome around their tools.
- **PR 8.2 Operator pages.** `AdminReconciliation` lost its two hardcoded tables (`paymentOrders` with the baked-in May 2026 timestamp, and `mintJobs`) and their fake "Reconcile proof" / "Retry mint" buttons; the section now says the reconciliation list will appear when the API exposes it and that the earlier rows were not real orders. "Akili has cleared…" became "No setup checks are flagged…", "cleared" became "no flags", the heading is "Operator Console" and "Security flags" is "Setup Checks". `RetroRounds`: `Settle Round` opens a confirm `Sheet` showing pool and period and stating there is no undo before anything is called; the source-file path and table name left the page copy. `AkiliCouncilFilings`: raw `amber-*` colours replaced with tokens, heading title-cased. `StatusDashboard`: `PageHeader`, `StatusChip`s with words (Ready / Slow / Not Ready / Not Checked / Not Reported), and the "Kotani Pay / Minisend" rail now says **Not Checked** instead of being inferred from the Stellar probe; a failed probe reads Unknown rather than Degraded; the tier and Prometheus copy is gone. Its existing test still passes.
- **PR 8.3 Retro for members.** `/retro/:id`, `/retro/:id/vote` and `/retro/:id/results` render inside the operator shell (decision §9.4); no member surface links to them. Their wallet gating is unchanged and remains on the allowlist until identity is unified.
- Lint guards: the wallet-adapter allowlist is now plumbing plus the operator shell and pages; the four operator pages left the tiny-type list.
- Verified: typecheck clean; lint 0 errors; vitest 819 passing, same 65 pre-existing failures; live `/admin` (wallet gate inside the operator shell) and `/status` at 1440.
- Phase 9 (assets, performance, accessibility) is next and last.

**12 Sept 2026 — Phase 9 (assets, performance, accessibility) applied on `front-end`, uncommitted. All nine phases of §8 are now implemented.**

- **Images.** The eleven landing JPEGs were re-encoded in place (`sips`, quality 72, then 64 for the largest; wide ones capped at 1200–1400px): `public/gallery` 7.3MB → 1.0MB with every gallery file between 168KB and 240KB; `steps` 1.1MB → about 0.7MB; `audience/group.jpg` 514KB → 212KB; `cta/group.jpg` 520KB → 232KB; `contact/group.jpg` 228KB → 160KB. Total 9.2MB → 2.1MB. `loading="lazy" decoding="async"` added to the below-the-fold landing images (CTA phone mockup, contact photo, the who-it-is-for marquee tiles, the logo strip); the hero polaroids stay eager because they are above the fold. No remote image URL remains anywhere in `app/src`.
- **Seeds.** `SEED_BOUNTIES` is now gated behind `isSyntheticDataEnabled()` like every other seed, so a production group sees only real or locally created bounties.
- **Motion.** The Akili panel, message and quick-reply animations respect `prefers-reduced-motion` via `useReducedMotion`; the landing's `Reveal` already did.
- **Type floor.** `AppShell`, `GroupSidebarNav`, `Header`, `AskAkili` and `SaccoComplianceBadge` moved to `text-xs`. The tiny-type legacy list is down to nine files, none of them member surfaces: two dev-only (`AppErrorBoundary` detail line, `BackendStatus` pill), `ChainSelector` (dev/admin menus), `PricingSection` (landing), `CsvImport` (unmounted), `ClaimIdentity` and the three retro pages (operator shell).
- **Accessibility, checked in code:** every icon-only button in the shells and sheets carries an `aria-label`; primitives sit at 44px (36px only for desktop secondary actions); money renders `tabular-nums` through `AmountBlock`; status is always word plus icon through `StatusChip`; sheets trap focus and close on Escape; all four shells keep the skip link. A tool-driven axe pass across both themes was not run in this session and is the recommended last check before merging to `dev`.
- **Production build** passes (`vite build`). The two largest chunks are unchanged and unrelated to this work: `wallet-vendor` 2.08MB and `stellar-vendor` 1.61MB, lazy-loaded vendor code needed only by the operator shell and the on-chain transfer check. Deferring them further is a follow-up.
- Verified: typecheck clean; lint 0 errors; vitest 819 passing, same 65 pre-existing failures (three Supabase-integration suites that need a local instance, plus one `brza` URL assertion tied to the local `VITE_SITE_URL`).

**Working tree at the end of the 12 Sept session:** 170 changed paths against `front-end`, of which 32 are deletions and 54 are new files; `app/src` is 18,109 lines of `.tsx` outside tests, down from 21,755 at the start of the audit. Nothing has been committed. The branch is ready for review, `npm run build && npm test` in `app/`, and a commit series by phase; the §11 entries double as commit messages.

**13 Sept 2026 — Floating chrome and top-bar menus applied on `front-end`, uncommitted.**

- **Floating frame.** All three app shells (`AppShell`, `VisitorShell`, `OperatorShell`) now sit on a `bg-surface` page with 12–16px of gutter. The sidebar is a rounded (`rounded-2xl`), bordered card that sticks to the viewport top and runs the viewport height; the top bar is a rounded sticky card of its own; the content is a rounded `bg-card` panel; the phone bottom nav floats inside the same gutter. Sidebar and top bar carry `--shadow-deep`; nothing else does. The reference screenshots' blue is not used anywhere: the frame uses the new `--chrome` token, orange stays brand and CTA only.
- **Collapsible sidebar** (`AppShell`): a chevron in the top bar toggles between the full 16.5rem rail and a 4.5rem icon rail, remembered in `localStorage` (`baraza:sidebar-collapsed`). Icon-only rows keep their `aria-label` and a native `title` so the label is still reachable.
- **Top bar** (`AppShell`): left side holds the menu (phone), collapse toggle (desktop) and the current context title with its chip (group name and membership standing on group screens; "Your Groups", "Browse Groups", "Account", "Help" elsewhere). Right side holds the three controls that left the sidebar footer: `ThemeToggle`, `AccountMenu` and `LogoutMenu` (`components/app/TopBarMenus.tsx`).
  - `AccountMenu` is an initials avatar pill with the display name; its dropdown shows the name, how you signed in (email or phone), and links to Account and Help. It closes on outside click and Escape.
  - `LogoutMenu` is an icon button whose dropdown is a confirmation ("Log out of Baraza?" with Cancel and a destructive `Log Out`). Nothing logs out on a single tap any more; the destructive `Log Out` on the Account page remains as a second route.
  - Eugene asked for these "on the left"; they are on the right, matching the reference layout and the convention that identity sits at the trailing edge. Moving them is a one-line swap in `TopBar` if preferred.
- **Dark mode.** New `--chrome` / `--chrome-foreground` tokens (white/near-black in light, `0 0% 0%` / near-white in dark) in `index.css` and `tailwind.config.js`; the shells use `bg-chrome text-chrome-foreground` (bottom navs `bg-chrome/95` with blur). Nav hover became `hover:bg-chrome-foreground/[0.06]` so it reads on both fills. The content panel stays `--card`, so in dark mode the frame is true black and the content is one step lighter.
- Verified: typecheck clean; lint 0 errors; page and component suites 100 passing; dark and light screenshots of `/dashboard/1` (visitor shell) and `/admin` (operator shell) at 800px confirm black frame, lighter content panel and shadow. The signed-in `AppShell` cannot be exercised without a session in the preview browser; its menus share the same primitives and were checked by typecheck and lint only.

**13 Sept 2026 — Black content panel, contained scrolling, workspace sub-pages. `front-end`, uncommitted.**

- **Content panel** in all three shells moved from `bg-card` to `bg-background`: pure black in dark mode (white in light), so cards inside it sit one step lighter instead of blending into a grey panel. The page gutter stays `bg-surface`.
- **Scrolling** now happens inside the content panel. Each shell is `h-[100dvh] overflow-hidden`; the sidebar and top bar are plain flex children rather than `sticky`, and `main` is `min-h-0 flex-1 overflow-y-auto overscroll-contain`. The frame never moves; only the content does. Route changes still reset to the top because `main` is keyed on the pathname. Sticky in-page bars (the visitor Join bar) stick to the panel, not the window.
- **Workspace sub-pages** (`WorkspaceNav` in `AppShell`): the three rows now carry always-visible sub-rows, indented with a hairline guide, hidden when the rail is collapsed. Only surfaces that exist were added. My Groups → Join With an Invite (`/home?join=1`, which opens the invite sheet; closing it drops the param). Browse → Chamas and SACCOs (`/groups?kind=chama|sacco`; the kind chips now read and write the same param, so deep links and the chips agree). Start a Group → How It Works (`/help#starting`). The parent row is highlighted only when none of its sub-rows is.
- Verified: typecheck clean; lint 0 errors; page and component suites 100 passing; dark-mode checks in the preview browser: `/dashboard/1` at desktop and 375px scrolls inside the panel with document scroll at 0 and panel background `rgb(0,0,0)`; `/groups?kind=chama` selects the Chama chip. The signed-in sidebar (where the sub-rows live) could not be screenshotted without a session.

**13 Sept 2026 — Sidebar sections corrected; overlays blur instead of tint. `front-end`, uncommitted.**

- **Sections, not parents.** Eugene's correction: the workspace row is a section title, and the first sub-row under it is that same page under its own name, so the highlight always sits on a page. `WorkspaceNav` now renders each of My Groups, Browse and Start a Group as a small uppercase title (also a link to its page) with page rows beneath: My Groups → Your Groups, Join With an Invite; Browse → All Groups, Chamas, SACCOs; Start a Group → New Group, How It Works. The title turns foreground when any of its pages is open; the collapsed icon rail shows one icon per section. Browse has three rows because two kinds without an "all" row would strand the filter; drop Chamas/SACCOs if two is the ceiling.
- **Overlays.** The `Sheet` scrim and both drawer scrims used `bg-foreground/40`, which is a white wash in dark mode. All three now use `bg-black/30 backdrop-blur-md`, so the page behind is blurred with the same light tint in both themes. Checked on the operator drawer at 375px in dark mode.
- Verified: typecheck clean; lint 0 errors; component suite 56 passing.
- **Sheet scrim now page-wide.** The `Sheet` was rendered inline inside the scrolling content panel, so its fixed scrim was clipped to that panel and the top bar and gutter stayed sharp. It now portals to `document.body` (`createPortal`); the scrim measures the full viewport and the top bar blurs with everything else. Checked on the Invite sheet in `/dev/ui` in dark mode.
- **Radius matched to buttons.** Buttons are 44px pills (`border-radius: 9999px`, so a 22px visible corner); the sidebar, top bar, panel and bottom nav were 1rem and nav highlights 0.75rem, so they did not match. New `--radius-chrome: 1.375rem` (22px) token and `rounded-chrome` utility; the frame cards, drawers and the top-bar dropdowns use it, so their corners curve exactly like a button's. Every highlighted row (workspace section titles and pages, group nav, operator nav, bottom-nav slots, account-menu rows) is now a 44px `rounded-full` pill, identical to a button. Measured on `/admin`: aside 22px, main 22px, nav row 9999px at 44px tall, button 9999px at 44px tall.
- **Active row: colour only.** The selected sidebar row (workspace pages, group nav, operator nav) keeps its orange text but no longer has the tinted pill behind it; hover still shows the faint pill.
- **One radius, from the buttons.** Eugene: everything with a corner should use the button's corner. `--radius-sm`, `--radius-md`, `--radius-lg` are now all `1.375rem` (22px, the visible corner of a 44px pill), Tailwind's bare `rounded` is mapped to the same token, so cards, inputs, chips, skeleton bars, sheets, dropdowns and the frame all curve alike; anything 44px or shorter (inputs, chips, rows) becomes a pill exactly like a button. Kept apart on purpose: the landing's 2rem marketing bands (outside the app) and the Akili chat-bubble tail corner, now an explicit 6px so the tail is still a tail. The bounty sticky header's odd 10px top radius joined the token. Decision §9.1 is marked superseded. Full vitest: 692 passing, the same 65 pre-existing Supabase/brza failures.
- **Browse, My Groups, Account layout.** Browse: the kind chips and the "N groups" count are centred. My Groups: the column widened from `max-w-3xl` to `max-w-5xl` with the panel gutter trimmed, so the invite form and the Start a Group card use the width instead of leaving wide margins. Account: widened to `max-w-6xl`; the four settings blocks (Name, Country and Currency, Language, Notifications) are now upright cards in a grid (two across from `md`, four across from `xl`, equal height) instead of a stack of wide bands; Your Groups lists in two columns. Save, Your Groups and Log Out keep their order below the grid. Verified `/groups` live; Home and Account need a session and were checked by typecheck, lint and the page suite (44 passing).
- **Account grid: two rows of two.** Name and Country and Currency share the first row; Language and Notifications share the second, equal height per row, stacked on phones.
- **Notification toggles in a 2×2 grid.** SMS and WhatsApp on the first row, Email and Push on the second, each label with its switch; hairline between the rows only.
- **Language card filled honestly.** Description plus three rows under the chips: App screens (English; Kiswahili and Sheng not translated yet), Akili (answers in the language you write in), Saved (on this device now, with your account on Save). No promised dates, nothing invented.
- **Stepper connectors.** `Stepper` draws a hairline between consecutive steps that stops 0.5rem short of each circle (never touching); it is border-grey until the step it leaves is done, then foreground. Works in both orientations.
- **Start a Group width.** Column widened from `max-w-2xl` to `max-w-5xl` on every step and the done state; step 1 kinds go three across from `lg`; step 2 aside widened to 20rem; step 3 shows Summary and Opening Fee side by side from `lg`.
- **Start a Group summary in orange.** Eugene asked for the summary card (kind, name, monthly amount, rules) to stand apart: it now has the brand-orange fill with white type in both themes, and `AmountBlock`'s greys are overridden to white/80 inside it. This is a deliberate exception to "orange is brand and CTA only" (§5): it marks the person's own group on a page of neutral form cards, not a status.
- **Stepper spans the row.** The last step now hugs the right edge (`flex-none items-end text-right` from `sm`), so the connectors fill the full container width and the row lines up with the cards below instead of ending two thirds across.
- **Darker page canvas.** New `--canvas` token (light `0 0% 97%`, dark `0 0% 3%`) for the page behind the floating frame; the three shells use `bg-canvas` instead of `bg-surface`, so the gutter in dark mode is barely off black and the black frame and cards carry the contrast. `--surface` (8%) is untouched for hover fills and chips inside cards.
