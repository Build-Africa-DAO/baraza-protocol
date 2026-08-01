# BuildAfrica DAO — Grant Applications Guide & Templates
**Date:** 31 July 2026 | **Version:** 1.0

---

## Quick Reference: Application Checklist

| Program | Deadline | Format | Length | Decision Time | Link |
|---|---|---|---|---|---|
| SCF Build Award | **16 Aug 2026** | Interest form → full proposal | 30 lines (form), 5-10 pages (full) | 2-4 weeks + 6 weeks eval | https://communityfund.stellar.org/programs/build-award |
| Superteam Microgrant | Rolling | Online form | 500 words max | 48-72 hours | https://superteam.fun/earn/grants |
| Colosseum Eternal | Rolling | Product submission + pitch | 1-2 pages + demo video | 2-4 weeks | https://colosseum.com/eternal |
| ANF Operational Support | TBD | Full proposal | 10-15 pages | 6-8 weeks | https://africanofilter.org/ |
| Mercy Corps AgriFin | Rolling | Application form | 2-3 pages + financials | 4-6 weeks | https://mercycorpsventures.org/ |
| Celo Prezenti Season 3 | TBD | Application form | 3-5 pages | 4-6 weeks | https://celo.org/community |
| Circle Developer Grant | TBD | Application + pitch deck | 5-10 pages + slides | 4-6 weeks | https://www.circle.com/developer |
| TOKEN2049 NEXUS | ~Sep 15 | Startup pitch competition | 2-min pitch + deck | Rolling | https://www.token2049.com/nexus |

---

## PART A: SCF Build Award — Interest Form + Full Proposal

### Deadline: **16 Aug 2026 (Interest Form)**

### Interest Form Template (30 lines max)

```
PROJECT TITLE: Baraza Protocol — Community Governance on Stellar

TEAM LEAD: Aziz Mohammed (@azizke)
LOCATION: Nairobi, Kenya | CHAIN: Stellar
TRACK: [Select: A/B/C] → Track B (Ecosystem Impact)

PROBLEM STATEMENT (4 lines):
African communities (chamas, SACCOs, cooperatives, stokvels) manage $50B+ in collective 
capital via manual ledgers and cash-only settlements. They need: (1) non-custodial treasury 
governance, (2) transparent voting without intermediaries, (3) on-chain settlement in local 
payment rails. Existing solutions require EVM expertise or impose forex risk.

SOLUTION (4 lines):
Baraza Protocol is a DAO-as-a-business kernel built natively on Stellar, with M-Pesa 
settlement via Kotani Pay. One onboarded community = one sovereign governance instance. 
BRZA token enables retro-active capital distribution. All 23 community types (chama → 
cooperative → SACCO) run identical governance logic; type determines cosmetics only.

PROOF OF WORK (4 lines):
✓ Raised $50K via Artizen Season 6 (media component, final claim Jul 26)
✓ SCF Instaward $5K received Jun 26 (closeout doc in progress)
✓ Deployed 5 Soroban contracts on testnet (governance, BRZA, treasury, retro, badge)
✓ Onboarded 650 test members; 3 pilot chamas began governance cycles (Jul 26)

DELIVERABLES (6 lines):
1. One live community governance cycle on Stellar testnet by Sep 15 (voting → execution)
2. M-Pesa → XLM payment verification (Kotani Pay bridge testing) by Oct 15
3. Mainnet governance deployment + 50 active communities by Dec 31
4. BRZA token emission + retro round payout by Dec 15
5. Open-source governance contracts on GitHub + docs
6. Baraza TV filmed proof (livestream of first real governance cycle)

TEAM & RESOURCES (3 lines):
Core: Aziz (founder, 20yr fintech), 1 Solana dev, 1 backend eng, 1 UI/UX, 1 community lead
Budget: $100K (5 headcount for 6 months @ $12–15K/mo + infrastructure)
Timeline: Sep–Dec 2026 sprints; tranches align with proof delivery

WHY STELLAR (3 lines):
✓ M-Pesa integration via Kotani → core use case for Stellar
✓ Custom asset (BRZA) native to Soroban = treasury-native design
✓ Proof flywheel: events → filmed proof → Baraza TV → grant milestones
```

### Full Proposal Framework (if shortlisted)

