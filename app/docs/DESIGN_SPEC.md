# Baraza Platform — Design Specification

> Essential elements and user flows for the Baraza community DAO platform.
> Built around a multichain adapter model with **Stellar** as the reference implementation. See `MVP_ARCHITECTURE.md`
> for the chain/program layer and `PRD.md` for product scope.

---

## SECTION 1: CORE PLATFORM IDENTITY

Baraza is a multi-chain community DAO platform for chamas, SACCOs, welfare
groups, co-ops, and creator communities. The product centres communities as
the primary entity; membership, governance, and treasury all scope to a
community.

| Concept | Baraza |
| --- | --- |
| Primary entity | **Community** (replaces "DAO" in user-facing copy) |
| Token | Community governance token (optional per community) |
| Membership | Multi-mode: free, purchased, airdrop, invite-only |
| Roles | Founder, Moderator, Member tiers |
| Networks | **Stellar** (reference) + additional adapters |
| Currencies | SOL, XLM, USDC, KES via M-Pesa (off-chain) |

---

## SECTION 2: CRITICAL DESIGN LAYERS

### Layer 1: Global Navigation (Desktop)

```text
┌──────────────────────────────────────────────────────────┐
│ [Baraza Logo]  [About] [Explore] [Create] [Docs]         │
│                       [Network: Solana ▼]  [Wallet ●]    │
└──────────────────────────────────────────────────────────┘
```

Key design points:

- Network selector switches between Solana and Stellar.
- "Explore" surfaces communities, not abstract DAOs.
- Wallet status is always visible on the right.
- Active route gets a single visual indicator (pill OR underline, not both).

### Layer 2: Bottom Navigation (Mobile)

```text
┌─────────────────────────────────────────────┐
│   [Home]   [Create Community +]   [Profile] │
└─────────────────────────────────────────────┘
```

`Create Community` is the **primary** action — visually elevated and centred.

---

## SECTION 3: ESSENTIAL USER FLOWS

### FLOW 1: Create a Community (6-Step Wizard)

```text
STEP 1: COMMUNITY PROFILE
├─ Community Name (text)
├─ Ticker Symbol (auto-generates with $ prefix, editable)
├─ Website URL (optional)
├─ Description (rich text)
└─ Purpose / Mission (category dropdown: Chama, SACCO, Welfare, Co-op,
                       Investment, Creator, Commerce, Gaming, DAO, Other)

STEP 2: TOKEN DISTRIBUTION
├─ Initial Distribution Method (dropdown)
│  ├─ Auction
│  ├─ Airdrop
│  └─ Direct Sale
│  └─ Free (no token, membership-only)
├─ Total Token Supply (number)
├─ Initial Price / Reserve (if auction or sale)
└─ Distribution Timeline

STEP 3: COMMUNITY ADMIN
├─ Admin Address(es) (Solana pubkey, Stellar account, or ENS-style alias)
│  └─ Multiple admins allowed
└─ Admin Permissions (checkboxes)
   ├─ Can update settings
   ├─ Can manage members
   └─ Can execute treasury transactions

STEP 4: TOKEN ALLOCATIONS
├─ Founding Member Allocation (%)
│  ├─ Address
│  ├─ Percentage
│  └─ Vesting End Date
├─ Reserve Tokens For Airdrops
│  ├─ Amount
│  └─ Merkle root (for whitelist)
└─ Community Fund Allocation (%)

STEP 5: COMMUNITY ASSETS
├─ Community Logo (required, 512×512px, PNG/SVG)
├─ Community Banner (optional, 1200×300px, PNG/JPG)
└─ Role Icons / Badges (optional, up to 5, 256×256px each)
   ├─ Upload badge image
   ├─ Badge name
   └─ Assigned role (Founder / Moderator / Member)

STEP 6: REVIEW & DEPLOY
├─ Review all settings
├─ Select Network (Solana or Stellar) — affects program addresses
├─ Acknowledge terms
└─ Deploy (single transaction; metadata included)
```

### FLOW 2: Explore Communities

```text
PAGE: Community Directory
├─ Search bar (min 3 chars)
├─ Filters:
│  ├─ Network (Solana / Stellar / All)
│  ├─ Size (member count ranges)
│  └─ Category (Chama, SACCO, Welfare, Co-op, …)
├─ Sorting:
│  ├─ Newest
│  ├─ Most Active
│  └─ Largest
└─ Community Cards Grid:
   ├─ Logo + Banner
   ├─ Name
   ├─ Member count
   ├─ Network badge (Solana green / Stellar blue)
   └─ Join button
```

