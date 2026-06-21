# Baraza Protocol — Product Requirements Document

**Last updated:** 2026-06-06 (community research added)  
**Status:** Active development — UI prototype complete, backend not started  
**Stack:** Next.js 16.2.6 · React 19 · TypeScript · Tailwind CSS 4

---

## 1. Overview

Baraza Protocol is a Web3 treasury and governance platform built for African community finance groups — DAOs, SACCOs (Savings and Credit Cooperatives), and Chamas (informal investment circles). The name "Baraza" is Swahili for a community meeting place.

**The gap it fills:** No existing African DAO platform (AfricaDAO, Celo Africa DAO, Burstek) provides a governance and treasury layer purpose-built for SACCOs and Chamas — the dominant form of community finance in Kenya and East Africa, collectively managing ~KES 300B ($3.4B) in Kenya alone.

---

## 2. Total Addressable Market

### Community Types and Market Size

| Community Type | Local Names | # of Groups | Assets Managed | Key Pain Point |
|---|---|---|---|---|
| **ROSCAs / Rotating savings** | Chama (KE), Stokvel (ZA), Susu (NG/GH), Tontine (FR Africa), Equb (ET), Djanggi (CM), Xitique (MZ), Hagbad (SO) | 300,000+ in Kenya alone; 1B+ people globally | $3.4B (KE) · $500B+ globally | Fraud, member dropout, geographic limits |
| **SACCOs / Credit unions** | SACCO (EA), Credit Union (GH/ZA) | 30,000+ registered in Kenya · 14M members | KSh 1.7T (~20% of Kenya GDP) | Elite capture, audit failures, insider lending |
| **Investment clubs** | Investment Chama, Safari DAO, Joint Ventures | Subset of 300,000 chamas | Hundreds of millions KSh in property | High formalization cost, ownership disputes |
| **Agricultural cooperatives** | Dairy/Coffee Co-ops, Smallholder Collectives, Shamba Networks | Thousands across Africa | 42% of Kenya's GDP tied to agriculture | Middleman exploitation, no collateral for credit |
| **Diaspora DAOs / Digital nations** | Afropolitan, NairobiDAO, Kenya Blockchain Ladies DAO, H.E.R. DAO | Emergent, fast-growing | $2.1M+ raised (Afropolitan alone) | Governance fatigue, technical onboarding |
| **Stokvels / Burial societies** | Stokvel (ZA), Burial Society | 800,000 groups in South Africa · 11M members | R50B+ annual contributions (ZA) | Treasurer fraud, no digital ledger |
| **Housing cooperatives** | Housing Chama, Land-buying groups | Thousands across EA | KSh 1M–500M+ per group | Ownership disputes, illiquid shares, land fraud |

### Geographic Expansion Priority

| Rank | Country | Tradition | Market Signal | Readiness |
|---|---|---|---|---|
| 1 | **Kenya** | Chama, SACCO | 300K groups · KSh 300B | High — primary market |
| 2 | **South Africa** | Stokvel, Burial Society | 800K groups · R50B/yr | High — digital-ready |
| 3 | **Egypt** | Gam'eya | 8M users on MoneyFellows already | Very high — already digitized |
| 4 | **Nigeria** | Susu/Osusu, Ajo, Esusu | Largest diaspora, Afropolitan base | High — Web3-native users |
| 5 | **Ghana** | Susu, Credit Unions | 7× growth in women's accounts | High — mobile money penetration |
| 6 | **Ethiopia** | Equb | Coffee co-op export history | Medium — scaling trust networks |
| 7 | **Cameroon** | Njangi/Djanggi | Sarafu feasibility study done | Medium |
| 8 | **Tanzania / Uganda** | SACCO, M-Pawa | 200+ SACCOs on Wakandi | Medium — East Africa expansion |

---

## 3. Target Users

### Persona 1 — The Community Organizer / Treasurer
**"Mama Chama"**

| Attribute | Detail |
|---|---|
| Age | 30–45 |
| Gender | Predominantly female (68% of Chama leadership is women) |
| Income | KES 35,000–50,000/month (mid-income) |
| Location | Urban & peri-urban Kenya, East Africa |
| Tech literacy | Moderate — M-Pesa power user, basic smartphone apps |
| Device | Android smartphone |
| Motivation | Financial independence, community impact, scaling the group |
| Pain point 1 | No formal credit history → banks reject loan applications |
| Pain point 2 | Personal collateral required → can't grow treasury |
| Pain point 3 | High M-Pesa fees on group transactions eat into savings |
| Switch trigger | Community-vouched onboarding + movable collateral loans |
| Adoption barrier | Distrusts new systems; needs familiar M-Pesa-like UX |
| UX requirement | Wallet-less interface, no "seed phrase", social recovery |

