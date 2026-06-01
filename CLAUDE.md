# Baraza Protocol — Claude Code Instructions

## What this repo is

Baraza is a community finance and governance protocol for African communities. It lets groups pool funds, run proposals, pay bounties, and verify membership across multiple chains (Solana, Stellar, Celo/GoodDollar, EVM). The native token is **BRZA** — a Stellar custom asset (1B supply, 7 decimals, phase-0 price $0.02).

## Repo layout

```
app/                    Vite + React frontend (TypeScript, Tailwind)
  src/
    components/         UI components
    hooks/              React hooks (useBarazaContract, useBarazaData, useChain, …)
    lib/                All business logic — no UI
      adapters/         Chain adapters: solana.ts, stellar.ts, evm.ts, celo.ts, kotani.ts
      brza/             BRZA token constants, treasury reader
      chains/           Chain config and constants
      programs/         Anchor IDLs, PDA helpers, Solana client
      gooddollar/       G$ SDK, identity, token
      tokens/           Community token and umbrella token logic
    pages/              Route-level page components
    types/              Shared TypeScript types
  api/                  Vite/server-side API routes (Stellar, membership, M-Pesa, cron)

programs/               Five Anchor/Solana programs (Rust)
  community_registry/
  governance/
  membership/
  payment_attestation/
  treasury_vault/

contracts/evm/          ERC-721 governance token (Solidity, Forge)
  src/token/            Token.sol, IToken.sol, storage/, types/

supabase/               Supabase migration files
docs/                   KNOWLEDGE_GRAPH.md, TESTNET_CONTRACT_API_REVIEW.md
Anchor.toml             Anchor workspace — cluster currently set to localnet
```

## Commands

```bash
# Frontend
cd app
npm run dev          # dev server on :5173
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run (all unit tests)
npm run test:watch   # vitest watch

# Solana programs
cargo test --workspace          # run all Rust tests
anchor build                    # compile programs
anchor deploy --provider.cluster devnet   # deploy to devnet (needs solana CLI)

# EVM contracts (Foundry)
cd contracts/evm
forge build
forge test
```

## Architecture rules

- **All business logic lives in `app/src/lib/`** — never import business logic directly inside components. Components call hooks; hooks call lib functions.
- **Chain adapters are the single entry point** for all chain interactions. Do not call Solana/Stellar/EVM SDKs directly from hooks or components.
- **Wallet support is restricted to Phantom, Solflare, and Coinbase Wallet** via the custom `BarazaWalletModalProvider`. Do not add other wallets.
- **`app/src/lib/knowledgeGraph.ts`** must be updated whenever a new chain rail, contract address, settlement route, or testnet readiness task is added.
- **BRZA token config** lives in `app/src/lib/brza/constants.ts`. Token economics are `as const` — do not mutate at runtime.
- **Supabase is optional** — every API route and lib function must work without Supabase env vars (fall back to local/mock state gracefully).
- **No fallback program IDs in production.** `app/src/lib/programs/pda.ts` uses `PLACEHOLDER_CONTRACT_ADDRESS` as a dev fallback. These must be replaced with real Vercel env vars before production.

## Environment variables

Frontend vars are prefixed `VITE_`. Server-only vars have no prefix. See `.env.example` at repo root for the full list. Key ones:

```
VITE_SOLANA_NETWORK          devnet | mainnet-beta
VITE_RPC_ENDPOINT            Solana RPC URL
VITE_STELLAR_NETWORK         testnet | mainnet
VITE_STELLAR_HORIZON_URL
VITE_BRZA_ISSUER_ADDRESS     Stellar issuer G-account
VITE_BRZA_DISTRIBUTOR_ADDRESS
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    server-only
STELLAR_TREASURY_ACCOUNT     server-only
CRON_SECRET                  server-only
PAYMENT_ADAPTER_PROXY_SECRET server-only, trusted payment workflow auth
PAYMENT_PHONE_HASH_PEPPER    server-only, HMAC pepper for phone hashes
KOTANI_PAY_API_KEY           server-only
```

## Coding conventions

- TypeScript strict mode. No `any` unless unavoidable and commented.
- No comments unless the WHY is non-obvious. No docblocks.
- Tailwind for all styling — no inline styles, no CSS modules.
- Vitest + jsdom for tests. Test files live in `src/lib/__tests__/`.
- Do not mock Supabase in tests — structure lib functions so Supabase is injectable.
- ESLint is enforced in CI. Fix lint before committing.

## Current testnet status

| Chain | Status | Blocker |
|---|---|---|
| Stellar | testnet-ready | Fund treasury G-account, set STELLAR_TREASURY_ACCOUNT |
| Solana | partial | `solana` CLI missing from PATH; Anchor.toml still targets localnet |
| Celo/GoodDollar | coming-soon | Need Alfajores token/identity addresses |
| EVM | partial | All contract addresses are placeholders |

## Hard production blockers (do not enable treasury withdrawals until these are done)

1. `programs/governance/src/lib.rs` — treasury CPI dispatch is wired; rule changes and membership actions are still TODO
2. `programs/treasury_vault/src/lib.rs` — proposal validation, replay blocking, and release-authority enforcement are wired; hand the release authority to a Squads vault PDA and test it on devnet
3. Supabase payment orders must be wired to `payment_attestation::attest_payment` + on-chain `activate_member`

## Do not

- Do not change wallet adapter list (Phantom, Solflare, Coinbase only)
- Do not add Magic UI or other heavy animation libraries — they were removed deliberately
- Do not add features beyond what the current task requires
- Do not enable `withdrawals_enabled = true` on treasury vault for testnet
- Do not commit real private keys, seed phrases, or service role secrets
- Do not import files from another repo with logic changes — copy verbatim
