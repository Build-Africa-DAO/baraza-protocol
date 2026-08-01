# Baraza Protocol — Pricing & Business Model
*One-pager · July 2026*

## The model in one line
**20 bob to join, free to govern, institutions pay for compliance.**

## Activation (all tiers)
- **KES 20 one-off per member** (self-activation via M-Pesa STK push)
- **KES 15/member on group bulk-activation** (treasurer pays for whole group in one push)
- Waived on Serikali contracts (county/agency pays per-citizen)
- **Waiver pool:** grant funding can sponsor activation for cohorts directly — "sponsors cover activation for the next 500 chamas" is itself a fundable line item for grant applications, closing the gap between "members never pay to vote" and the KES 20 gate.
- What it is: M-Pesa-verified identity + commitment ritual, mirroring chama joining fees. Every member count is backed by a payment receipt — verifiable traction no competitor can claim.
- What it is not: a revenue line. It covers rails + SMS costs with thin margin.

## Tiers

| Tier | Who | Price | Core value |
|---|---|---|---|
| **Mtaa** | Chamas, informal savings groups (≤50 members) | **Free forever** | Governance, one coop template, M-Pesa in/out, WhatsApp + USSD |
| **Kikundi** | Larger/multi-group chamas, not yet SASRA-registered | **KES 500–1,000/mo** | Multi-group, rotating-payout automation, KRA-ready exports, SMS — *conversion bridge, not a revenue target* |
| **SACCO/Coop** | Registered SACCOs & cooperatives | **KES 8K–25K/mo** (annual) | Committees, share registers, SASRA-format compliance reports, Akili deliberation, priority support |
| **Biashara** | Businesses, NGOs, DAOs | **$100–300/mo** (annual) | Full toolset, BYOT + token deployment, API, license registry, custom templates |
| **Serikali** | Government bodies, counties | **Custom, $10K+/yr** | Participatory budgeting, white-label, training, SLA, dedicated deployment |

Local tiers priced in KES; institutional in USD.

## One-time revenue
Institutional onboarding/setup ($500–5,000) · training workshops · license-verification fees (Biashara+) · custom template development.

## Why forking audited code doesn't undercut this business
The code was never the product — Red Hat built billions on free Linux. Baraza sells the **service**: hosted platform, M-Pesa rails, compliance, support, onboarding, and the coop layer nobody else has built. Forking audited primitives (OpenZeppelin, SPL Governance, Squads, Soroban Governor) strengthens the model — zero audit cost on the parts already proven, faster shipping, and grant funding covers the free tier while paid tiers fund operations.

## Principles
1. **Members never pay to vote.** Institutions pay for reports, audits, verification, SLAs.
2. **Free tier is the moat, not a loss.** 10,000 chamas on Mtaa is the traction story that wins grants, the pipeline that graduates into Kikundi/SACCO as groups formalize, and the base BRZA eventually launches into. Kibera chamas are distribution *and* grant narrative — grants fund their tier today. **Sustainability beyond grants:** Mtaa's marginal cost per group is near-zero (shared infra, pass-through M-Pesa fees); at scale it's absorbed by paid-tier margin — every ~N SACCOs funds Mtaa for the informal groups beneath them. This is the planned crossover point, not an open-ended subsidy.
3. **Price in local currency for local tiers.** A chama thinking in dollars is already lost; a government contract in shillings undersells you.
4. **Platform fees only.** Baraza never sets rates, never takes loan spread (locked rule) — activation and subscriptions are service fees, not interest.
5. **Token-neutral.** BRZA deferred until traction earns it; communities bring licensed tokens or deploy via audited infrastructure. Compliance gate is a feature: we only govern licensed instruments.

## Unit economics sanity check
- 200 SACCOs × KES 15K/mo ≈ **KES 36M/yr (~$280K)** from one tier
- 10 county contracts × $25K ≈ **$250K/yr**
- 100K activated members = 100K M-Pesa-verified identities (grant/investor-grade proof of adoption)

## Grant-narrative framing
Present activation as **"M-Pesa-verified membership"** — identity verification, not a fee. Core story: audited primitives + original engineering only where nothing exists (coop law as code, mobile-money rails, deliberation), with free access for the informal-savings communities the platform exists to serve.

## Internal note — factual guard
"SASRA compliance reports" (SACCO tier) is a regulated claim. Until confirmed with someone holding regulatory standing, treat this internally as **"SASRA-format reports"** — same discipline as the license-registry compliance gate: verify before claiming, don't let marketing outrun what's actually certified.
