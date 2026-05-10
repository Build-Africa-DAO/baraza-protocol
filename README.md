<div align="center">
  <img src="./assets/banner.svg" alt="Baraza Protocol — On-chain governance rooted in African tradition" width="100%"/>
</div>

<div align="center">

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-14F195?style=flat-square&logo=solana&logoColor=black)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Dev3pack 2026](https://img.shields.io/badge/Dev3pack-Hackathon%202026-8B5CF6?style=flat-square)](https://hack.dev3pack.xyz)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://baraza-protocol.vercel.app)

**On-chain governance rooted in African tradition.**

*Baraza (Swahili / Pan-African) — the community council where decisions are made,*
*futures planned, and communities govern themselves.*

[Live App](https://baraza-protocol.vercel.app) · [Report Bug](https://github.com/Azizudinly/baraza-protocol/issues) · [Request Feature](https://github.com/Azizudinly/baraza-protocol/issues)

> Built by [Aziz Motomoto](https://github.com/Azizudinly) · Founder, [BuildaDAO](https://buildadao.xyz) · East Africa Coordinator, PizzaDAO
> Dev3pack Global Hackathon 2026 · Nairobi Hub
> **First deployment: Global Pizza Party 6 · The Mall Westlands, Nairobi · May 22 2026 · 500+ attendees**

</div>

---

## The Problem

Across Africa, communities have always governed themselves. Savings circles. Market cooperatives. Village councils. Community fundraising. The infrastructure existed. The transparency did not.

African Web3 communities run events on Eventbrite, manage funds through WhatsApp, and lose money to people who disappear with the treasury. Meanwhile, 800 million mobile money users across the continent have no easy path into Web3 governance.

**Baraza fixes that.**

---

## What Baraza Does

### 🏛️ Governance — Digital Village Council
Any community launches a DAO in minutes: name it, set membership price, deploy. Members hold governance NFTs and vote on proposals, allocate treasury funds, and pay contributors. Transparent. Permanent. Owned by everyone.

### 🎟️ Events
Communities create on-chain events. Members RSVP with their wallet and receive a compressed NFT ticket via Metaplex Bubblegum. Premium content is gated behind x402 micropayments in USDC.

### 📱 Mobile Money Onramp
Members join via M-Pesa, MTN MoMo, or Airtel Money. No crypto knowledge required. Just a phone.

```
Member sends KSh 500 via M-Pesa
  → Africa's Talking confirms payment
  → Yellow Card converts KSh → USDC
  → LI.FI routes USDC to Solana
  → Privy creates invisible wallet
  → NFT membership minted
  → SMS: "Welcome to [DAO]. Your membership: [link]"
```

---

## Real Use Cases

| Community | How they use Baraza |
|---|---|
| Taxi Cooperative | Drivers co-govern pricing, routes, and welfare funds |
| Savings Circle | Transparent treasury, on-chain lending to SMEs |
| Film DAO | Raise production funds, distribute revenue to token holders |
| Tech Guild | Pay contributors on-chain, fund open-source projects |
| Beauty Collective | Pool funds for shared studios, vote on locations |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS + Custom Design Tokens |
| Animation | Framer Motion |
| Routing | Next.js App Router |
| Blockchain | Solana (Devnet → Mainnet) |
| Wallet | @solana/wallet-adapter — Phantom, Solflare, Backpack, Brave, Coinbase |
| Invisible Wallets | Privy (M-Pesa users) |
| NFT Tickets | Metaplex Bubblegum (compressed NFTs) |
| Payments | x402 micropayments + USDC on Solana |
| Mobile Money | Africa's Talking + Yellow Card |
| Bridge | LI.FI SDK (cross-chain USDC routing) |
| UI Primitives | Radix UI |
| Hosting | Vercel |

---

## Architecture

```
User with wallet:
  Phantom / Solflare → Council creation → NFT membership → Governance

User with phone only:
  M-Pesa → Africa's Talking → Yellow Card → LI.FI → Solana
  → Privy invisible wallet → NFT membership → SMS confirmation

Council Governance:
  Proposals → On-chain vote → Treasury execution → Contributor payment
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Solana wallet browser extension ([Phantom](https://phantom.app/) recommended)

### Installation

```bash
# Clone
git clone https://github.com/Azizudinly/baraza-protocol.git
cd baraza-protocol

# Install
npm install

# Environment
cp .env.example .env.local
# Fill in your values

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Wallet Devnet Setup

1. Install [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/)
2. Switch to **Devnet** in wallet settings
3. Get devnet SOL at [faucet.solana.com](https://faucet.solana.com/)
4. Connect via the header button

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_NETWORK` | No | Solana network (devnet / mainnet-beta) |
| `NEXT_PUBLIC_RPC_URL` | No | Custom Solana RPC (falls back to public devnet) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes (mobile) | Privy app ID for invisible wallets |
| `ORGANIZER_WALLET` | Yes (payments) | Organizer Solflare wallet public key |
| `LIFI_API_KEY` | Yes (bridge) | LI.FI cross-chain bridge API key |
| `AT_API_KEY` | Yes (mobile) | Africa's Talking API key |
| `AT_USERNAME` | Yes (mobile) | Africa's Talking username |
| `NEXT_PUBLIC_FACILITATOR_URL` | No | x402 stream payments facilitator URL |

> ⚠️ Never commit `.env.local` — it is gitignored by default.

---

## Project Structure

```
baraza-protocol/
├── app/
│   ├── layout.tsx                       # Root layout + metadata
│   ├── page.tsx                         # App entry point
│   ├── providers.tsx                    # Solana wallet + Privy providers
│   └── globals.css                      # Global styles + CSS design tokens
├── components/
│   ├── WalletConnectModal.tsx           # Wallet modal (Solana only, deduped)
│   ├── WalletStatus.tsx                 # Wallet dropdown + chain check
│   ├── Header.tsx                       # Navigation
│   ├── CommunityCard.tsx
│   ├── DecisionCard.tsx                 # Voting card with optimistic updates
│   ├── MembershipCard.tsx
│   └── AshaChat.tsx                     # AI governance assistant
├── hooks/
│   ├── useBarazaContract.ts             # On-chain read/write
│   ├── useWalletGuard.ts                # Wallet connection gate
│   └── use-mobile.tsx
├── lib/
│   ├── constants.ts                     # Community types + mock data
│   ├── utils.ts                         # cn(), formatKSh(), truncateAddress()
│   └── rpc.ts                           # RPC endpoint + fallback logic
├── assets/
│   └── banner.svg                       # Repo illustration
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── README.md
```

---

## Roadmap

**v0.1 — Dev3pack MVP (May 10 2026)**
- [x] Full council creation wizard
- [x] Phantom + Solflare wallet connect
- [x] Governance dashboard (proposals, voting, treasury)
- [x] M-Pesa bridge UI (mockup)
- [x] Membership NFT display

**v0.2 — GPP6 Deployment (May 22 2026)**
- [ ] Anchor program on Solana devnet
- [ ] Compressed NFT ticket on RSVP (Metaplex Bubblegum)
- [ ] x402 full payment flow live
- [ ] Live at Global Pizza Party 6 · Nairobi

**v0.3 — Bridge (June 2026)**
- [ ] M-Pesa live integration (Africa's Talking + Yellow Card)
- [ ] LI.FI cross-chain USDC routing
- [ ] Privy invisible wallets
- [ ] MTN MoMo + Airtel Money

**v1.0 — Pan-Africa (Q3 2026)**
- [ ] USSD interface for feature phones
- [ ] Multi-language (Swahili, Yoruba, Amharic, French)
- [ ] Colosseum Accelerator application

---

## Smart Contract

> **Current status:** Mock data with Solana transaction scaffolding.
> Production requires deploying the Anchor program and setting `NEXT_PUBLIC_PROGRAM_ID`.

See [CONTRACT_INTEGRATION.md](./docs/CONTRACT_INTEGRATION.md) for Anchor integration details.

---

## Contributing

This project is public and community-driven. If you're building in Nairobi, Lagos, Kigali, or anywhere across the continent:

1. Fork the repo
2. Feature branch: `git checkout -b feat/your-feature`
3. Conventional commits: `git commit -m "feat: add treasury view"`
4. Open a PR against `main`

---

## Vision

Most governance tools are built for DAOs in San Francisco or New York. Baraza is built for the realities of Africa — mobile-first communities, local governance structures, and a deep cultural tradition of collective decision-making that predates the blockchain by centuries.

We are not importing governance. We are building it from home.

---

## Team

**Aziz Motomoto** — Founder, BuildaDAO · Executive Producer (SuperSport, AFCON, Olympics) · East Africa Coordinator, PizzaDAO · Contributor, Nouns Africa

---

## Links

| | |
|---|---|
| 🌐 Live App | [baraza-protocol.vercel.app](https://baraza-protocol.vercel.app) |
| 🐦 Builder | [@Azizudinly](https://github.com/Azizudinly) |
| 🏗️ BuildaDAO | [buildadao.xyz](https://buildadao.xyz) |
| 🍕 PizzaDAO | [pizzadao.com](https://pizzadao.com) |
| 🎪 GPP6 | Global Pizza Party 6 · May 22 2026 · Nairobi |

---

<div align="center">

MIT © Baraza Protocol

*Built in Nairobi. For Africa. On Solana.*

</div>