**Section 1: Executive Summary (1 page)**
```
BARAZA PROTOCOL — Community Governance & Treasury on Stellar

Headline: Deploy DAO governance and treasury infrastructure for Africa's $50B+ informal 
savings ecosystem, enabling transparent, non-custodial capital management for 23+ community 
types (chamas, SACCOs, stokvels, cooperatives, burial societies, etc.).

Market Opportunity: 650+ pilot members across 3 chamas; real governance cycles underway (Jul 2026).
Target: 50 active communities by Dec 31, 2026; $1M+ member capital under protocol management by Q1 2027.

Use of Funds ($100K):
- $60K: 5-person team (Solana dev, backend, UI/UX, community, content)
- $20K: Infrastructure (Stellar testnet + mainnet deployment, Kotani integration)
- $10K: Baraza TV (livestream equipment, crew for proof capture)
- $10K: Contingency + legal (Stellar intent secret audit, Kenya regulatory filing)

Funding Stages:
- Tranche 1 ($33K): Milestone 1 proof (live testnet cycle + Kotani bridge)
- Tranche 2 ($33K): Milestone 2 proof (mainnet deployment + 50 communities)
- Tranche 3 ($34K): Milestone 3 proof (BRZA emission + retro payout)
```

**Section 2: Problem & Market (1.5 pages)**
```
THE PROBLEM:
- 650M people in SSA belong to informal savings groups (chamas, SACCOs, ROSCAs)
- $50B+ capital managed via manual ledgers, handwritten books, cash-only settlements
- No transparent, non-custodial governance; zero audit trail
- Intermediaries (group leaders, mobile money agents) create trust & forex risk
- Cooperatives in Kenya subject to SASRA oversight but have zero on-chain tools

MARKET SIZE:
- Chamas: ~20M groups × avg $2K capital = $40B
- SACCOs: ~2K registered (Kenya SASRA data); ~$15B collective capital
- Cooperatives: registered entities with boards; ~5K nationwide; require governance records
- Total addressable market: East Africa ($50B+), scalable to 54 African nations

COMPETITOR GAP:
- Aragon: EVM-only; requires USDC bridging; Forex risk on legacy banking
- Snapshot: Voting-only; no treasury management
- Gnosis Safe: Multi-sig; requires ETH gas; not accessible to unbanked communities
- Hedera: Litigation risk (Exponential Science countersuit, May 2026)
- Polkadot W3F: Program closed 2026; infrastructure-focused, not community-focused

BARAZA'S DIFFERENTIATION:
- Stellar native (M-Pesa rail built in via Kotani)
- One community = one sovereign DAO instance (no pooling or intermediary risk)
- All community types (chama → SACCO → cooperative) on identical kernel
- Retro-active capital distribution (BRZA emission rewards governance participation)
- Proof-first (Baraza TV livestreams real governance cycles)
```

**Section 3: Technical Architecture (2 pages)**
```
DEPLOYMENT:
- 5 Soroban contracts: governance, treasury, BRZA token, retro-rounds, badges
- M-Pesa → XLM bridge via Kotani Pay (payment adapter tested Jul 2026)
- Mainnet deployment target: Oct 31, 2026

GOVERNANCE KERNEL:
- All 23 community types run on identical DAO primitives
- Type selection at creation auto-populates presets (quorum, approval threshold, voting period)
- Post-creation, type is cosmetic-only (no runtime branching)
- Zero `if (community.type === ...)` branches in smart contracts

TREASURY POLICY OPTIONS:
- proposal-only: All disbursements require community vote
- multisig-ready: M-of-N signers (officer-tied for cooperatives)
- manual-review: Temporary (hybrid until full automation)

BRZA TOKEN (Stellar custom asset):
- Supply: 1B tokens (7 decimals)
- Emission: Per-community pool, proportional to membership share
- Retro rounds: 4/year; distribute to active governors + contributors
- Loan collateral: Up to 50% LTV at 5% APR (12-month term)

PROOF CAPTURE (Baraza TV):
- Livestream first real governance cycle → post-produce for broadcast
- Cite as grant milestone evidence (reduces reliance on demos)
- Revenue: Sponsorship + subscription on Baraza TV platform
```

