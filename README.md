# Baraza Protocol

Baraza is a community finance and governance protocol for African groups, built on **Stellar**. Communities pool funds in Stellar treasury accounts, pay membership dues in XLM or KES via M-Pesa, and govern shared resources through on-chain proposals and votes. The native token is **BRZA** — a Stellar custom asset (1B supply, 7 decimals, phase-0 price $0.02).

## Stellar Foundation

Stellar is the primary settlement layer for Baraza:

- **BRZA token** is a Stellar custom asset issued and distributed from Stellar G-accounts (`VITE_BRZA_ISSUER_ADDRESS`, `VITE_BRZA_DISTRIBUTOR_ADDRESS`).
- **Community treasuries** are Stellar accounts. All membership dues, regardless of payment method, settle to a community Stellar treasury address.
- **Membership payments** verified against Stellar Horizon — transaction hash, ledger confirmation, and treasury destination are all checked server-side.
- **M-Pesa via Kotani** converts KES → XLM on-ramp and deposits directly to the community's Stellar treasury address.
- **Intent tokens** are HMAC-signed by the server at payment creation (`STELLAR_INTENT_SECRET`) and verified at confirmation, binding the payment to a specific community and amount.
- **Payment intent API** at `/api/stellar/create-payment-intent` generates a signed token; `/api/stellar/verify-payment` validates it against Horizon.

## Core Loop

```text
Create community (treasury = Stellar G-account)
  -> Join: pay XLM direct or KES via M-Pesa (both settle to Stellar treasury)
  -> Verify against Horizon (tx hash, amount, destination)
  -> Promote order to RECONCILED via cron
  -> Activate membership (activation-secret gate + Supabase write)
  -> Create proposal -> Vote
  -> Treasury balance visible on Stellar; releases require governance + multisig
```

The active app is the Vite React SPA in `app/`. The root `vercel.json` builds and deploys that folder.

## Payment Rails

### Active (testnet/sandbox)

| Rail | Provider | Settles to | Route |
|---|---|---|---|
| Stellar XLM | Horizon direct | Stellar treasury | `POST /api/stellar/verify-payment` |
| M-Pesa | Kotani Pay KES→XLM onramp | Stellar treasury | `POST /api/payments/brza-membership` |

### Reconciliation

- Stellar orders are confirmed synchronously at verify time via Horizon.
- M-Pesa orders are polled via `POST /api/payments/reconcile-brza-membership` (Kotani status endpoint).
- Both paths write to `payment_orders` in Supabase. The cron job at `/api/cron/promote-orders` advances orders through `PAYMENT_CONFIRMED → MINT_QUEUED → MINT_SUBMITTED → MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED` (one step per minute in demo mode; production replaces this with a real BRZA mint + Stellar indexer).

### Not MVP

- Daraja M-Pesa direct STK push (env vars present but not the active rail).
- x402, card checkout, cross-chain bridging, multi-chain payment picker.

## Active Project Layout

```text
app/
  src/           React UI, routes, hooks, and chain client logic
  api/
    payments/    brza-membership.ts, reconcile-brza-membership.ts, kotani.ts, minisend.ts
    stellar/     create-payment-intent.ts, verify-payment.ts
    membership/  activate.ts
    cron/        promote-orders.ts
    payment-orders/ status.ts
  docs/          product, architecture, deployment, and contract notes
  package.json   app scripts and dependencies
programs/
  community_registry/src/lib.rs   community identity PDA + admin handoff
  governance/src/lib.rs           proposals, votes, timelock, veto
  membership/src/lib.rs           tiers, member records, payment activation
  payment_attestation/src/lib.rs  off-chain payment bridge, attester key
  treasury_vault/src/lib.rs       per-community SOL vault, deposit/release
contracts/
  evm/           Solidity DAO contracts (Token, Auction, Governor, Treasury)
  solana/        .gitkeep — canonical chain is programs/ above
  stellar/       .gitkeep — Stellar rails handled by app/api/ routes
Anchor.toml      workspace build config for the five Solana programs
vercel.json      root deploy config for Vercel
```

## Current Implementation Status

**Tests:** 231 passing (vitest + jsdom). **CI:** GitHub Actions runs typecheck, lint, and tests on every push.

Working today:

- Vite React SPA builds from `app/`. TypeScript strict mode, ESLint enforced.
- Wallet adapter: Phantom, Solflare, and Coinbase Wallet only (custom modal, no additions).
- Community, proposal, membership, treasury, and bounty screens render from Supabase when configured, with local seed data fallback.
- M-Pesa membership payment flow: `brza-membership` creates a Kotani onramp order; `reconcile-brza-membership` polls for completion; `membership/activate` gates on `INDEXER_CONFIRMED` or `RECONCILED` + activation secret.
- Stellar XLM payment flow: HMAC-signed intent tokens on mainnet; legacy tx-hash + amount fields on testnet. Duplicate tx hashes blocked at DB unique constraint.
- Payment orders persist to Supabase `payment_orders`; activation writes to `memberships`. Both are idempotent.
- Cron promoter runs every minute and advances orders one stage per tick (demo simulator; production needs real mint + indexer logic).
- BRZA token config is in `app/src/lib/brza/constants.ts` — Stellar custom asset, 1B supply, 7 decimals, phase-0 price $0.02.
- `useBarazaContract.ts` blocks write actions with a "preview mode" toast until Solana programs are deployed to devnet; read paths use a real RPC connection.
- Community creation and bounty workflows save to Supabase, or localStorage in local dev.
- Branding: `app/public/baraza-logo-v2.svg` for app chrome, `app/public/brza-token-logo.svg` for token surfaces. Palette: `#8ECAE6`, `#219EBC`, `#023047`, `#FFB703`, `#FB8500`.

