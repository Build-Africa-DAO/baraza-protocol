# RWA + DAOs as a Business — Research Brief

Companion to the investor whitepaper. Working draft, 2026-06-19.

**Thesis in one line.** Baraza is what you get when you take RWA tokenization seriously enough to do it for the assets people actually pool — community savings — and take DAO governance seriously enough to ship it on a feature phone.

This brief sizes both markets, names the live competitive set, anchors Baraza's wedge in numbers, and lists the regulatory implications we need to clear before IDO. Sources are inline.

---

## 1. Two markets, one product

Two adjacent crypto categories are mature enough to be capital-attracting and immature enough to leave the African community-finance use case wide open.

| Category | What it means | Q1 2026 size | Forecast |
|---|---|---|---|
| **RWA tokenization** | Bringing off-chain assets (treasuries, credit, real estate, receivables) on-chain | ~$12B excl. stablecoins; ~$32B incl. tokenized stablecoins ([CoinLaw](https://coinlaw.io/asset-tokenization-statistics/)) | $2T (McKinsey) → $3.5T base / $10T bull (BinaryX) → $18.9T by 2033 (BCG × Ripple, ~53% CAGR) → $30T by 2034 (Standard Chartered) ([Mintlayer](https://www.mintlayer.org/blogs/16-30-trillion-by-2030-unlocking-the-rwa-opportunity)) |
| **DAO governance** | On-chain treasuries governed by token-holding members | >$25B aggregate DAO treasury, >5,000 DAOs, median treasury ~$2.3M ([CoinLaw](https://coinlaw.io/decentralized-autonomous-organizations-statistics/)) | Treasuries are concentrating into a few protocol DAOs (Uniswap $4.8B, Sky/MakerDAO $3.9B, Optimism $2.1B, Arbitrum $1.7B, Lido $1.4B) — the long-tail community DAO is still a green field |

Baraza is the **intersection.** A chama is an RWA (its assets are real shillings collected by phone). A chama is also a DAO (its members vote on how the pot moves). No major protocol has actually shipped both legs on a feature phone in a regulated emerging market. That gap is the wedge.

---

## 2. RWA — where the money is going

The category leaders ship to two cohorts: institutional treasuries (yield) and emerging-market private credit (origination).

### 2.1 Institutional yield — the BlackRock side

- **BlackRock BUIDL** — tokenized money-market fund, >$2.4B AUM. Two more tokenized fund structures filed with the SEC in May 2026. Standard Chartered + BlackRock + OKX framework launched April 2026 lets BUIDL act as trading collateral ([CoinLaw](https://coinlaw.io/asset-tokenization-statistics/)).
- **Tokenized US Treasuries** — ~$3B on-chain as of Q1 2026. The dominant on-ramp for DAO treasuries needing real yield.
- **Centrifuge × Stellar** — Centrifuge launched **deRWA** on Stellar starting with two flagship funds: **deJTRSY** (DeFi version of Janus Henderson Short-Term US Treasury) and **deJAAA** (DeFi AAA CLO strategy) ([Centrifuge](https://centrifuge.io/blog/real-world-asset-tokenization-trends-2025)).

**Implication for Baraza.** Stellar is the chain Centrifuge picked for its emerging-market RWA bridge. The same rail that settles M-Pesa dues to BRZA can later sweep idle community treasury into deJTRSY or deJAAA without leaving the network. This is a Phase 4+ optionality, not a Phase 0 promise — but it converts "community treasury" from a yield-zero parked pile to a productive on-chain asset using infrastructure that already ships.

### 2.2 Emerging-market private credit — the Goldfinch / Centrifuge / Huma side

This is the half of RWA that is actually closer to what African community finance does.

| Protocol | Model | Yield | Africa exposure |
|---|---|---|---|
| **Goldfinch** | Uncollateralised loans to licensed fintech lenders & MFIs | 10–17% APY | 20+ countries across Africa, SEA, LatAm, Eastern Europe ([Stablecoin Insider](https://stablecoininsider.org/top-8-tokenized-private-credit-platforms-delivering-8-to-15-apy-in-may-2026/)) |
| **Centrifuge** | Structured credit, trade finance, invoice receivables | Variable | Sky/MakerDAO integration; growing emerging-market exposure |
| **Huma Finance** | Receivables — payroll, invoices, cross-border payment receivables | 10–15% APY | Cross-border focus, Africa adjacent |

**Implication for Baraza.** Goldfinch lends *to* the fintechs that serve the borrower. Huma lends against receivables. Neither lends *into* the community itself — the chama, the SACCO, the stokvel. The community currently has no on-chain credit footprint because nobody is recording its dues-payment history on-chain in a way that an underwriter can read.

Baraza generates that footprint. Once a community has 12+ months of on-chain dues, vote turnout, and treasury hygiene, it becomes a *legible borrower* — and an obvious Goldfinch / Centrifuge / Huma counterparty in Phase 3+. The Baraza treasury becomes the bridge between RWA capital and African community demand. That is a multi-billion-dollar bridge if even 1% of the chama / SACCO / stokvel float crosses it.

---

## 3. DAOs — where governance is, and where it isn't

### 3.1 Where governance has matured

DeepDAO tracks ~5,000 DAOs with aggregate treasury >$25B and median treasury $2.3M ([CoinLaw](https://coinlaw.io/decentralized-autonomous-organizations-statistics/)). The treasury distribution is sharply long-tailed — the top five hold the bulk:

| DAO | Treasury (Q1 2026) | Purpose |
|---|---|---|
| Uniswap | $4.8B | DEX governance |
| Sky / MakerDAO | $3.9B | Stablecoin issuance |
| Optimism | $2.1B | L2 governance |
| Arbitrum | $1.7B | L2 governance |
| Lido | $1.4B | Liquid staking |

Every one of these is a **protocol DAO governing protocol parameters.** Voter turnout is famously thin, governance is dominated by a handful of delegates, and the "DAO" in practice is a coordinator for engineering and grants — not for the lived organisation of a member group.

### 3.2 Where governance hasn't

There is **no Top-50 DAO that is a community treasury for a real-world member group** — no chama, no SACCO, no co-op, no burial society, no PTA. The DAO tooling stack (Aragon, Snapshot, Tally, Safe) was built for protocol-governed money, not for member-governed money. It requires English literacy, a hot wallet, gas budgeting, and a desktop — every one of which is a hard barrier for the 90% of African community-finance participants who manage their pool on a feature phone.

**Implication for Baraza.** The 5,000-DAO long tail is dominated by protocol DAOs. The 11M-member stokvel sector and the 300K Kenyan chamas (§5 below) are the *next 5 million DAOs.* Nobody is serving them. Aragon OSx, which Baraza uses on EVM, is the most likely competitor — but Aragon has no mobile-money rail and no USSD surface and no Swahili-first onboarding. That is Baraza's defensible lane.

### 3.3 The legal-wrapper question

By 2026, DAO legal wrappers are no longer optional for treasuries above a meaningful threshold ([Blockchain Council](https://www.blockchain-council.org/dao/dao-legal-and-compliance-guide-entity-structures-tax-regulatory-trends/)):

| Wrapper | Status | Best for |
|---|---|---|
| **Marshall Islands DAO LLC (MIDAO)** | 80+ DAOs adopted | Operational DAOs not distributing profits — fast, flexible, no shareholders |
| **Wyoming DAO LLC** | Amended 2025 — now recognises DAOs as **limited liability cooperatives** | US-touching DAOs needing a domestic wrapper |
| **Cayman Foundation** | Mature | Protocol stewardship, treasury management, asset isolation |

**Implication for Baraza.** Two things matter here.

1. **Wyoming's 2025 amendment is the most relevant** — it explicitly classifies a DAO LLC as a *limited liability cooperative*. That is the same legal category an American SACCO or credit union sits in. The line between "co-op" and "DAO" is being erased in law, not just in product. Baraza is the right side of that convergence.
2. Each member-community on Baraza is too small to need its own legal wrapper. The *protocol entity* needs one (likely MIDAO or Cayman Foundation per the investor whitepaper §11.1). Individual chamas continue to use Kenya's Cooperative Societies Act (Cap. 490) or the local stokvel rules. Baraza is the ledger and rail, not the legal form. That keeps the regulatory surface tractable.

---

## 4. African community finance — the addressable market in numbers

The market we are actually serving is large, mostly informal, and currently un-onchain.

### 4.1 Kenya — SACCO and chama

- **Regulated SACCO sector:** total assets **KSh 1.21 trillion** as of Dec 2025 (~$9.3B USD at current rates) ([SASRA via Sacco Review](https://saccoreview.co.ke/sasra-report-sacco-total-assets-hit-ksh-1-21-trillion-mark/)).
- **Deposit-Taking SACCOs (DT-SACCO):** KSh 1.07T of the total (~$8.2B).
- **Industry growth:** +11.91% YoY through Dec 2025 — sustained balance-sheet growth.
- **Chamas (informal savings groups):** ~**300,000 chamas** holding ~**KSh 300B** (~$3.4B USD), entirely outside the regulated SACCO statistics ([MUIAA](https://www.blog.muiaa.com/chamas-in-kenya-driving-grassroots-economic-empowerment/)).
- **Asset concentration:** 60 large SACCOs control 77% of regulated assets — the *long-tail* (295 mid/small SACCOs + 300K chamas) is where Baraza's product-market fit is sharpest.

### 4.2 South Africa — stokvels

- **~800,000 stokvels** with **~11M members** ([Nasasa via Standard Bank / Ipsos](https://www.ipsos.com/en-za/stokvels-remain-untapped-human-banks-south-africa)).
- **Annual turnover ~R50B** (~$2.7B USD) ([Lifestyle & Tech](https://lifestyleandtech.co.za/smart-money/article/2026-03-19/digitising-south-africas-r50-billion-stokvel-economy-is-a-national-imperative)).
- FNB's tracked stokvel inflows alone reached R20.6B between Sept 2020 and Dec 2025 — *and that's just one bank's customers, voluntarily disclosing.*
- The sector is described in regulator-adjacent sources as the country's "human banks" — informal, cash-based, untapped by formal financial infrastructure.

### 4.3 Implication

Just the **regulated Kenyan SACCO + Kenyan chama + South African stokvel** float is conservatively **$15B+ USD** in member-pooled, member-governed, ledger-deprived assets. That number does not include:

- Tanzania, Uganda, Rwanda, Ethiopia SACCOs and ROSCAs.
- Nigerian esusu / ajo and adashe.
- Pan-African diaspora chamas.
- VSLA / ASCA savings groups operating across East and West Africa.

The serviceable addressable market (SAM) for Baraza in its current scope is multiples of that. The market is large enough that Baraza does not need to take share from another protocol to be a meaningful business — it needs to take share from WhatsApp + paper ledger + a treasurer's bank account.

---

## 5. Regulatory landscape — the gates we need to walk through

### 5.1 Kenya — VASP Act, 2025

Kenya passed the **Virtual Asset Service Providers Act, 2025** on 7 October 2025 and it received presidential assent on 15 October 2025. The draft **VASP Regulations, 2026** are now published ([RBA Kenya](https://www.rba.go.ke/kenya-moves-to-regulate-crypto-national-treasury-unveils-draft-vasp-regulations-2026/)).

Key provisions:

- **Joint oversight by CMA + CBK** (not a new agency).
- **Local-company licensing only** — foreign companies need a compliance certificate first.
- **Physical office required** in Kenya.
- **Director KYC and competence assessment.**
- Strict rules on consumer protection, custody, and anti-money-laundering.

**Implication for Baraza.** The Kenyan operating entity must be Kenya-domiciled with a physical office, and the founder + signers must clear CMA/CBK background checks. This is the single largest legal-engineering work item before IDO opens to Kenyan participants. The investor whitepaper §11.1 already declares this as open; this brief sizes its priority — it is the #1 blocker, ahead of the Daraja approvals.

### 5.2 Other African jurisdictions

- **South Africa.** FSCA declared crypto assets financial products (Oct 2022 declaration). Any stokvel tokenization with a yield narrative pulls into FSCA's net. Mitigation: BRZA is participation, not yield.
- **Nigeria.** SEC Rules on Digital Assets (2022, as amended) — utility-token exemption exists but is narrow. Pre-launch counsel review required, per the counsel checklist.
- **Uganda, Tanzania, Ethiopia.** Lighter-touch markets. Cooperative law is the bigger constraint than crypto regulation.

---

## 6. The competitive map

| Cluster | Who | Strength | Why they don't take this market |
|---|---|---|---|
| **General DAO tooling** | Aragon (OSx), Snapshot, Tally, Safe | Mature primitives, large dev ecosystem | English-only, desktop-first, no mobile-money rail, no USSD, no Swahili. Aragon OSx is the protocol Baraza itself uses on EVM — they are infrastructure, not a competitor in our cohort |
| **Tokenized credit / EM RWA** | Goldfinch, Centrifuge, Huma | Real capital flowing into emerging-market credit | They underwrite fintechs/MFIs, not communities. They have no member-level ledger and no governance surface |
| **Tokenized treasuries** | BlackRock BUIDL, Ondo, Maple | Institutional yield, large AUM | Not addressing community treasuries. Useful as a downstream sweep for idle Baraza community cash, not as a competitor |
| **Banked chama products** | Equity Chama Account, KCB MyChama, Standard Bank stokvel accounts | Distribution, trust, low friction | Closed ledger, no governance primitives, no portability of reputation, no member-level voting weight, no token rewards |
| **Standalone chama apps** | ChamaSoft, M-Chama, ChamaPesa | Local presence, language fluency | No on-chain audit trail, no portable reputation, no RWA bridge, no token economy |
| **Crypto savings clubs** | A handful of small DAOs / Telegram pools | Crypto-native | Insolvably small scale, no mobile-money rail, no regulatory posture |

The defensible Baraza wedge sits where none of these clusters cover: **mobile-money-native onboarding × on-chain governance primitives × member-level reputation × RWA-compatible treasury.** Each cluster covers one or two; nobody covers all four. The competitive risk is not someone shipping the same product — it is one of these clusters acquiring the other capabilities by partnership before Baraza locks in the first 100K members.

---

## 7. What this implies for Baraza's roadmap

Direct, code-relevant consequences of the landscape above. Each one ties to a file or a phase in the existing PRD.

1. **Stellar is the right primary chain.** Centrifuge already chose Stellar for its emerging-market RWA bridge. BRZA-as-Stellar-asset gives Baraza a path to deRWA integrations without any cross-chain risk. Validates `app/src/lib/chains/config.ts` priority order.
2. **The reputation layer is the moat.** A community's on-chain dues + governance history is the underwriting input that lets RWA credit protocols actually lend to it. Phase 1 (mainnet verification → BRZA mint → indexer reconciliation) and Phase 4 (cross-chain BRZA) should be sequenced with this in mind. The bounty market (Phase 2) and Baraza TV (Phase 3) are secondary revenue surfaces; the credit-bridge optionality is the long-tail value driver.
3. **Wyoming's "DAO as limited liability cooperative" is the right legal framing externally.** When pitching investors or counsel, position BRZA-governed communities as *digital cooperatives*, not as DAOs. The cooperative framing already maps to Kenya's Cap. 490 and to SACCO regulatory expectations. The DAO framing is for crypto-native conversations.
4. **VASP Act, 2025 compliance is the #1 pre-IDO blocker.** Bump it above Daraja in the investor whitepaper's blocker list and the counsel checklist. Kenya-domiciled entity + physical office + director background checks are 8–12-week processes.
5. **Don't sweep treasuries to deRWA in Phase 0–3.** Mentioning it in marketing risks pulling Baraza into FSCA / CMA "financial product" classification. Hold this optionality for Phase 4+, after the legal posture is settled. The investor whitepaper currently follows this rule; do not relax it.
6. **Avoid the "yield-token" framing.** Goldfinch and Huma sell 10–17% APY headlines because their token-holders are crypto-native. Baraza's primary audience is community members for whom "we'll give you yield" reads as a Ponzi pitch and pulls regulator attention. Continue framing BRZA as participation + reputation.

---

## 8. Sources

- **RWA market sizing.** [CoinLaw — Asset Tokenization Statistics 2026](https://coinlaw.io/asset-tokenization-statistics/) · [BinaryX — RWA Outlook 2025](https://binaryx.com/blog/rwa-outlook-2025-asset-tokenization-market-to-reach-3-5-10t-by-2030) · [Mintlayer — $16-30T by 2030](https://www.mintlayer.org/blogs/16-30-trillion-by-2030-unlocking-the-rwa-opportunity) · [Tokenizer.Estate — RWA Forecasts](https://blog.tokenizer.estate/rwa-tokenization-forecast)
- **DAO market sizing.** [CoinLaw — DAO Statistics 2026](https://coinlaw.io/decentralized-autonomous-organizations-statistics/) · [Bitget Academy — DAO Governance Guide 2026](https://www.bitget.com/academy/dao-governance-guide) · [CoinLaw — DAO Treasury Holdings Statistics 2025](https://coinlaw.io/dao-treasury-holdings-statistics/) · [DeepDAO Substack](https://deepdao.substack.com/p/19m-governance-token-holders-managing)
- **EM RWA / private credit.** [Centrifuge — RWA Trends 2025](https://centrifuge.io/blog/real-world-asset-tokenization-trends-2025) · [Stablecoin Insider — Top 8 Tokenized Private Credit Platforms (May 2026)](https://stablecoininsider.org/top-8-tokenized-private-credit-platforms-delivering-8-to-15-apy-in-may-2026/) · [DIA — Goldfinch RWA Map](https://www.diadata.org/rwa-real-world-asset-map/goldfinch/) · [MetaMask — RWA Categories 2026](https://metamask.io/news/types-of-tokenized-real-world-assets-rwa-categories)
- **Stokvels & African chains.** [Lifestyle & Tech — Digitising SA's R50B Stokvel Economy](https://lifestyleandtech.co.za/smart-money/article/2026-03-19/digitising-south-africas-r50-billion-stokvel-economy-is-a-national-imperative) · [Hypertext — Digitised Stokvels (Nov 2025)](https://htxt.co.za/2025/11/digitised-stokvels-by-the-thousands-in-south-africa/) · [Ipsos — Stokvels: Untapped Human Banks](https://www.ipsos.com/en-za/stokvels-remain-untapped-human-banks-south-africa) · [Kennesaw — Trust the Masked Stranger: Stokvel Blockchain](https://digitalcommons.kennesaw.edu/acist/2023/presentations/26/)
- **Kenya SACCO / chama.** [SASRA — Kenya Regulated SACCO Sector Sept 2025](https://www.sasra.go.ke/2025/12/10/kenyas-regulated-sacco-sector-records-strong-performance-to-september-2025/) · [Sacco Review — SACCO assets KSh 1.21T](https://saccoreview.co.ke/sasra-report-sacco-total-assets-hit-ksh-1-21-trillion-mark/) · [MUIAA — Chamas in Kenya: Grassroots Empowerment](https://www.blog.muiaa.com/chamas-in-kenya-driving-grassroots-economic-empowerment/) · [Sacco Review — SASRA flags asset concentration](https://saccoreview.co.ke/sasra-flags-rising-asset-concentration-as-large-saccos-dominate-industry/)
- **Kenya VASP Act / regulation.** [Mariblock — Kenya Parliament passes VASP Bill](https://www.mariblock.com/kenya-edges-toward-crypto-regulation-as-parliament-passes-vasp-bill/) · [Njagaa Advocates — VASP Act 2025 Now Law](https://njagaadvocates.com/the-virtual-asset-service-providers-vasp-act-2025-is-now-law-a-new-era-for-crypto-digital-finance-in-kenya/) · [RBA Kenya — Draft VASP Regulations 2026](https://www.rba.go.ke/kenya-moves-to-regulate-crypto-national-treasury-unveils-draft-vasp-regulations-2026/) · [AMG Advocates — VASP Act analysis](https://www.amgadvocates.com/post/virtual-asset-service-providers-act)
- **DAO legal wrappers.** [Blockchain Council — DAO Legal & Compliance Guide 2026](https://www.blockchain-council.org/dao/dao-legal-and-compliance-guide-entity-structures-tax-regulatory-trends/) · [Legal Nodes — Marshall Islands LLC as DAO Wrapper](https://www.legalnodes.com/article/marshall-islands-llc-as-a-dao-legal-wrapper) · [DAObox — Top DAO Legal Wrappers](https://daobox.io/blog/top-dao-legal-wrappers-jurisdictions-global-guide) · [DAObox — Wrapper definitions & jurisdictions](https://docs.daobox.io/dao-legal-wrapper-design-and-creation/legal-wrappers-for-daos-definition-types-jurisdictions-and-use-cases)
- **Africa crypto regulation overview.** [Ripple — Crypto Regulation in Africa 2026](https://ripple.com/insights/crypto-regulation-in-africa/) · [WEF — Digital Assets Outlook 2026](https://www.weforum.org/stories/2026/01/digital-economy-inflection-point-what-to-expect-for-digital-assets-in-2026/) · [Grayscale — Tokenization Megatrend](https://research.grayscale.com/reports/investing-in-the-tokenization-megatrend)