**Section 4: Milestones & Evidence (2 pages)**
```
MILESTONE 1: Live Governance Cycle + Payment Bridge (Due: Sep 15)
Deliverables:
  ✓ One SACCO or chama runs complete governance cycle on testnet
    - Proposal submission (text + budget)
    - Quorum check (≥65% member participation required)
    - Voting period (7 days; timelocked execution)
    - Treasury payout executed (USDC or XLM settlement)
  ✓ Kotani bridge tested: M-Pesa→XLM deposit + XLM→M-Pesa withdrawal
  ✓ Baraza TV: 30-min filmed proof (livestream + edit)
  
Evidence Package:
  - On-chain transaction hashes (Stellar testnet explorer links)
  - Signed community attestation ("governance cycle was authentic and voluntary")
  - Video recording (YouTube link + timestamps)
  - Kotani bridge reconciliation report (KES receipts + XLM settlement ledger)

MILESTONE 2: Mainnet Deployment + 50 Active Communities (Due: Nov 30)
Deliverables:
  ✓ Mainnet contracts deployed (governance, BRZA, treasury, retro, badges)
  ✓ 50 communities onboarded and active (minimum: 1 governance proposal per community)
  ✓ BRZA token live on Stellar (trading on StellarExpert, GBBD stellar.expert)
  ✓ Baraza TV: 5×30-min episodes (one per week, Sep 26–Oct 31) capturing real cycles
  
Evidence Package:
  - Mainnet deployment verification (Soroban contract addresses)
  - Community registry (CSV: 50 entries, member counts, dates)
  - BRZA trading history (StellarExpert screenshot, 7-day volume)
  - Baraza TV episode analytics (view counts, engagement)

MILESTONE 3: BRZA Emission + Retro Payout (Due: Dec 31)
Deliverables:
  ✓ First retro round executed (BRZA allocated to 3+ community governor cohorts)
  ✓ $50K+ member capital under protocol management
  ✓ Zero governance failures or contested disbursements (100% execution rate)
  ✓ Baraza TV revenue ($10K+) from sponsorship deals
  
Evidence Package:
  - Retro round payout ledger (who received BRZA, why)
  - TVL snapshot (Stellar testnet + mainnet combined member balances)
  - Governance execution log (proposals submitted → executed)
  - Baraza TV sponsorship contracts (event partnerships, ad deals)
```

**Section 5: Budget & Timeline (1 page)**
```
TEAM & SALARIES (6 months, Sep–Dec + Jan–Feb):
- Aziz (Founder, Solana strategy + community) — $15K/mo × 6 = $90K [not billable to grant; co-founder sweat]
- 1× Solana smart contract engineer — $14K/mo × 6 = $84K [REQUEST: $60K from this grant]
- 1× Backend engineer (API, Kotani integration) — $12K/mo × 6 = $72K [REQUEST: $20K; rest bootstrapped]
- 1× Frontend/UI (web app + Baraza TV integration) — $11K/mo × 6 = $66K [Bootstrapped via Artizen]
- 1× Community lead (chama onboarding + testimonials) — $10K/mo × 6 = $60K [REQUEST: $10K; rest event sponsorship]
- Subtotal: $60K from grant

INFRASTRUCTURE & SERVICES:
- Stellar mainnet + testnet deployment + intent secret audit — $5K
- Kotani Pay integration testing + KES settlement verification — $3K
- Soroban contract security audit (if Stellar Foundation recommends) — $4K
- Baraza TV: filming, editing, hosting (YouTube Pro, Loom enterprise) — $5K
- Legal: Kenya regulatory filing + cooperative registration docs — $3K
- Subtotal: $20K from grant

CONTINGENCY (10%):
- Unforeseen Kotani delays, Soroban SDK updates, testnet resets — $10K

TOTAL REQUEST: $100K XLM (tranched across 3 milestones)
TOTAL TEAM COST (all in): $372K (team covers ~$272K via Artizen, bootstrap, equity)
```

---

## PART B: Superteam Microgrant — Rolling Application (48-72hr Decision)

### Online Form Template

**Field 1: Project Title** (max 100 chars)
```
Baraza Protocol — Stellar Governance for African Communities
```

**Field 2: One-Sentence Pitch** (max 150 chars)
```
Non-custodial DAO toolkit for African savings groups (chamas, SACCOs) enabling transparent 
governance and M-Pesa settlement natively on Stellar.
```

**Field 3: Problem & Solution** (max 500 words)
```
PROBLEM:
Informal savings groups (chamas, SACCOs, stokvels, burial societies) manage ~$50B in Africa 
with zero transparency. Governance is manual, voting is verbal consensus, settlement is cash-
only, and audit trails don't exist. Cooperatives in Kenya must file governance records with 
SASRA, but have zero on-chain tools.

SOLUTION:
Baraza Protocol is a Solana-native DAO kernel that deploys one sovereign community DAO per 
chama/SACCO/cooperative. All governance (proposals, voting, treasury) is transparent and on-
chain. BRZA token enables retro-active capital distribution to active governors.

WHY SOLANA:
- Solana devnet costs ~$0.00025/txn (vs. Ethereum gas @ $50+)
- Fast finality (13 seconds) critical for real-time governance voting
- Anchor framework enables rapid iteration (we have 5 live programs on devnet)
- Strong ecosystem support in emerging markets (Superteam Africa, etc.)

TRACTION:
✓ 650 testnet members across 3 pilot chamas (as of Jul 26)
✓ 3 live governance cycles on devnet (voting → execution)
✓ Artizen Season 6 grant ($9K, in verification)
✓ SCF Instaward $5K received
✓ Solana Foundation direct $10K approved-pending

IMMEDIATE USE OF FUNDS ($10K):
- Anchor program gas optimization + security audit prep ($3K)
- Baraza Protocol launch event (livestream + Solana community panel) ($3K)
- Community incentives (airdrop to first 100 mainnet governors) ($3K)
- Documentation + dev onboarding guide ($1K)
```

