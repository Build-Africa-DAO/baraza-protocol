# Baraza Protocol

Community finance and governance infrastructure for African groups — built to work with M-Pesa, on a feature phone, without a bank account.

---

## The Problem

Millions of African communities pool money together every week — chamas, stokvels, SACCOs, cooperatives. They use WhatsApp groups, paper ledgers, and personal bank accounts to manage shared funds. There is no audit trail. Funds go missing. Treasurers leave and take records with them. Members have no real say in how money moves.

## What Baraza Does

Baraza gives any group a shared treasury, governed by its members. Members pay dues via M-Pesa. Every payment is recorded on-chain. Members vote on how funds are spent, and no single person can move money alone. No seed phrases. No crypto wallets required to join.

## Who It Is For

- **Chamas** (East Africa rotating savings groups)
- **Stokvels** (South Africa rotating pot)
- **SACCOs** (savings and credit cooperatives)
- **DAOs** (on-chain governed organizations)
- **Cooperatives** (worker and producer groups)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS) |
| Primary chain | Stellar (BRZA token, XLM treasury, M-Pesa via Kotani Pay) |
| Secondary chain | Solana (NFT membership, Realms governance, Squads v4) |
| AI layer | Claude (Asha AI brain + Akili Council agents) |
| Mobile | Africa's Talking (USSD + SMS, works on feature phones) |
| Hosting | Vercel |

---

## Architecture Rules

These are non-negotiable. Every contributor must follow them.

- All chain calls go through `/lib/adapters/index.ts` — no component talks to a chain directly
- Chain names (Stellar, Solana) never appear in the UI except on onboarding and withdrawal screens
- Users see KES, UGX, ZAR — never BRZA unless they ask
- BRZA is the only token held in community treasuries
- Smart contracts are audited before mainnet — no exceptions
- KYC data is encrypted at rest, never plain text, purged on deletion request

---

## The 14 Modules

| Module | Description | Tier |
|---|---|---|
| treasury | Group wallet — Stellar multisig | Core |
| governance | Proposals and voting | Core |
| membership | Member management and pricing | Core |
| nft_membership | Soulbound membership cards | Core |
| community_token | Launch a group token | Core |
| bounty_board | Task board with BRZA rewards | Core |
| stokvel_rotation | Rotating pot engine | Core |
| loan_engine | Borrow against community token | Core |
| grant_application | Apply for Baraza grant | Core |
| blackbook | Plain-language ledger | Core |
| dividend_distribution | Pay all members proportionally | Core |
| mpesa_rails | M-Pesa in and out | Mobile |
| bank_rails | Bank account integration | Banking |
| compliance | KYC, AML, tax reporting | Any |

---

## Local Setup

```bash
git clone https://github.com/Azizudinly/baraza-protocol.git
cd baraza-protocol
npm install
cp .env.example .env.local
# Fill in your env vars — see .env.example for required keys
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

See `.env.example` for the full list. Required to run:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `STELLAR_SECRET_KEY` (testnet only during development)

Never commit real keys. Use `.env.local` which is gitignored.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production only — PR required, 1 approval |
| `develop` | Integration — all features merge here first |
| `feat/brza-core` | Active sprint — BRZA token + Stellar foundation |
| `feat/stellar` | Stellar contracts and adapter |
| `feat/solana` | Solana Anchor programs |
| `feat/ussd` | Africa's Talking USSD and SMS layer |

---

## Sprint Plan

| Sprint | Focus | Duration |
|---|---|---|
| 1 | BRZA Stellar asset, Privy wallet, M-Pesa STK push, USSD | 2 weeks |
| 2 | Community creation, treasury flow, mass distribution | 3 weeks |
| 3 | Realms governance, community voting, audit trail | 3 weeks |
| 4 | BRZA dashboard, TVL tracker, Phase 0 pre-sale page | 2 weeks |

---

## Legal

BAD DAO AFRICA LIMITED
Registration: PVT-L51DR8MQ
Jurisdiction: Kenya — Companies Act 2015
Directors: Aziz Motomoto + Joanne Wendoh Olweny

---

## Links

- Live: https://baraza-protocol.vercel.app
- Docs: [Notion Master Document](https://app.notion.com/p/3797722eef3b81a0bdafdc037054a3c9)
- Contact: aziz@buildafricadao.org

---

*Built in Africa. For Africa. For the world.*
