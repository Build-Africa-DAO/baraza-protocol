# 02 — Baraza TV

Community-led video, built into the protocol. Pays creators in BRZA. Sources stories from on-chain community activity, not from invention.

---

## What it is

Baraza TV is a video product where episodes are sourced from real community activity on the Protocol — a vote drive, a treasury decision, a contributor payout, a successful bounty. Creators are paid in BRZA per content milestone, viewers earn BRZA for engagement, and the editorial stack is a fixed production crew running a season arc.

This is not a content platform. It is a feedback loop: communities act → Baraza TV reports → viewers learn → new members join → communities act.

## The 70 / 20 / 10 split

Encoded in `BARAZA_TV` in `app/src/lib/brza/constants.ts`:

| Share | Recipient | Rule |
|---|---|---|
| **70%** | Creator | Subscription revenue + tips, paid in BRZA. Creator must hold an active community membership (`membershipRequired: true`). |
| **20%** | Community DAO treasury | Goes to the community the episode is about. Funds the community whose story carried the episode. |
| **10%** | Protocol reserve vault | Protocol fee. The primary Baraza TV revenue surface. |

Creators draw additional BRZA from the **Baraza TV Creators bucket** (30M / 3% of supply) on a per-content-milestone vest.

## The editorial stack

Baraza TV runs as a real production with a named crew. Full character bibles live in `docs/akili-council/` and the Baraza TV production agents are documented at the same level. Roles, in production order:

| Role | Authority |
|---|---|
| **Executive Producer (Kwame)** | Commissions, cancels, approves season arc. Final editorial authority. Interfaces with the Akili council. |
| **Show Runner / Line Producer (Zahara)** | Schedules, runs the production board, manages crew and vendors. |
| **Head Writer (Osei)** | Writes all broadcast scripts for the on-air talent. Sources from Seku's research briefs. Locks scripts Thursday 4pm. |
| **Director (Tendo)** | Shot composition, framing, lighting, visual pacing. Mandatory 7-min sync with Dami before every shoot. |
| **Sound Engineer / TD (Dami)** | All audio production and broadcast technical infrastructure. Signal chain test before every session. Triple-redundancy on every broadcast path. |
| **Editor (Leyla)** | Final post-production authority. Delivers locked cuts and pre-cleared clips to Kemi. |
| **Digital Producer (Kemi)** | Distribution — WhatsApp first, then TikTok, YouTube. Source link on every clip, always. |

The Akili specialist closest to Baraza TV is **Amara** (content & media), who owns episode performance, retention, replay decay, and vote-to-watch correlation. Editorial independence from funders is protected by Kwame; Amara doesn't override editorial.

## Editorial rules

These are durable, not negotiable per episode:

- **No price predictions, ever.** Osei locks scripts that explicitly exclude BRZA price forecasts.
- **Source link on every clip.** Kemi's distribution rule.
- **Stories source from on-chain activity, not invention.** Episodes about a community's vote or dues drive must be checkable against the protocol record.
- **Creator must be a member.** No drive-by content for token rewards.
- **70% creator share is fixed.** Not a variable knob per creator.

## Tokenomics

| Allocation | Amount | Vesting |
|---|---|---|
| `barazaTvCreators` | 30,000,000 BRZA (3%) | Per content milestone |

Revenue split (encoded in `BARAZA_TV`):

| Field | Value |
|---|---|
| `creatorRevSharePct` | 0.70 |
| `communityRevSharePct` | 0.20 |
| `protocolFeePct` | 0.10 |
| `membershipRequired` | true |

## Status

Pre-launch:

- Editorial stack and Akili council bibles are written and durable.
- 70/20/10 revenue split and 30M creator bucket are encoded.
- No episodes have shipped yet; protocol-side payout rails ship in Phase 3.

Not yet shipped:

- Video hosting + streaming infrastructure.
- Subscription and tip rails on Stellar.
- Creator-payout automation gated on content-milestone signal.
- Viewer-engagement reward emission (drawn from Community Rewards bucket, scoped under the 2M/month protocol-wide cap).

## Roadmap

| Phase | What ships | Status |
|---|---|---|
| 0–1 | Editorial production-board scaffolding; Akili council Amara filings as input to commissioning | Editorial only |
| 3 | Creator economics live: subscription + tip rails on Stellar, weekly episode cadence, milestone-paid creator vesting | Planned |
| 3.1 | Vote-to-watch correlation tracking via Amara filings; retention reads from Leyla to Zahara | Planned |
| 4+ | Cross-chain BRZA payout enabling non-Stellar viewer engagement | Planned |

## Risks and constraints

- **Yield framing.** A 70% revenue share is the kind of headline that pulls a product into FSCA / CMA "financial product" classification. Marketing copy must frame Baraza TV as creator economics, not as an income product. See counsel checklist §3.
- **Editorial independence from funders.** Kwame's authority is protected by structure; if an investor pushes for promotional placement, the protocol's response is a documented refusal. Investors should know this before signing.
- **No price predictions.** A creator who breaks this rule loses milestone vesting. The constraint is editorial, not contractual — Osei enforces.
- **Creator-must-be-member.** Drive-by creators don't qualify. This is a deliberate scope constraint and a moat — only members can monetise.
- **Triple-redundancy on broadcast.** Dami's mandate. Operationally expensive but protects against a single-point-of-failure shutdown during a live community event.