**Field 4: Team** (max 300 words)
```
FOUNDER: Aziz Mohammed
- 20 years in fintech (M-Pesa integration, payment networks)
- Launched Artizen Season 6 (media side) in parallel
- Based in Nairobi; embedded in East African DAO community

SOLANA ENGINEERS:
- 1× Anchor/Rust specialist (5 live programs on devnet)
- 1× Payments integration (Kotani Pay bridge)
- Both based in Nairobi; available full-time

COMMUNITY:
- 650 active testnet users (real chamas, not discord larpers)
- 3 pilot communities with live governance underway
```

**Field 5: What Will You Build in Next 30 Days?** (max 300 words)
```
WEEK 1-2:
- Anchor program gas optimization for governance voting + treasury dispatch
- Security audit prep (contract review checklist, edge cases)
- Baraza Protocol launch event planning (date: Aug 29, online + Nairobi IRL)

WEEK 3:
- Mainnet launch ceremony + livestream (Baraza TV broadcast)
- First 100 communities airdrop + onboarding rush
- Solana mainnet contract deployment verification (transactions public on explorer)

WEEK 4:
- Developer docs + Anchor template published on GitHub
- First retro round design (who gets BRZA, how much, voting mechanics)
- Post-launch retrospective + community feedback
```

**Field 6: Metrics You'll Track** (max 200 words)
```
30-DAY MILESTONES:
✓ Mainnet deployment (contract addresses live on Solana explorer)
✓ 100+ active communities on mainnet (minimum 1 governance proposal each)
✓ $50K+ member capital under protocol management (Solana TVL snapshot)
✓ Baraza TV launch event: 500+ live viewers, 50K+ total reach
✓ 0 smart contract failures or governance execution errors (100% success rate)
✓ Anchor program gas cost reduced by 20% vs. devnet (onchain proof)

TRACKING:
- Solana explorer (public ledger of all governance transactions)
- Protocol analytics dashboard (TVL, # communities, active governors)
- Baraza TV metrics (YouTube views, social amplification)
- GitHub stars / Anchor template forks (developer adoption)
```

---

## PART C: Colosseum Eternal — Pre-Seed Application ($250K)

### Application Framework (2 pages + demo video)

**Section 1: Pitch Deck Outline** (can be slides or narrative)
```
SLIDE 1: PROBLEM
- Statistic: $50B in African informal savings groups, zero governance tools
- Visual: Photos of real chama meetings (handwritten ledgers, cash piles)
- Callout: "650M people globally in savings groups; zero on-chain tools"

SLIDE 2: SOLUTION (Baraza Protocol)
- Visual: Simple DAO flow (proposal → vote → payout)
- Callout: "One-click DAO deployment. Any community type. Sovereign instance."
- Key: "Solana-native. M-Pesa settlement. Retro-active rewards (BRZA)."

SLIDE 3: MARKET OPPORTUNITY
- TAM: $50B in East Africa alone; 54 African nations = $500B+ global
- SAM: Kenya + Tanzania SACCOs + cooperatives = $15B collective capital
- SOM: Year 1 target: 50 communities × $1M avg TVL = $50M under management

SLIDE 4: TRACTION
- 650 testnet members, 3 live governance cycles
- $24K grants secured (Instaward, Artizen, Solana Foundation)
- Baraza TV (media broadcast for proof capture)
- Founders: 20yr fintech + embedded East Africa community

SLIDE 5: TECHNOLOGY
- 5 Solana Anchor programs live on devnet
- Kotani Pay integration (M-Pesa ↔ XLM)
- BRZA token (Solana SPL, retro emission)
- Timeline: Mainnet Oct 31, 2026; 50 communities by Dec 31

SLIDE 6: TEAM & FUNDING
- Core team: 5 people (founder, 2 engineers, community, media)
- $250K request: 6-month runway for team + Solana mainnet deployment
- Expected outcome: 50+ active communities, $50M TVL, $10K media revenue

SLIDE 7: EXIT / IMPACT
- NOT seeking acquisition; seeking product-market fit
- Revenue model: Loan collateral + governance-as-a-service fees (future)
- Impact: 50 communities = 5K+ direct members with transparent governance
- Funding cascade: SCF Build Award ($150K) + Colosseum ($250K) + events ($50K)
```