Cards surface **member count**, **activity score**, and **network badge**.
No countdown timers on listings.

### FLOW 3: Join Community

```text
WHEN USER CLICKS "JOIN":
├─ Check if community is open / public
├─ If closed: Request to join (admin approval needed)
├─ If open:
│  ├─ Direct membership (free) — instant
│  ├─ Purchase tokens (if community sells) — payment flow
│  ├─ Airdrop claim (if whitelisted) — Merkle proof
│  └─ Referral code validation (if invite-only)
└─ Complete join
   └─ For paid join: M-Pesa or wallet-native payment, then attestation,
      then membership activation. See MVP_ARCHITECTURE.md §6.1.
```

Membership modes supported:

1. **Direct** — free, instant
2. **Purchase** — pay in KES (M-Pesa), SOL, USDC, or XLM
3. **Airdrop** — claim against pre-registered whitelist
4. **Invite-only** — referral code or admin approval

---

## SECTION 4: KEY COMPONENTS TO DESIGN

### Component 1: Community Card

```text
┌─────────────────────────────────────┐
│ [Banner Image]                      │
│ [Logo] Community Name                │
│ "Short tagline or description"      │
│                                     │
│ 👥 1,234 members | ⭐ 4.2 activity  │
│ [Solana Badge]                      │
│                                     │
│ Category tags: [Chama] [Creator]    │
│                                     │
│ [Join Community] [View Profile]    │
└─────────────────────────────────────┘
```

Required fields:

- Banner image + circular logo overlay
- Community name + one-line tagline
- Member count + activity score
- Network badge (Solana green or Stellar blue)
- Up to 3 category tags
- Two CTAs: primary `Join`, secondary `View Profile`

### Component 2: Token Distribution Card

```text
┌─────────────────────────────────────┐
│ BRZA Token Distribution             │
│ Total Supply: 1,000,000,000 BRZA    │
│                                     │
│ [████░░░░] 20% – Community Rewards  │
│ [███░░░░░] 15% – Operations         │
│ [██░░░░░░] 15% – Founders (A + B)   │
│ [██░░░░░░] 12% – Public Sale        │
│ [█░░░░░░░] 10% – Reserve            │
│ [██░░░░░░] 28% – Liquidity/Grants/… │
│                                     │
│ Your Holdings: 1,234 BRZA (0.0001%) │
│ Voting Power: 1,234 votes           │
└─────────────────────────────────────┘
```

- Stacked-bar visualization of BRZA allocation buckets (source: `app/src/lib/brza/constants.ts`)
- User's personal holdings + voting power surfaced prominently
- Optional pie-chart variant for the dashboard hero

### Component 3: Member List

```text
┌─────────────────────────────────────┐
│ Community Members (1,234)            │
│                                     │
│ [Search members…] [Sort ▼]          │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] Member Name          │  │
│ │ Role: [Founder]               │  │
│ │ Tokens: 5,000 | Power: 0.05%  │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] Another Member       │  │
│ │ Role: [Member]                │  │
│ │ Tokens: 100 | Power: 0.001%   │  │
│ └───────────────────────────────┘  │
│                                     │
│ (Paginated)                         │
└─────────────────────────────────────┘
```

- Role badge per member (Founder / Moderator / Member)
- Voting power shown explicitly
- Delegation control (delegate votes to another member) — Baraza-specific addition

### Component 4: Governance Proposal Card

```text
┌─────────────────────────────────────┐
│ [Status: Active] [Stage: Voting]    │
│                                     │
│ "Allocate KSh 5,000 from Treasury…" │
│                                     │
│ Proposed by: alice.sol              │
│ Created: 2 days ago                 │
│                                     │
│ Voting Results:                     │
│ [████████░] Yes: 65% (8,000 votes) │
│ [██░░░░░░░] No:  35% (4,500 votes) │
│                                     │
│ Time remaining: 2 days              │
│                                     │
│ [Vote Yes] [Vote No] [View Details] │
└─────────────────────────────────────┘
```

- Status pill + stage badge (Pending / Voting / Succeeded / Queued / …)
- Vote breakdown bars with absolute counts + percentages
- Time remaining counts down to either voting end OR execution ETA
- Inline vote buttons (gated on membership + already-voted state)

---

## SECTION 5: DESIGN PRINCIPLES