---

### Persona 2 — The Contributor / Bounty Hunter
**"The Builder"**

| Attribute | Detail |
|---|---|
| Age | 18–30 (Gen Z + younger Millennial) |
| Gender | 64% male / 36% female |
| Income | KES 10,000–35,000/month, irregular gig earnings |
| Location | Urban Kenya, Nigeria, Ghana — and globally remote |
| Tech literacy | High — digital native, learns via YouTube/TikTok/Twitter |
| Device | Smartphone + laptop |
| Motivation | Skill building, USD income, reputation as digital resume |
| Pain point 1 | Loses 8.9% avg on international client payments |
| Pain point 2 | No recourse when bounty is not paid |
| Pain point 3 | No formal employment benefits or contracts |
| Switch trigger | Stablecoin escrow payments + on-chain reputation score |
| Adoption barrier | Crypto scam distrust; needs verified peer reviews |
| UX requirement | Human-readable smart contracts, in-app micro-learning rewards |

---

### Persona 3 — The Everyday Member / Saver
**"Mama Mboga"**

| Attribute | Detail |
|---|---|
| Age | 25–34 |
| Gender | Balanced (slightly male-skewed in digital surveys) |
| Income | Below KES 10,000/month (low-income) |
| Location | Urban & rural Kenya, East/West Africa |
| Tech literacy | Basic — uses M-Pesa for send/receive, limited app experience |
| Device | Low-cost smartphone, limited data plan |
| Motivation | Emergency buffer, children's school fees, household resilience |
| Pain point 1 | High fees make formal banking unviable for small amounts |
| Pain point 2 | 57% lack reliable internet → app-only banking fails them |
| Pain point 3 | Deep distrust of institutions after past fraud |
| Switch trigger | Offline-capable + transparent low-cost savings |
| Adoption barrier | Blockchain jargon is alienating; needs USSD-like simplicity |
| UX requirement | Icon-based nav, voice prompts in Swahili, stablecoin default |

---

### Persona 4 — The Diaspora Member
**"Abroad Kenyan"**

| Attribute | Detail |
|---|---|
| Age | 30–55 |
| Gender | Mixed |
| Income | High (relative to home country) |
| Location | UK, US, UAE, Germany — sending to Kenya/Nigeria/Ghana/Ethiopia |
| Tech literacy | High — comfortable with apps, fintech, investing |
| Device | High-end smartphone + laptop |
| Motivation | Supporting family; investing back home with control |
| Pain point 1 | Remittance fees to Sub-Saharan Africa are highest globally |
| Pain point 2 | Can't control how funds are spent after sending |
| Pain point 3 | No structured way to invest in local community projects |
| Switch trigger | Near-zero fees + purpose-locked "Education/Health" tokens |
| Adoption barrier | Recipient can't easily cash out → needs local agent network |
| UX requirement | Dual-language receipts, direct-to-service tokens, status sync |

---

### Market-Level Stats

| Signal | Number |
|---|---|
| M-Pesa monthly active users (Kenya, 2025) | 35.8M |
| Mobile money penetration — Kenya adults | 82% |
| Africa mobile money transactions (2024) | $1.1T (74% of global) |
| Unbanked African adults | 350M |
| African diaspora annual remittances | $104B+ |
| Nigerians owning crypto wallet (2024) | 84% |
| South Africans owning crypto wallet (2024) | 66% |
| Gen Z share of global crypto users | 28% |
| Millennial share of global crypto users | 40% |
| Women reinvesting income in community | 90% |

**Primary geography:** Kenya, East Africa  
**Secondary:** Nigeria, Ghana, South Africa, Egypt, diaspora globally

---

## 3. Current State (UI Prototype)

### What exists
- **Home page** with animated hero, tab navigation, URL-synced routing (`/?tab=daos`)
- **DAOs tab** — 6 hardcoded DAOs, filter by network, search by name
- **Chamas tab** — 6 hardcoded Chamas, filter by type, search
- **Bounties tab** — 6 hardcoded bounties, filter by skill, sort by reward/deadline, live stats bar
- **Contributors tab** — 6 hardcoded members, filter by role, search
- **Notification system** — global context, `markRead`, `markAllRead`, unread count, inbox page
- **Header** — logo, nav, wallet connect button (stub), network badge (hardcoded "Solana")