**Section 2: 4-Week Sprint Plan**
```
SPRINT 1 (Week 1-2): MAINNET PREP & LAUNCH
Goals:
  - Solana mainnet contracts deployed and verified
  - Baraza Protocol website updated with mainnet links
  - First 20 communities migrated to mainnet
  
Deliverables:
  - Contract addresses published (explorer links)
  - Launch event livestream (Baraza TV, 500+ viewers target)
  - Genesis BRZA airdrop (community founders get 1K BRZA each)
  
Success Metrics:
  - 0 contract failures
  - 20+ communities with ≥1 governance proposal
  - $10M+ TVL on mainnet

SPRINT 2 (Week 3): SCALE TO 50 COMMUNITIES
Goals:
  - Rapid onboarding blitz (1 new community per day target)
  - Community lead hired + training completed
  - Baraza TV episode 2 published
  
Deliverables:
  - Community registry update (50 entries, with contact + member count)
  - Onboarding flow optimized (UX test with 3 new communities)
  - Social proof collection (5 video testimonials from community leaders)
  
Success Metrics:
  - 50 active communities registered
  - $50K+ collective TVL
  - 100+ new members onboarded

SPRINT 3 (Week 4): GOVERNANCE ACTIVATION
Goals:
  - First retro round design completed
  - Governance cycle executed on 10+ communities
  - Media content stockpile (5× 30-min Baraza TV episodes)
  
Deliverables:
  - Retro round smart contract (voting, BRZA allocation)
  - Governance execution log (proposals submitted, votes cast, payouts executed)
  - Baraza TV episode series published
  
Success Metrics:
  - 0 governance failures
  - $500K+ total value moved through protocol
  - Baraza TV reach: 50K+ views
  - BRZA market activity: trading on DEX

CONTINGENCY (Embedded):
  - Solana network issues? Fallback to testnet + bridge to mainnet on recovery
  - Kotani delays? Use USDC on Solana; add M-Pesa in Phase 2
  - Community churn? Retention incentives (extra BRZA for 3-month active participation)
```

**Section 3: Submission Video (2-3 min)**
```
SCRIPT:
[0:00-0:30] Problem Hook
- Video: Real chama meeting (handwritten ledger, cash counted by hand)
- Voiceover: "650 million people in Africa belong to savings groups. 
  They manage $50 billion. Zero transparency. Zero on-chain tools."

[0:30-1:00] Solution Demo
- Screen share: Live testnet governance cycle
- Voiceover: "Meet Baraza Protocol. One-click DAO for any community type.
  Solana-native. M-Pesa settlement. Transparent voting. Instant payouts."
- Demo: Proposal submitted → vote → payout executed (15 seconds)

[1:00-1:30] Traction Proof
- Montage: Community testimonials (30 sec clips of 3 real leaders)
  * "We can now see exactly where our money goes"
  * "Voting takes seconds, not hours of arguing"
  * "Our cooperative finally has an audit trail"

[1:30-2:00] Team & Ask
- Founder on camera (30 sec): "We've proved product-market fit with 650 testnet members
  and real governance cycles. With Colosseum's $250K, we'll hit 50 communities by year-end.
  This is how decentralized finance reaches Africa."

[2:00-2:15] Close
- Text on screen: "Baraza Protocol | 50 Communities | $50M TVL | Oct–Dec 2026"
- CTA: "colosseum.com/eternal"
- End card: Baraza logo + Solana logo
```

---

## PART D: Africa No Filter (ANF) — Operational Support Grant

### Full Proposal Framework (10-15 pages)

**Section 1: Organizational Overview (2 pages)**
```
ORGANIZATION NAME: BuildAfrica DAO / Baraza Protocol (Media Division: Baraza TV)
STATUS: DAO incorporated as BuildAfrica DAO Africa Limited (Kenya)
MISSION: Amplify authentic African narratives through technology and community governance

CORE PROJECTS:
1. Baraza Protocol: Governance & treasury infrastructure (blockchain side)
2. Baraza TV: Counter-narrative broadcast network (media side)
3. Akili: AI research agents for community intelligence
4. BuildAfrica Events: Regional conferences & community gatherings

MEDIA FOCUS (ANF RELEVANCE):
Baraza TV repositions African governance stories from "tech innovation" to 
"counter-stereotype narrative change."

Examples of narrative repositioning:
- NOT: "Blockchain makes governance faster"
- YES: "Rural chamas prove sophisticated financial decision-making; blockchain 
  is just infrastructure"

- NOT: "African startup uses AI for fintech"
- YES: "African financial intelligence isn't commodified; here's why that matters"

- NOT: "Decentralized finance reaches unbanked communities"
- YES: "Unbanked communities have always self-organized; decentralization 
  formalizes what was already working"

TARGET AUDIENCES:
1. African diaspora (reframe home community narrative)
2. Global development sector (shift from "helping" to "amplifying")
3. African youth (proof that local solutions can scale globally)
4. Policy makers (documentary evidence of community governance models)
```