### Patterns to use

1. **Progressive disclosure wizard** — 6 steps, each with focused validation,
   plus a final review + deploy step.
2. **Token-weighted governance** — voting weight = member's token balance OR
   role-tier weight; both modes are supported per community.
3. **Grid explore directory** — search + filter + sort + paginated card grid.
4. **Member dashboard** — tabs for Overview / Members / Governance / Wallet,
   with activity feed pinned.

### Baraza-specific design choices

1. **Simple asset upload** — logo + banner + role badges only. No trait
   layering, no procedural NFT composition, no randomized minting.
2. **Multiple membership models** — direct, purchase, airdrop, invite. Not
   auction-only. Communities can be public or closed.
3. **Single-step deployment** — Solana and Stellar both initialize program
   state and metadata in one transaction. No two-phase deploy.
4. **Out of MVP scope** — creator coins, NFT drops, complex trait systems,
   playground / trait previewers.

### Multi-chain surface

1. **Network selector** — Solana vs Stellar choice in the header. Each
   community lives on one network; addresses, tokens, and txs follow that
   network's conventions.
2. **Network badge colours** — Solana green (`#14F195`), Stellar blue
   (`#0066FF`). Used on cards, dashboards, and tx confirmations.
3. **Multi-currency display** — KES, SOL, XLM, USDC are all first-class.
   Tier dues default to KES via M-Pesa, with optional wallet-native payment.

### Roles + categories

1. **Member roles** — Founder, Moderator, Member tiers. Determine voting
   weight, permission scope, and badge display.
2. **Community categories** — Chama, SACCO, Welfare, Co-op, Investment,
   Creator, Commerce, Gaming, DAO, Other. Used for filtering + discovery.
3. **Activity score** — community engagement metric (proposals / month,
   votes / member, treasury motion). Surfaced on cards in place of any
   countdown.

---

## SECTION 6: WIREFRAME PRIORITY PAGES

### Page 1: Community Creation Wizard (Step 1)

```text
┌──────────────────────────────────────────────────┐
│ BARAZA — Create a Community                      │
├──────────────────────────────────────────────────┤
│ Progress: [●──○──○──○──○──○]                    │
│ Step 1 of 6: Community Profile                   │
│                                                  │
│ Community Name                                   │
│ [________________________]                        │
│                                                  │
│ Ticker Symbol (auto-generates)                   │
│ [$BRZA               ]  (editable)               │
│                                                  │
│ Website (optional)                               │
│ [https://________________]                        │
│                                                  │
│ Description                                      │
│ [Rich text editor area]                          │
│                                                  │
│ Purpose / Mission                                │
│ [Chama | SACCO | Welfare | Co-op | Creator | …]  │
│                                                  │
│ [Continue →]                                     │
└──────────────────────────────────────────────────┘
```

### Page 2: Community Directory

```text
┌──────────────────────────────────────────────────┐
│ BARAZA — Discover Communities                    │
├──────────────────────────────────────────────────┤
│ [Search…] [Filter ▼] [Sort: Newest]              │
│                                                  │
│ Network: [Solana ●] [Stellar ○]                  │
│                                                  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│ │ [Banner]   │ │ [Banner]   │ │ [Banner]   │    │
│ │ [Logo] Name│ │ [Logo] Name│ │ [Logo] Name│    │
│ │            │ │            │ │            │    │
│ │ 👥 1.2K    │ │ 👥 5K      │ │ 👥 342     │    │
│ │ ⭐ 4.5     │ │ ⭐ 4.2     │ │ ⭐ 3.8     │    │
│ │            │ │            │ │            │    │
│ │ [Chama]    │ │ [Creator]  │ │ [Gaming]   │    │
│ │ [Solana]   │ │ [Stellar]  │ │ [Solana]   │    │
│ │            │ │            │ │            │    │
│ │ [Join]     │ │ [Join]     │ │ [Join]     │    │
│ └────────────┘ └────────────┘ └────────────┘    │
│                                                  │
│ [← Previous] [1] [2] [3] [Next →]                │
└──────────────────────────────────────────────────┘
```

### Page 3: Community Dashboard