### Known bugs
- `Contributors.tsx:176` — `activeSort` state is set but never applied; list always renders in original order
- `page.tsx:76,80,97` — "About", "Explore", "Launch" nav buttons all route to `daos` tab instead of real pages
- "Connect" wallet button is a dead `<button>` with no handler
- "View profile", "Become a member", "Submit work" buttons have no destinations — no detail pages exist

### What does not exist
- No API routes (`/app/api/` directory absent)
- No server actions (`"use server"`)
- No shared TypeScript types — each component inlines its own data shapes
- No database or data persistence
- No wallet integration
- No smart contracts
- No detail pages for DAOs, Chamas, Bounties, or Contributors
- No authentication or identity layer

---

## 4. Features

### 4.1 Phase 1 — UI Hardening (current sprint)

| Feature | Status | Notes |
|---|---|---|
| Fix Contributors sort logic | Bug | `activeSort` not applied to filtered array |
| Fix dead nav buttons | Bug | "About", "Explore", "Launch" need real routes |
| Wallet connect stub modal | Missing | Show "coming soon" or integrate adapter |
| Shared TypeScript types | Missing | `app/lib/types.ts` — DAO, Chama, Bounty, Contributor |
| Detail page routes | Missing | `app/daos/[id]`, `app/chamas/[id]`, `app/bounties/[id]`, `app/contributors/[id]` |
| Deploy to Vercel | Missing | Needed for grant applications |

### 4.2 Phase 2 — Backend Foundation

| Feature | Priority | Notes |
|---|---|---|
| API routes (`/api/daos`, `/api/bounties`, etc.) | High | Replace mock arrays, still file-backed initially |
| Wallet connection | High | Solana: `@solana/wallet-adapter`; EVM: `wagmi` |
| User profile creation | High | Wallet address → profile (name, bio, skills) |
| Bounty CRUD | High | Create, list, filter, view detail |
| DAO/Chama creation flow | High | Multi-step form: name, type, network, initial members |
| Notification webhooks | Medium | Real events, not mock data |

### 4.3 Phase 3 — On-Chain Core

| Feature | Priority | Chain | Notes |
|---|---|---|---|
| **Bounty escrow contract** | Critical | Solana / Arbitrum | Poster deposits → contributor submits → DAO votes → release/reject |
| **Multi-sig treasury** | Critical | Celo / Arbitrum | 3-of-5 sig for Chama/SACCO group funds |
| **On-chain voting** | High | Arbitrum | Proposal creation, time-locked voting, execution |
| **SACCO share tokenization** | High | Stellar / Solana | Tradable digital shares; secondary market |
| **Reputation scoring** | High | Any | On-chain score from votes, payments, contributions, savings history |
| **Guarantor pools** | Medium | Celo | Replace personal guarantors with community-backed credit pools |

### 4.4 Phase 4 — Africa-Specific Integrations

| Feature | Priority | Notes |
|---|---|---|
| **M-Pesa on/off-ramp** | Critical | Non-negotiable for Kenyan adoption; KSh ↔ stablecoin bridge |
| **KYC / identity verification** | High | VASP Act 2025 compliance; Africa-market KYC provider |
| **Swahili / local language UI** | Medium | i18n for Swahili, French for Francophone Africa |
| **USSD fallback** | Low | Feature phones; unbanked communities |

---

## 5. Technical Architecture

### Recommended Network Allocation

| Feature | Network | Reason |
|---|---|---|
| Bounty payments | **Solana** | Streamflow automation, real-time payout rails, low fees |
| Chama group savings | **Celo** | Mobile-first, M-Pesa aligned, designed for emerging markets |
| Governance voting | **Arbitrum** | Proven DAO treasury scale ($3B+), L2 security |
| SACCO share tokenization | **Stellar / Solana** | Native asset issuance, secondary markets |

### Frontend → Backend Data Flow (target)

```
Next.js App Router
  ├── /app/api/daos/route.ts          → DB or on-chain indexer
  ├── /app/api/bounties/route.ts      → DB + escrow contract state
  ├── /app/api/contributors/route.ts  → DB + on-chain reputation
  └── /app/api/notifications/route.ts → Webhook events
```

### Smart Contract Architecture (priority order)

