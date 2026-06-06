# Baraza Protocol

**On-chain governance and community treasury for African DAOs, chamas, SACCOs, cooperatives, and stokvels.**

Live at [baraza-protocol.vercel.app](https://baraza-protocol.vercel.app) · GitHub: [Azizudinly/baraza-protocol](https://github.com/Azizudinly/baraza-protocol)

---

## What is Baraza?

A *baraza* is a community gathering — a place where decisions are made together. This protocol brings that to the blockchain.

Baraza lets any African community — a chama of 12 women in Nairobi, a SACCO in Kampala, a student cooperative in Lagos — create a shared treasury, collect membership dues via M-Pesa, govern their funds through on-chain proposals, and earn BRZA governance tokens as they participate.

No bank account required. No middlemen. Phone number is enough to join.

**How it works:**

```
Create community (Stellar treasury account)
  → Member pays via M-Pesa or XLM
  → Kotani Pay converts KES → XLM → community treasury
  → Payment verified on Stellar Horizon
  → BRZA governance tokens minted to member
  → Member creates proposals + votes
  → Treasury releases require governance vote + multisig
```

**Protocol fee:** 2% of each payment auto-routes to the Baraza reserve vault.

---

## Chain Support

| Chain | Role | Status |
|---|---|---|
| **Stellar** | Primary. Treasury, BRZA token, payments | Active |
| **Solana** | Governance programs (community registry, proposals, votes, treasury vault) | Devnet |
| **Base** | EVM governance via Nouns-style Manager factory | Integrated |
| Arbitrum, Optimism, Celo | EVM secondary rails | Config only |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript (strict), Vite |
| Animations | Framer Motion |
| Styling | Tailwind CSS, Radix UI |
| Wallet | Phantom, Solflare, Coinbase Wallet (custom modal) |
| Stellar | Stellar SDK JS, Horizon REST, HMAC intent tokens |
| Solana | Anchor framework, 5 on-chain programs |
| EVM | viem, Base chain via Manager factory |
| Database | Supabase (PostgreSQL + RLS) |
| Payments | Kotani Pay (M-Pesa → XLM), Minisend, Africa's Talking STK push |
| Deployment | Vercel (Fluid Compute, Node 24) |
| CI | GitHub Actions (typecheck + lint + test + build) |
| Tests | vitest + jsdom — 231 passing |

---

## Folder Structure

```
baraza-protocol/
├── app/                          # Vite React SPA — the live application
│   ├── src/
│   │   ├── components/           # UI components (community, governance, onboarding, treasury)
│   │   ├── pages/                # Route-level pages
│   │   ├── hooks/                # React hooks (wallet, Supabase, chain clients)
│   │   └── lib/
│   │       ├── stellar/          # Horizon client, intent tokens, payment verification
│   │       ├── evm/              # viem clients, Manager factory, Base governance
│   │       ├── brza/             # BRZA token constants and distributor logic
│   │       ├── chains/           # Multi-chain config
│   │       └── adapters/         # Payment adapter interfaces
│   ├── api/                      # Vercel serverless API routes
│   │   ├── stellar/              # create-payment-intent.ts, verify-payment.ts
│   │   ├── membership/           # activate.ts
│   │   ├── payments/             # brza-membership.ts, kotani.ts, minisend.ts
│   │   ├── payment-orders/       # status.ts
│   │   ├── cron/                 # promote-orders.ts (payment state machine)
│   │   └── webhooks/             # africastalking.ts, kotani.ts
│   ├── docs/                     # PRD, architecture, deployment, contract notes
│   ├── public/                   # baraza-logo-v2.svg, brza-token-logo.svg
│   ├── .env.example              # All environment variables documented
│   └── package.json
├── programs/                     # Anchor / Solana smart programs
│   ├── community_registry/       # Community identity PDA + admin handoff
│   ├── governance/               # Proposals, votes, timelock, veto
│   ├── membership/               # Tiers, member records, payment activation
│   ├── payment_attestation/      # Off-chain payment bridge
│   └── treasury_vault/           # Per-community SOL vault, deposit/release
├── contracts/
│   └── evm/                      # Solidity DAO contracts (Token, Auction, Governor, Treasury)
├── supabase/
│   └── migrations/               # 001–010 — run in order before any payment flow
├── .github/workflows/ci.yml      # CI pipeline
├── vercel.json                   # Vercel build + rewrite config
└── Anchor.toml                   # Anchor workspace config
```

---

## Run Locally

**Prerequisites:** Node 24, npm

```bash
# 1. Clone
git clone https://github.com/Azizudinly/baraza-protocol.git
cd baraza-protocol

# 2. Install dependencies
npm --prefix app install --legacy-peer-deps

# 3. Set up environment variables
cp app/.env.example app/.env.local
# Open app/.env.local and fill in what you need (see table below)
# For basic UI: only VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY needed
# For payments: see full table

# 4. Start dev server
npm --prefix app run dev
# → http://localhost:5173
```

**Other useful commands:**

```bash
npm --prefix app run typecheck   # TypeScript strict check
npm --prefix app run lint        # ESLint
npm --prefix app run test        # 231 unit tests (vitest)
npm --prefix app run build       # Production build → app/dist
```

---

## Environment Variables

Copy `app/.env.example` to `app/.env.local`. You only need to fill what your work requires.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `KOTANI_PAY_API_KEY`, or any private keys in frontend code.

### Core (all contributors)

| Variable | Side | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anon key (safe to expose) |
| `SUPABASE_URL` | Server | Same URL — used by API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Bypasses RLS. Never expose to browser. |

### Stellar + BRZA

| Variable | Side | Description |
|---|---|---|
| `VITE_STELLAR_NETWORK` | Client | `testnet` or `mainnet` |
| `VITE_STELLAR_HORIZON_URL` | Client | Horizon endpoint for client reads |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Client | Stellar network passphrase |
| `STELLAR_NETWORK` | Server | Server-side network |
| `STELLAR_HORIZON_URL` | Server | Server-side Horizon endpoint |
| `STELLAR_TREASURY_ACCOUNT` | Server | G-account that receives membership payments |
| `STELLAR_INTENT_SECRET` | Server | 32-byte HMAC key for payment intent tokens. Generate: `openssl rand -hex 32` |
| `VITE_STELLAR_TREASURY_ACCOUNT` | Client | Mirror of treasury account (for UI display) |
| `VITE_BRZA_ISSUER_ADDRESS` | Client | BRZA issuer G-account |
| `VITE_BRZA_DISTRIBUTOR_ADDRESS` | Client | BRZA distributor G-account |
| `BRZA_ISSUER_ADDRESS` | Server | Server-side mirror |
| `BRZA_DISTRIBUTOR_ADDRESS` | Server | Server-side mirror |

### Payments

| Variable | Side | Description |
|---|---|---|
| `KOTANI_PAY_API_KEY` | Server | Kotani Pay API key (M-Pesa → XLM) |
| `KOTANI_API_BASE` | Server | Default: `https://api.kotanipay.com` |
| `KOTANI_WEBHOOK_SECRET` | Server | Webhook signature secret from Kotani dashboard |
| `AT_USERNAME` | Server | Africa's Talking username |
| `AT_API_KEY` | Server | Africa's Talking API key |
| `PAYMENT_ADAPTER_PROXY_SECRET` | Server | Bearer token for server-to-server payment calls. Generate: `openssl rand -hex 32` |
| `PAYMENT_PHONE_HASH_PEPPER` | Server | HMAC pepper for phone number hashing. Generate: `openssl rand -hex 32` |
| `MINISEND_API_KEY` | Server | Minisend off-ramp (optional) |

### Infrastructure

| Variable | Side | Description |
|---|---|---|
| `CRON_SECRET` | Server | Auth token for `/api/cron/promote-orders` |
| `VITE_SOLANA_NETWORK` | Client | `devnet` or `mainnet-beta` |
| `VITE_RPC_ENDPOINT` | Client | Custom Solana RPC URL |
| `VITE_ADMIN_WALLETS` | Client | Comma-separated wallet addresses for `/admin` |
| `VITE_BASE_TESTNET` | Client | Set `true` to target Base Sepolia |
| `VITE_BASE_RPC_URL` | Client | Custom Base RPC (optional) |

Full annotated list with all optional variables: [`app/.env.example`](app/.env.example)

---

## Contributing

We follow a `dev` → `main` flow. `main` is always deployable.

```
main        ← production (Vercel auto-deploys on merge)
 └── dev    ← integration branch — PRs merge here first
      └── feat/your-feature
      └── fix/your-fix
      └── chore/your-task
```

**Steps:**

```bash
# 1. Fork the repo and clone your fork
git clone https://github.com/YOUR_USERNAME/baraza-protocol.git
cd baraza-protocol

# 2. Branch off dev
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name

# 3. Make your changes
npm --prefix app run typecheck   # must pass
npm --prefix app run lint        # must pass
npm --prefix app run test        # must pass

# 4. Push and open a PR into dev (not main)
git push origin feat/your-feature-name
# → open PR: base: dev, compare: feat/your-feature-name
```

**PR checklist:**
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run test` passes (231+ tests)
- [ ] New API routes have at least one vitest test
- [ ] No secrets committed (check `.env.local` is in `.gitignore`)
- [ ] PR description explains what changed and why

**CI** runs automatically on every PR: TypeScript check → ESLint → unit tests → build. All three jobs must pass before merge.

---

## Open Bounties

These are the production blockers. Each has a bounty attached. See the full briefs (with acceptance criteria and reward ranges) in [`app/docs/BOUNTIES.md`](app/docs/BOUNTIES.md).

| # | Task | Skills | Reward |
|---|---|---|---|
| 1 | Wire community creation to Supabase + Soroban | TypeScript, Supabase | $200–$400 |
| 2 | Wire join flow to real payment orders (Stellar testnet) | TypeScript, Stellar SDK | $400–$700 |
| 3 | M-Pesa webhook flow — AT sandbox end-to-end | TypeScript, AT SDK | $150–$250 |
| 4 | Proposal creation + vote casting APIs | TypeScript, Supabase | $350–$600 |
| 5 | Phone identity bridge (replace wallet placeholder) | TypeScript, crypto | $250–$450 |
| 6 | Treasury vault multisig via Squads (devnet) | Rust, Anchor, Squads v4 | $500–$1,000 |
| 7 | BRZA token issuance + Stellar event indexer | Stellar SDK, TypeScript | $600–$1,200 |

**To apply:** Open an issue referencing the bounty number, describe your approach in 2–3 sentences, and tag `@Azizudinly`. First-come-first-served for scoped tasks.

---

## Hard Production Blockers

These must be resolved before any real user funds are at risk:

1. Hand treasury vault release authority to a Squads vault PDA and test on devnet.
2. Replace cron promoter with real BRZA mint + Stellar indexer confirmation.
3. Replace `user_id_hash` wallet placeholder with HMAC-peppered phone identity.
4. Do **not** set `withdrawals_enabled = true` on treasury vault until (1) is done.
5. Apply all Supabase migrations (`supabase/migrations/001` → `010`) before any durable payment flow.

---

## Links

- **Live app:** [baraza-protocol.vercel.app](https://baraza-protocol.vercel.app)
- **GitHub:** [github.com/Azizudinly/baraza-protocol](https://github.com/Azizudinly/baraza-protocol)
- **Farcaster:** [@azizke](https://warpcast.com/azizke)
- **BuildAfrica DAO:** Coming soon

---

## License

MIT — free to use, fork, and build on. See [`LICENSE`](LICENSE).

Built by the Baraza community. Africa-first. Open source forever.
