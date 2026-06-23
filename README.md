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
- **Cooperatives** (worker and producer groups)
- **DAOs** (on-chain governed organizations)

Primary markets: Kenya, Tanzania, Uganda, Ethiopia, Nigeria.

---

## Products

| Product | Status |
|---|---|
| **Baraza Protocol** — treasury, dues, voting, BRZA | Phase 0 |
| **Baraza TV** — community-led video, dues-and-vote storytelling | Pre-launch |
| **IDO / Public Launch** — BRZA at $0.10 | Planned |
| **DEX** — community-token liquidity | Planned |

---

## Chain priority (do not reorder)

1. **Stellar** — primary. All treasuries are Stellar G-accounts. BRZA is a Stellar custom asset. M-Pesa → Kotani Pay → XLM → treasury.
2. **Solana** — governance. 5 Anchor programs written; not yet deployed to devnet.
3. **Base (EVM)** — secondary. Aragon OSx Manager factory at known addresses.
4. **Celo** — mobile scaffold. GoodDollar G$ identity. Stub only.

Stellar launches first. EVM and Solana are never launch blockers.

---

## BRZA token

| Field | Value |
|---|---|
| Supply | 1,000,000,000 |
| Decimals | 7 |
| Network | Stellar custom asset |
| Phase 0 price | $0.02 |
| IDO price | $0.10 |
| Source of truth | `app/src/lib/brza/constants.ts` |

| Bucket | % | Vesting |
|---|---|---|
| Community Rewards | 20% | Emission 2M/month |
| Founder A | 7.5% | 1yr cliff + 3yr vest |
| Founder B | 7.5% | 1yr cliff + 3yr vest |
| Operations | 15% | Milestone-gated |
| Public Sale | 12% | Phase 0 (20M) + IDO (100M) |
| Reserve | 10% | 1yr cliff + 3yr vest |
| Liquidity Pool | 8% | Unlock at IDO |
| Grants | 8% | 6mo cliff + 2yr vest |
| Referral | 5% | Per event |
| Events | 4% | Per event |
| Baraza TV Creators | 3% | Per content milestone |

BRZA ≠ XLM. The token is not the payment rail.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React, TypeScript, Tailwind CSS (in `app/`) |
| Database | Supabase (PostgreSQL + RLS) |
| Primary chain | Stellar — BRZA token, XLM treasury, M-Pesa via Kotani Pay |
| Governance chain | Solana — 5 Anchor programs (treasury, governance, membership, community registry, payment attestation) |
| Secondary chain | Base (EVM) — Aragon OSx |
| Mobile chain | Celo — GoodDollar G$ identity (scaffold) |
| AI layer | Claude — Akili relay (`/api/agent/chat`) + 5-agent council (Amara, Kofi, Zara, Nia, Seku) |
| Mobile on-ramp | Africa's Talking USSD + SMS (works on feature phones) |
| Wallets | Phantom, Solflare, Coinbase Wallet (others not supported) |
| Hosting | Vercel |

---

## Akili

The protocol's AI layer is two surfaces sharing one character system.

- **Akili relay** — `/api/agent/chat`. Single-voice Claude streaming. Drafts proposals, flags bad ones, answers community questions in plain English or Swahili. Falls back to a classified `auth_failed` event when `ANTHROPIC_API_KEY` is unset.
- **Akili Council** — `app/src/akili/`. Five specialists, each with a full character bible at `docs/akili-council/`. Invoke via `invokeCouncilAgent(name, message)`.

| Agent | Domain | Cast |
|---|---|---|
| **Amara** | Content & media — Baraza TV, episode performance | warm · fast · outward |
| **Kofi** | Governance — proposals, quorum, multi-sig, charter | cool · deliberate · inward |
| **Zara** | Economy — BRZA flows, treasury, bounties, anomalies | cold · deliberate · outward |
| **Nia** | People — sentiment, participation, churn, onboarding | warm · deliberate · inward |
| **Seku** | Research — regulatory horizon, sourcing discipline | cool · fast · outward |

Akili enforces a Decision Stack Guard: never greet, never compress dissent, fidelity over equality.

---

## Architecture Rules

These are non-negotiable.

- All business logic lives in `app/src/lib/`. Components → hooks → lib. Components never import lib directly.
- All chain calls go through `app/src/lib/adapters/index.ts` — no component talks to a chain directly.
- Wallet support: **Phantom, Solflare, Coinbase Wallet only** — do not add others.
- Supabase is optional everywhere — every route falls back gracefully when env vars are unset.
- `intentToken` is required for Stellar mainnet payment verification — legacy fields dev-only.
- Activation secret is client-side only from order creation to membership activation.
- `withdrawals_enabled` stays `false` until multisig handoff is tested on devnet.
- Update `app/src/lib/knowledgeGraph.ts` when adding chain rails, contracts, or settlement routes.
- Never reference Builder Protocol or Nouns DAO. Use Aragon OSx language.
- Do not add Magic UI or heavy animation libraries.

