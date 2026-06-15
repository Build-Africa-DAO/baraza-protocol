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
| Frontend | Vite + React, TypeScript, Tailwind CSS (in `app/`) |
| Database | Supabase (PostgreSQL + RLS) |
| Primary chain | Stellar (BRZA token, XLM treasury, M-Pesa via Kotani Pay) |
| Secondary chain | Solana (NFT membership, Realms governance, Squads v4) |
| AI layer | Claude (Akili — community brain + 5-agent council) |
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

**Prerequisites:** Node 24, npm

```bash
git clone https://github.com/Azizudinly/baraza-protocol.git
cd baraza-protocol
npm --prefix app install --legacy-peer-deps
cp app/.env.local.example app/.env.local
# For basic UI: only VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY needed
npm --prefix app run dev
```

Open http://localhost:5173

Other commands:

```bash
npm --prefix app run typecheck   # TypeScript strict check
npm --prefix app run lint        # ESLint
npm --prefix app run test        # unit tests (vitest)
npm --prefix app run build       # Production build → app/dist
```

---

## Environment Variables

See `.env.example` and `app/.env.local.example` for the full list. Required for the basic UI:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-side (API routes / Vercel): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_NETWORK`, `STELLAR_HORIZON_URL`, `STELLAR_TREASURY_ACCOUNT`, `STELLAR_INTENT_SECRET` (generate: `openssl rand -hex 32`), Kotani Pay keys.

Never commit real keys. Use `app/.env.local` which is gitignored. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `KOTANI_PAY_API_KEY`, or any private keys in frontend code — only `VITE_*` variables reach the browser.

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