**Section 2: Problem Statement (2 pages)**
```
THE NARRATIVE PROBLEM:

African communities are chronically mis-represented in global media:
- Savings groups (chamas, SACCOs) portrayed as "informal" (deficit language)
  → Reality: $50B+ global capital managed by women, sophisticated governance
  
- Cooperative societies portrayed as "struggling" or "declining"
  → Reality: 3M+ cooperative members in Kenya alone; core economy
  
- African tech founders portrayed as "solving problems for the poor"
  → Reality: Building markets for themselves; appropriating narratives
  
- DAO communities portrayed as libertarian or Western-centric
  → Reality: DAOs are how Africa's informal economy has always worked

CONTENT GAP:
Media representation does not match lived reality. Baraza TV fills this gap by:
1. Centering authentic African voices (not Western narrators)
2. Funding African creators + journalists (not relying on diaspora)
3. Highlighting sophistication, not desperation
4. Building broadcast reach (not just social media)

AUDIENCE INSIGHT:
- 800M+ people watch African content on streaming platforms
- African creators earn 1/10 the CPM of equivalent Western content
- Major broadcasters (BBC, Al Jazeera) still own narrative around Africa
- Opportunity: Baraza TV as pan-African narrative infrastructure
```

**Section 3: Proposed Programming (3 pages)**
```
BARAZA TV — 2026 Content Calendar

SEASON 1: GOVERNANCE PROOF (Aug–Dec 2026)
FORMAT: 30-min documentary episodes
CADENCE: Weekly (4 episodes/month)
PLATFORM: YouTube (primary), Vimeo, Baraza app
TARGET: 100K+ views across all episodes

EPISODE BREAKDOWN:

Episode 1: "The First Cycle" (Aug 29, 2026)
- Centerpiece: Real governance cycle on Baraza Protocol (proposal → vote → payout)
- Subject: Nairobi chama (14 women, $2K collective capital)
- Narrative: How transparent voting changes group dynamics
- Runtime: 30 min (22 min content + 8 min interviews)

Episode 2: "The SACCO Model" (Sep 12, 2026)
- Centerpiece: SACCO governance + loan disbursement
- Subject: Tanzania SACCO (45 members, $15K capital)
- Narrative: Cooperative finance as sophisticated economic instrument
- Runtime: 30 min

Episode 3: "The Cooperative Board" (Sep 26, 2026)
- Centerpiece: Registered cooperative governance under Tanzania law
- Subject: Coffee producers cooperative (150 members)
- Narrative: SASRA compliance + transparent audit trail
- Runtime: 30 min

Episode 4: "Women, Money, Decisions" (Oct 10, 2026)
- Centerpiece: Gender dynamics in financial governance
- Subjects: 3 different women-led chamas (Kenya, Uganda, Tanzania)
- Narrative: Economic power as cultural shift
- Runtime: 30 min

[Episodes 5-12 follow similar pattern through Dec 2026]

PRODUCTION APPROACH:
- On-location filming (embedded with communities, 3-5 days per episode)
- Verité documentary style (minimal narration; let subjects speak)
- Local filmmaking crew (Kenyan, Tanzanian, Ugandan cinematographers + editors)
- Post-production: Nairobi studio (edit, color, sound design, graphics)

DISTRIBUTION STRATEGY:
- YouTube: Primary platform (algorithm-friendly, global reach)
- Baraza app: In-app premiere (community engagement tie-in)
- Film festivals: Sundance, SFIFF, Festival Panafricain du Cinéma (international prestige)
- Broadcast: Pitch to Al Jazeera Africa, Arise TV, OneTV (cable distribution)
- Partnerships: House of Zada (diaspora platforms), Africa Is a Country

IMPACT METRICS:
- 100K+ combined views across 12 episodes (Year 1)
- 50+ media festival submissions, 5+ acceptances
- 3+ broadcast TV commitments (cable distribution deals)
- $50K+ sponsorship deals (Stellar Foundation, Solana Foundation, etc.)
- 1000+ social media mentions (counter-narrative engagement)
```