---

## Security

- Use `crypto.timingSafeEqual` for every secret comparison — never `===`.
- Never log or expose `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `KOTANI_PAY_API_KEY`, or any private key.
- `payment_orders` `SELECT` is `false` via RLS — reads go through `/api/payment-orders/status` + activation secret.
- Rate-limit payment routes before public launch.

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

Other commands (run with `--prefix app`):

```bash
npm run typecheck   # TypeScript strict check (app + node tsconfigs)
npm run lint        # ESLint
npm run test        # unit tests (vitest)
npm run build       # Production build → app/dist
```

Run Supabase migrations `001`–`017` (in filename order) before any payment flow.

---

## Environment Variables

See `app/.env.local.example` for the full list. Required for the basic UI:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-side (`/api/*` on Vercel):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STELLAR_NETWORK`, `STELLAR_HORIZON_URL`, `STELLAR_TREASURY_ACCOUNT`
- `STELLAR_INTENT_SECRET` (generate: `openssl rand -hex 32`)
- `BRZA_DISTRIBUTOR_SECRET`, `BRZA_ISSUER_PUBLIC_KEY` (for the mint promoter cron)
- `KOTANI_PAY_API_KEY` (M-Pesa rail)
- `ANTHROPIC_API_KEY` (Akili; absent triggers the classified-error fallback)

Never commit real keys. `app/.env.local` is gitignored. Only `VITE_*` variables reach the browser.

---

## Status — Immediate blockers

1. `ANTHROPIC_API_KEY` → Vercel + GitHub Actions secrets.
2. Supabase env vars → Vercel (URL, anon key, service role key).
3. `supabase db push` — run migrations `001`–`017`.
4. Fund Stellar testnet treasury G-account, then run the XLM payment-verification smoke.
5. Pick an indexer source for `MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED` — currently a blind status walk; real BRZA mint + Horizon confirmation already ship.

The promoter cron runs once daily on the Vercel Hobby plan. Restore `*/5 * * * *` once on Pro — the five-minute reconciliation cadence is the design.

---

## Key Files

| Path | Purpose |
|---|---|
| `AGENTS.md` | Agent instructions, API routes, payment-flow source of truth |
| `CLAUDE.md` | Project rules for AI contributors |
| `app/src/lib/brza/constants.ts` | BRZA tokenomics, allocation, vesting, emission |
| `app/src/lib/chains/config.ts` | Chain config + Aragon OSx addresses |
| `app/src/lib/evm/manager.ts` | Aragon OSx `deployDao()` client |
| `app/src/lib/evm/base-governance.ts` | viem governance: `castVote`, `getVotes`, proposal state |
| `app/src/lib/programs/pda.ts` | Solana PDA derivation (all 5 programs) |
| `app/api/agent/chat.ts` | Akili community brain — Claude streaming + classified errors |
| `app/src/akili/` | Akili Council — 5 specialists + relay |
| `app/api/stellar/verify-payment.ts` | Payment verification — HMAC, Horizon, Supabase |
| `app/api/cron/promote-orders.ts` | Order promoter — Stellar mint + Horizon confirmation |
| `supabase/migrations/` | Run 001–017 in filename order before any payment flow |
| `docs/NEXT_STEPS.md` | Phase 0–5 PRD with dependency order |
| `docs/akili-council/` | Character bibles for the five council agents |

---

## Do Not

- Add wallets beyond Phantom, Solflare, Coinbase Wallet.
- Commit secrets, private keys, or service role keys.
- Set `withdrawals_enabled = true` before multisig handoff.
- Relax `intentToken` requirement for Stellar mainnet.
- Bypass the activation secret gate in `membership/activate.ts`.
- Reference Builder Protocol, Nouns DAO, or noun.wtf anywhere.

---

## Legal

BAD DAO AFRICA LIMITED
Registration: PVT-L51DR8MQ
Jurisdiction: Kenya — Companies Act 2015
Directors: Aziz Motomoto + Joanne Wendoh Olweny

---

## Links

- Live: https://baraza-protocol.vercel.app
- Repo: https://github.com/Azizudinly/baraza-protocol
- Docs: [Notion Master Document](https://app.notion.com/p/3797722eef3b81a0bdafdc037054a3c9)
- Contact: aziz@buildafricadao.org

---

*Built in Africa. For Africa. For the world.*

---

## Baraza Protocol — Frontend (merged from feat/baraza-frontend)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