```text
┌──────────────────────────────────────────────────┐
│ Community Name | [Members: 1,234] [⭐ 4.5]       │
│ "Short description" | [Solana]                   │
├──────────────────────────────────────────────────┤
│ Tabs: [Overview] [Members] [Governance] [Wallet] │
│                                                  │
│ OVERVIEW TAB:                                    │
│ ┌──────────────────┐ ┌──────────────────────┐   │
│ │ Token Supply     │ │ Your Holdings        │   │
│ │ 10M total        │ │ 1,234 tokens (0.01%) │   │
│ │                  │ │ Voting Power: 1.2k   │   │
│ │ Distribution:    │ │                      │   │
│ │ [████░░░] 40%    │ │ Your Role: [Member]  │   │
│ │ Treasury         │ │                      │   │
│ │ [███░░░░] 30%    │ │ [Delegate Votes]     │   │
│ │ Founders         │ │ [Claim Rewards]      │   │
│ └──────────────────┘ └──────────────────────┘   │
│                                                  │
│ Treasury Balance                                 │
│ 150,000 SOL ($12.5M)                             │
│                                                  │
│ Recent Activity                                  │
│ • Proposal Passed: "Allocate KSh 5K for…"       │
│ • New Member: @alice.sol                         │
│ • Vote: @bob.sol voted YES on proposal           │
└──────────────────────────────────────────────────┘
```

---

## SECTION 7: ASSET UPLOAD

```text
Step 5: Community Assets

├─ Community Logo (required)
│  ├─ Size: Square, 512×512px minimum
│  ├─ Format: PNG or SVG
│  └─ [Upload] [Preview]
│
├─ Community Banner (optional)
│  ├─ Size: 1200×300px
│  ├─ Format: PNG or JPG
│  └─ [Upload] [Preview]
│
└─ Role Badges (optional)
   ├─ Up to 5 badge images
   ├─ Size: Square, 256×256px
   ├─ Each badge:
   │  ├─ [Upload badge]
   │  ├─ Badge name: [________]
   │  ├─ Assign to role: [Founder / Moderator / Member ▼]
   │  └─ [Save]
   └─ [Add Another Badge]
```

Constraints:

- Static asset upload only — no trait layering or randomized composition.
- All assets stored on IPFS or Arweave per `MVP_ARCHITECTURE.md §3`.
- Logo + banner are mandatory; role badges are optional.

---

## SECTION 8: DEPLOYMENT FLOW

```text
Deploy Community
├─ Select Network (Solana ●  Stellar ○)
├─ Review settings (from wizard steps 1-5)
├─ Acknowledge terms
└─ Single transaction to deploy
   ├─ On Solana: invoke community_registry::create_community + sibling inits
   └─ On Stellar: invoke Soroban contract / SDP setup (Phase 2)
```

Both networks support single-transaction deployment with all metadata
included. The wallet signs once.

---

## SECTION 9: DESIGN SYSTEM SPECIFICATIONS

### Colour palette

```text
PRIMARY (current implementation):
- Background charcoal: hsl(84 17% 5%)
- Foreground warm white: hsl(44 100% 95%)
- Amber gold (primary): hsl(44 100% 50%)   #FFBB00
- Blaze orange (accent): hsl(17 97% 49%)

NETWORK BADGES:
- Solana green: #14F195
- Stellar blue: #0066FF

FUNCTIONAL:
- Success / confirmed: hsl(142 60% 40%)
- Error: hsl(0 72% 51%)
- Warning: hsl(38 92% 50%)
- DAO accent: hsl(270 85% 50%)
- Network accent: hsl(217 100% 50%)
```

### Typography

```text
Headings: Hanken Grotesk, bold
Body:     Inter, 400-600
Monospace: JetBrains Mono (addresses, code)

Sizing:
- Button height: 44px minimum (touch target)
- Input height: 44px
- Card padding: 24px
- Section gaps: 48px
```

---

## SECTION 10: IMPLEMENTATION CHECKLIST

- [ ] Define exact colour values for Baraza brand (mostly done — see `index.css`)
- [ ] Create community card component design (current: `CommunityCard.tsx` — gaps noted in review)
- [ ] Design 6-step wizard form screens (current: single-page form)
- [ ] Create member role badge designs
- [ ] Design governance proposal cards (current: `DecisionCard.tsx`)
- [ ] Create community dashboard layout (current: 2-tab; spec needs 4-tab)
- [ ] Design explore / directory grid (largely aligned)
- [ ] Create role badge upload flow
- [ ] Design network switcher component
- [ ] Create activity feed for communities
- [ ] Design member list / management UI
- [ ] Create delegation UI (Baraza-specific)

> Product-layer document. Retained in this repo pending the public/private split; only framing corrections are in scope here.