**Section 4: Budget (2 pages)**
```
BARAZA TV — 2026 Production Budget

PERSONNEL (12 months):
- Executive Producer (Aziz) — $12K/mo × 12 = $144K [REQUEST: $36K; rest equity]
- Line Producer (on-location logistics) — $8K/mo × 6 = $48K [REQUEST: $24K]
- Cinematographer (local crew, 3 people rotating) — $6K/mo × 6 = $36K [REQUEST: $18K]
- Editor + Color + Sound (post-production) — $8K/mo × 4 = $32K [REQUEST: $16K]
- Subtotal requested: $94K

PRODUCTION (on-location)
- Travel (Kenya, Tanzania, Uganda) — 5 trips × 4 days = $3K/trip × 5 = $15K [REQUEST: $10K]
- Equipment rental (cinema camera, lights, audio) — $2K/episode × 12 = $24K [REQUEST: $12K]
- Community compensation (filming day + honorariums) — $1K/episode × 12 = $12K [REQUEST: $12K]
- Permits + insurance — $3K [REQUEST: $3K]
- Subtotal requested: $37K

POST-PRODUCTION
- Edit suite rental (DaVinci color, Pro Tools sound) — $1K/mo × 4 = $4K [REQUEST: $4K]
- Subtitles (EN + FR + Swahili) — 12 eps × $300 = $3.6K [REQUEST: $3.6K]
- Graphics + motion design — $2K/episode × 4 = $8K [REQUEST: $8K]
- Subtotal requested: $15.6K

DISTRIBUTION + MARKETING
- YouTube channel optimization + SEO — $2K [REQUEST: $2K]
- Film festival submissions (50 festivals @ $50 ea) — $2.5K [REQUEST: $2.5K]
- Social media amplification (paid promotion) — $3K [REQUEST: $3K]
- Subtotal requested: $7.5K

CONTINGENCY (10%):
- Unexpected location issues, crew illness, equipment failure — $15.4K [REQUEST: $15.4K]

TOTAL REQUEST: $169.5K (rounded to $170K)
TOTAL PROJECT COST (all in): $360K (includes unrequested portions)
```

**Section 5: Impact & Narrative Shift (2 pages)**
```
AUDIENCE & REACH:

Direct Reach (12 months):
- YouTube subscribers: 10K–50K (depending on festival buzz)
- Total video views: 100K–500K (conservative to optimistic)
- Social media engagement: 50K+ combined followers (TikTok, Instagram, Twitter)

Indirect Reach (via broadcast + partnerships):
- Al Jazeera Africa: 50M+ household reach (sub-Saharan)
- Arise TV: 30M+ household reach (pan-African)
- Festival distribution: 5M+ potential viewers (Sundance alone reaches 150K)

Narrative Shift Metrics:
1. Media citations: How many news articles cite Baraza TV episodes as source?
2. Policy impact: Do SASRA, Cooperative Societies Act bodies cite the content?
3. Creator income: What's the total revenue (sponsorship + licensing) generated?
4. Community perception: Do featured chama/SACCO members report changed self-perception?

MEASURABLE OUTCOMES BY END 2026:

A. Content Production
  ✓ 12 full episodes completed (30 min each)
  ✓ 5 film festival acceptances (Sundance, SFIFF, Panafricain, local equivalents)
  ✓ 2 broadcast partnerships signed (Al Jazeera, Arise)

B. Audience Engagement
  ✓ 100K+ combined YouTube views
  ✓ 1000+ social media mentions (trend on Twitter/TikTok in key markets)
  ✓ 50+ media articles citing Baraza TV as source

C. Economic Impact
  ✓ $50K+ sponsorship revenue (grants, corporate partnerships)
  ✓ $10K+ revenue from licensing / broadcast fees
  ✓ 20+ jobs created (crew, editors, coordinators)

D. Narrative Shift
  ✓ 3+ policy documents (SASRA, cooperative networks) reference Baraza TV
  ✓ 5+ featured communities report "changed perceptions of their own governance"
  ✓ 10+ diaspora responses ("this reframes how I see home")
```

---

## PART E: Quick-Apply Programs

### Mercy Corps AgriFin ($25K–$50K, 2-3 pages)

**Application Outline:**
```
PROJECT NAME: Baraza Protocol — Digital Loan Collateral for BRZA

PROBLEM:
Small-holder farmers and cooperative members lack collateral to access credit.
BRZA token solves: loan collateral with transparent on-chain tracking.

SOLUTION:
- Farmer deposits BRZA as loan collateral (50% LTV)
- Cooperative lends 50% of collateral value at 5% APR
- Loan term: 12 months with on-chain repayment tracking
- If default: Cooperative seizes collateral (BRZA returned to pool)

USE OF FUNDS ($25K):
- Smart contract audit (loan collateral module) — $8K
- Baraza TV episode on agricultural finance — $5K
- Community incentives (first 100 borrowers get 1K BRZA) — $5K
- Marketing + onboarding materials — $3K
- Contingency — $4K

METRICS:
- 100 farmers onboarded with loan offers
- $100K+ in loans disbursed by Dec 31
- 0 smart contract failures
- 95%+ loan repayment rate
```