Current guardrails (not yet production-ready):

- All five Anchor programs compile and pass `anchor build`. Governance dispatches native SOL treasury releases by CPI. Membership → registry member count, governance rule changes, and governance → membership actions are TODO, gated by devnet deployment.
- Proposal creation and vote actions show a "preview mode" toast until programs are deployed.
- EVM chains are selectable in the chain picker; read operations use deployed contract addresses. Full wallet signing requires wagmi.
- `user_id_hash` in membership activation is currently `wallet:<address>` — production replaces this with the HMAC-peppered phone hash from auth.
- The cron promoter is a demo step-counter. Production needs real BRZA mint + Stellar indexer confirmation before `membership/activate` will fire on real orders.

## Hard production blockers

1. Hand treasury vault release authority to a Squads vault PDA and test on devnet.
2. Replace cron promoter with real mint + Stellar indexer confirmation.
3. Replace `user_id_hash` wallet placeholder with HMAC-peppered phone identity.
4. Do not set `withdrawals_enabled = true` on treasury vault until (1) is done.
5. Run all Supabase migrations in order before any durable payment flow.

## Local Development

```bash
nvm use 24
cd app
npm install
npm run dev        # dev server on :5173
```

Useful checks:

```bash
cd app
npm run typecheck
npm run lint
npm run test
npm run build
```

## Environment

Copy `.env.example` (root) or `app/.env.local.example` to `app/.env.local` and fill in only what your branch needs.

### Key variables

| Variable | Side | Required | Description |
|---|---|---|---|
| `VITE_STELLAR_NETWORK` | client | No | `testnet` or `mainnet` (default: `testnet`) |
| `VITE_STELLAR_HORIZON_URL` | client | No | Horizon URL for client-side use |
| `STELLAR_NETWORK` | server | No | Server-side Stellar network |
| `STELLAR_HORIZON_URL` | server | No | Server-side Horizon URL |
| `STELLAR_TREASURY_ACCOUNT` | server | Recommended | Stellar G-account verified XLM payments must reach |
| `STELLAR_INTENT_SECRET` | server | Yes (mainnet) | HMAC key for signing payment intent tokens |
| `VITE_BRZA_ISSUER_ADDRESS` | client | No | Stellar issuer G-account for BRZA |
| `VITE_BRZA_DISTRIBUTOR_ADDRESS` | client | No | Stellar distributor G-account for BRZA |
| `KOTANI_PAY_API_KEY` | server | Yes (M-Pesa) | Kotani Pay API key |
| `KOTANI_API_BASE` | server | No | Kotani API base URL (default: `https://api.kotanipay.com`) |
| `PAYMENT_ADAPTER_PROXY_SECRET` | server | Yes (M-Pesa) | Bearer token for trusted server-to-server payment calls |
| `PAYMENT_PHONE_HASH_PEPPER` | server | Yes (M-Pesa) | HMAC pepper for phone number hashing |
| `VITE_SUPABASE_URL` | client | No | Supabase URL for client reads |
| `VITE_SUPABASE_ANON_KEY` | client | No | Supabase anon key |
| `SUPABASE_URL` | server | Yes (persistence) | Supabase URL for API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Yes (persistence) | Supabase service role key |
| `CRON_SECRET` | server | Yes (production) | Auth header secret for `/api/cron/promote-orders` |
| `VITE_SOLANA_NETWORK` | client | No | `devnet` or `mainnet-beta` (default: `devnet`) |
| `VITE_RPC_ENDPOINT` | client | No | Custom Solana RPC URL |
| `VITE_ADMIN_WALLETS` | client | No | Comma-separated Solana pubkeys for `/admin` access |

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `STELLAR_INTENT_SECRET`, `KOTANI_PAY_API_KEY`, or any private keys in frontend code.

## Deployment

The root Vercel config runs:

```bash
cd app && npm install && npm run build
```

and serves `app/dist`. Node 24 LTS. All API routes run as edge functions.

## Canonical Docs

- Product requirements: `app/docs/PRD.md`
- MVP build architecture: `app/docs/MVP_ARCHITECTURE.md`
- Deployment notes: `app/docs/DEPLOYMENT.md`
- Contract integration notes: `app/docs/CONTRACT_INTEGRATION.md`
- Testnet contract/API review: `docs/TESTNET_CONTRACT_API_REVIEW.md`
- Knowledge graph: `app/src/lib/knowledgeGraph.ts` and `docs/KNOWLEDGE_GRAPH.md`
- Supabase schema: `app/docs/SUPABASE_SCHEMA.sql`
- Migrations: `supabase/migrations/` (run in filename order)

## Notes

- The app is React 18, TypeScript (strict), Vite, Tailwind, Radix UI, Solana wallet adapter, and Stellar SDK.
- Supabase is optional everywhere — all routes and lib functions fall back to local/mock state when env vars are absent.
- All five Anchor programs are implemented with typed IDLs and PDA derivation. See `programs/` and `app/src/lib/programs/idl/`.
- EVM contracts in `contracts/evm/` are deployed on Ethereum, Base, Optimism, Arbitrum, Sepolia, and more. Address files: `contracts/evm/addresses/<chainId>.json`.
- Roadmap items (AI bounties, auctions, cross-chain bridging, Stellar disbursements, advanced treasury execution) must not block the MVP loop.