1. **BountyEscrow** — deposit, submit, vote, release, dispute
2. **GroupTreasury** — multi-sig, contributions, loans, repayment
3. **GovernanceVoting** — proposals, time-locked votes, quorum rules
4. **ReputationRegistry** — on-chain score accumulation per wallet
5. **ShareToken** — ERC-20/SPL token representing SACCO membership share

---

## 6. Regulatory Requirements

### Kenya VASP Act 2025
- Requires CBK + CMA registration for platforms handling virtual assets
- Physical office in Kenya required
- AML/CFT compliance, independent IT audits, client fund segregation

### Kenya SACCO Act (SASRA)
- Regulated SACCOs must meet SASRA infrastructure standards
- Sacco Societies (Amendment) Bill 2025 proposes Deposit Guarantee Fund
- KES 1.21 trillion sector under increasing regulatory scrutiny

### Design implications
- Multi-sig wallets satisfy fund segregation requirement
- On-chain audit trail satisfies reporting requirements
- KYC module required before handling regulated SACCO treasury
- Partner with compliant infrastructure provider (e.g. HF, Nomachain) for regulated components

---

## 7. Competitive Landscape

| Platform | Focus | What they miss |
|---|---|---|
| **AfricaDAO** | $20M venture fund for African Web3 cos | No community tooling, no SACCO/Chama layer |
| **Celo Africa DAO** | Developer incubator, grassroots builders | No treasury management for existing savings groups |
| **Burstek DAO** | Arbitrum grants for African dApps | No savings group infra, grant distributor only |
| **ChamaConnect** | Chama digitization | No DAO governance, no on-chain voting, no bounties |
| **BlockCoop SACCO** | Blockchain SACCO shares (BLOCKS token) | Single SACCO, not a platform for all groups |

**Baraza's position:** The only platform combining DAO discovery, Chama management, bounty marketplace, contributor reputation, and on-chain treasury — built specifically for African community finance groups.

---

## 8. Grant Opportunities

| Funder | Amount | Network req. | Fit | Status |
|---|---|---|---|---|
| **Burstek DAO (Arbitrum)** | $20K–$150K | Arbitrum | High — real-world SACCO dApp | Apply now |
| **Stellar SCF** | Up to $150K | Stellar | High — treasury/payments angle | Apply now |
| **Celo Africa DAO** | $5K–$20K (hackathon) | Celo | High — underbanked community finance | Next hackathon |
| **Superteam Africa (Solana)** | $10K–$40K | Solana | Medium — bounty/governance prototype | Apply now |
| **Core DAO Africa** | $5M fund | Core/BTCfi | Low — BTCfi-focused | Future |
| **Starknet Africa** | $4M fund | Starknet | Medium — early-stage | Future |

**Grant application requirement:** A live deployed URL (even the current prototype on Vercel qualifies).

---

## 9. Roadmap

### Now (Week 1–2)
- [ ] Fix Contributors sort bug
- [ ] Fix dead nav buttons
- [ ] Add wallet connect stub
- [ ] Create `app/lib/types.ts` with shared interfaces
- [ ] Scaffold detail pages (`/daos/[id]`, `/chamas/[id]`, `/bounties/[id]`)
- [ ] Deploy to Vercel (preview URL for grant applications)

### Soon (Week 3–6)
- [ ] API routes replacing mock arrays
- [ ] Real wallet connection (Solana or EVM)
- [ ] DAO/Chama creation flow (multi-step form)
- [ ] Bounty creation + detail view
- [ ] Contributor profile page (wallet-gated)
- [ ] Apply to Burstek DAO + Stellar SCF with deployed URL

### Next (Month 2–3)
- [ ] Bounty escrow smart contract (Solana or Arbitrum)
- [ ] Multi-sig group treasury (Celo)
- [ ] On-chain voting (Arbitrum)
- [ ] M-Pesa on/off-ramp integration
- [ ] Reputation scoring (on-chain)
- [ ] KYC integration

### Later (Month 4+)
- [ ] SACCO share tokenization
- [ ] Guarantor pool contracts
- [ ] Swahili i18n
- [ ] Mobile-responsive PWA
- [ ] VASP Act 2025 compliance + SASRA alignment

---

## 10. Success Metrics

| Metric | 3-month target | 12-month target |
|---|---|---|
| Active DAOs/Chamas on platform | 10 | 100 |
| Total treasury value managed | KSh 1M | KSh 50M |
| Bounties posted | 50 | 500 |
| Contributors with on-chain reputation | 100 | 2,000 |
| Grant funding secured | $20K | $200K |
| M-Pesa transactions processed | — | 1,000/month |