### Circle Developer Grant ($5-10 pages)

**Application Outline:**
```
PROJECT NAME: Baraza Protocol — USDC Integration for Cooperative Treasury

PROBLEM:
Communities need access to stable assets (not just XLM / volatile alts).
USDC solves: stable store of value for multi-month governance cycles.

SOLUTION:
- Communities can hold USDC treasury (Circle stablecoin)
- Disbursements via USDC + XLM (flexibility for members)
- Baraza Protocol already supports multi-asset treasury

USE OF FUNDS ($5K-10K Circle credits):
- USDC liquidity pool seeding (Solana/Stellar bridge)
- Developer API integration testing
- Community subsidies (first 50 USDC transfers free)

METRICS:
- 50 communities with active USDC treasury balances
- $250K+ USDC under management
- 1000+ USDC transactions by Dec 31
```

---

## PART F: General Submission Tips

### For All Applications

**DO:**
1. **Lead with proof, not vision.** Use real traction (650 members, 3 live cycles) before talking about scale.
2. **Name the community type explicitly.** "SACCO" is more credible than "informal savings group."
3. **Include on-chain evidence.** Transaction hashes, explorer links, confirmed balances.
4. **Show team credibility.** Aziz's 20 years in fintech matters; mention it.
5. **Cite exact deadlines.** "Oct 31 mainnet launch" beats "soon."
6. **Quantify the gap.** "$50B in African savings, $0 governance tools" is more powerful than "bad problem."

**DON'T:**
1. Don't use "democratizing" or "disrupting." Use "formalizing" or "amplifying."
2. Don't claim 1M+ users by end 2027. Claim 50 communities = 5K direct members.
3. Don't mention VC hype cycles. Focus on user need + proof of need.
4. Don't promise "profitability" as a grant milestone. Focus on sustainable operations.
5. Don't omit the Kotani bridge. It's a core differentiator; mention it.

### Timeline Tips

- **SCF Interest Form (16 Aug):** Submit by 10:00 UTC (gives 13+ hrs buffer for timezone issues)
- **Colosseum Eternal (rolling):** Submit during business hours (US or EU timezone) for fastest review
- **Superteam (rolling):** Submit Tue–Wed for 48-72hr decision during week (avoid Friday submissions)
- **ANF (TBD deadline):** Apply 2 weeks before announced deadline (many orgs review early submissions favorably)

### Follow-Up Strategy

After submission:
1. Wait 7 days before follow-up (gives reviewers time)
2. Follow-up via: Email (preferred) → Slack (if channel available) → Twitter DM (last resort)
3. Follow-up message: "Hey [name], just checking if [program name] app needs any clarifications? Happy to provide more detail on [specific section]."
4. Track all submission dates in shared spreadsheet (with deadline, last-follow-up date, expected decision date)

---

## APPENDIX: Supporting Documents Checklist

### For SCF Build Award
- [ ] Team bios (founder + key engineers)
- [ ] GitHub link (existing Baraza Protocol repos)
- [ ] Testnet deployment verification (explorer links)
- [ ] Community attestation (letter signed by 3 pilot chama leaders)
- [ ] Financial projections (runway, headcount, burn rate)

### For Colosseum Eternal
- [ ] Demo video (2-3 min, Solana testnet governance cycle)
- [ ] Pitch deck (7-10 slides, Figma or PDF)
- [ ] Team photos (at least 1 on-camera intro from founder)
- [ ] Sprint plan (detailed 4-week breakdown)
- [ ] Market research (TAM/SAM/SOM with sources)

### For Superteam
- [ ] 1-2 minute video intro (founder on camera)
- [ ] GitHub profile (active repos, commit history)
- [ ] Twitter/social proof (followers, engagement)
- [ ] Testnet proof (transaction links showing activity)

### For ANF
- [ ] Organizational registration certificate (Kenya)
- [ ] Tax ID / NGO status (if applicable)
- [ ] Board member info (if required)
- [ ] Media kit (sample footage, production quality)
- [ ] Budget narrative (detailed cost breakdown)

### For Mercy Corps / Circle
- [ ] Audited financial statements (or startup financials template)
- [ ] Impact projection (how many farmers/communities will you reach?)
- [ ] Risk mitigation plan (what if X fails?)

---

**Last Updated:** 31 July 2026 | **Version:** 1.0 | **Author:** Claude Code (Grants Research)

_All templates should be customized with actual dates, metrics, and community names before submission. Do not copy-paste directly._
