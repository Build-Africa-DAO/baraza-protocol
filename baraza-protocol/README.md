# 🏛️ Baraza Protocol

**African cooperative infrastructure on Solana.**

*Baraza (Swahili/Pan-African) — the traditional community council where decisions are made, futures planned, and communities govern themselves.*

> Launch a DAO · Host on-chain events · Govern your treasury · Join with M-Pesa

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-14F195?style=flat-square)](https://solana.com)
[![LI.FI](https://img.shields.io/badge/Bridge-LI.FI-blue?style=flat-square)](https://li.fi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Dev3pack](https://img.shields.io/badge/Dev3pack-Hackathon%202026-purple?style=flat-square)](https://hack.dev3pack.xyz)

> Built by [Aziz Motomoto](https://x.com/motomoto), Founder of [BuildaDAO](https://buildafricadao.org)  
> Dev3pack Global Hackathon 2026 · Nairobi Hub  
> First deployment: Global Pizza Party 6 · Nairobi, Kenya · May 22 2026 · 500+ attendees

---

## The Problem

Across Africa, communities have always governed themselves — savings circles, market cooperatives, village councils, community fundraising. The infrastructure existed. The transparency did not.

African Web3 communities run events on Eventbrite, manage funds through WhatsApp, and lose money to people who disappear with the treasury. Meanwhile, 800 million mobile money users across the continent have no easy path into Web3 governance.

---

## What Baraza Does

### 🎟️ Events
Communities create on-chain events. Members RSVP with their Solflare or Phantom wallet and receive a compressed NFT ticket via Metaplex Bubblegum. Premium content — streams, recordings, exclusive sessions — is gated behind x402 micropayments in USDC. Pay once, access once. No subscription. No platform taking a cut.

### 🏛️ Governance (Community Corner)
Any community launches a DAO in minutes — name it, set membership price, upload NFT artwork, deploy. Members hold governance NFTs and vote on proposals, allocate treasury funds, approve projects, and pay contributors. Transparent. Permanent. Owned by everyone.

### 📱 Mobile Money Onramp
Members join via M-Pesa, MTN MoMo, or Airtel Money. The LI.FI SDK routes payments through Yellow Card to USDC on Solana. Privy creates an invisible wallet. They receive their NFT membership by SMS. No crypto knowledge needed. Just a phone.

---

## Real Use Cases

| Community | How they use Baraza |
|---|---|
| **Taxi Cooperative** | Drivers & riders co-govern pricing, routes, and welfare funds |
| **Savings Circle** | Transparent treasury, on-chain lending to SMEs, micro-returns |
| **Film DAO** | Raise production funds, distribute revenue to token holders |
| **Beauty Collective** | Pool funds for shared studios, vote on locations |
| **Tech Guild** | Pay contributors on-chain, fund open-source projects |

---

## Mobile Money Bridge (in plain English)

```
1. Member gets payment link: "Send KSh 500 to Baraza M-Pesa"
2. Member sends via M-Pesa on their phone
3. Africa's Talking confirms payment
4. Yellow Card converts KSh → USDC
5. LI.FI routes USDC to Solana
6. Privy creates invisible wallet automatically
7. NFT membership minted and sent
8. Member gets SMS: "Welcome to [DAO name]. Your membership: [link]"
```

No wallet setup. No crypto knowledge. Just a phone.

---

## Tech Stack

```
Frontend:     Next.js 14 + React + Tailwind CSS
Wallet:       Solana Wallet Adapter (Phantom, Solflare)
Payments:     x402 micropayments + USDC on Solana
NFT Tickets:  Metaplex Bubblegum (compressed NFTs)
Mobile Money: Africa's Talking + Yellow Card
Bridge:       LI.FI SDK (cross-chain USDC routing)
Wallets:      Privy (invisible wallets for M-Pesa users)
Hosting:      Vercel
AI Build:     Claude + Noah AI
```

---

## Architecture

```
User with wallet:
  Solflare/Phantom → DAO Creation → NFT Membership → Governance

User with phone only:
  M-Pesa → Africa's Talking → Yellow Card → LI.FI → Solana
  → Privy invisible wallet → NFT Membership → SMS confirmation

DAO Governance:
  Proposals → On-chain vote → Treasury execution
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Azizudinly/baraza-protocol.git
cd baraza-protocol

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in your env vars

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
baraza-protocol/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main app (all screens)
│   ├── providers.tsx       # Solana wallet providers
│   └── globals.css         # Global styles
├── .env.example            # Environment template
├── next.config.js          # Next.js config
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## Demo Flow (5 minutes)

1. **Landing** — Connect Solflare wallet
2. **Create Community** — Name, type (Taxi DAO), token symbol
3. **Membership Settings** — Price in SOL + KSh equivalent shown
4. **Payment Methods** — M-Pesa active, other networks shown
5. **Deploy** — Launch to Solana devnet, mock tx confirms
6. **Dashboard** — Treasury, members, live proposal
7. **Vote** — Cast vote on active proposal, transaction confirms

---

## Roadmap

**v0.1 — Dev3pack MVP (May 10 2026)**
- [x] Full DAO creation wizard
- [x] Solflare + Phantom wallet connect
- [x] Dashboard with governance UI
- [x] Proposal + voting interface
- [x] M-Pesa bridge UI (mockup)
- [x] Payment methods screen

**v0.2 — GPP6 Deployment (May 22 2026)**
- [ ] Anchor program on Solana devnet
- [ ] Compressed NFT ticket on RSVP (Metaplex Bubblegum)
- [ ] x402 full payment flow tested
- [ ] Live at Global Pizza Party 6, Nairobi

**v0.3 — Bridge (June 2026)**
- [ ] M-Pesa live integration (Africa's Talking + Yellow Card)
- [ ] LI.FI cross-chain routing
- [ ] Privy invisible wallets
- [ ] MTN MoMo + Airtel Money

**v1.0 — Pan-Africa (Q3 2026)**
- [ ] USSD interface for feature phones
- [ ] Multi-language (Swahili, Yoruba, Amharic, French)
- [ ] Stellar integration for low-cost treasury
- [ ] Colosseum Accelerator application

---

## The Story

Africa has always had its own systems of cooperative governance. The baraza. The chama. The susu. The stokvel. Communities pooling resources, making decisions together, holding each other accountable.

Blockchain doesn't replace that. It gives it infrastructure.

I am Aziz Motomoto — Executive Producer with 13 years producing for SuperSport, AFCON, and the Olympics. I am also the founder of BuildaDAO and East Africa Coordinator for PizzaDAO. I am not a developer. I built this during Dev3pack 2026 using Claude, Noah AI, and v0.

Baraza is built for my community. It will be deployed at our own event on May 22. That is the only proof of product-market fit that matters.

---

## Team

**Aziz Motomoto** — Founder, BuildaDAO · Executive Producer · East Africa Coordinator, PizzaDAO · Contributor, Nouns Africa

---

## License

MIT — fork it, deploy it for your community, build on top of it.

---

*Built in Nairobi. For Africa. On Solana.*
