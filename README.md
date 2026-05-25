# Baraza Protocol

Baraza is a phone-first community governance and membership product for African groups. The MVP focuses on one tight loop:

```text
Create community
  -> Join with wallet, M-Pesa simulator, or Stellar XLM verification
-> Reconcile payment
-> Mint/display membership asset
-> Activate MemberAccount
-> Create proposal
-> Vote
-> Show treasury and activity state
```

The active app in this repo is the Vite React SPA in `app/`. The root `vercel.json` builds and deploys that folder.

## Current MVP Decisions

- Membership asset: Metaplex NFT/Core-style asset for wallet visibility.
- Governance access: `MemberAccount` is the source of truth; token ownership alone does not grant voting rights.
- Token-2022: `NonTransferable` is not the MVP path.
- Treasury: real Solana treasury vault/account for deposits and balance visibility; withdrawals stay disabled until audit, emergency pause, and multisig/Squads controls exist.
- Mobile money demo: live Africa's Talking sandbox M-Pesa webhook is required. Simulation is only for local developer tests.

## MVP Payment Scope

MVP payment methods:

- M-Pesa through Africa's Talking live sandbox for the first demo.
- Stellar XLM transaction-hash verification through Horizon for review/demo flows.
- Optional wallet-native crypto checkout through Solana Pay or Solana Commerce Kit.

Not MVP:

- x402 payment.
- Credit/debit card checkout.
- Cross-chain bridge checkout.
- Broad multi-chain payment-method picker beyond Solana + Stellar.

x402 can be useful later for pay-per-request APIs, agent services, gated content, or micro-access flows. It should not be used as the first membership checkout rail.

## MVP vs Roadmap

MVP on Solana:

- Community accounts, membership tiers, member records, proposals, vote receipts, payment attestations, and treasury vault state.
- Metaplex NFT/Core-style membership display asset paired with `MemberAccount`.
- Real treasury vault/account for deposits and balance visibility.
- Payment attestation consumption so one payment cannot mint twice.
- Refund queue/manual review path for failed payment, duplicate payment, or permanent mint failure.

MVP off-chain:

- User identity, phone/email, provider references, webhook payloads, refunds, and admin review stay in the private database.
- Africa's Talking sandbox webhook is the required demo payment source.
- Helius/indexer confirmation or fallback polling is required before final membership success.

Roadmap only:

- Stellar Disbursement Platform and SEP/anchor flows for off-ramp, contributor payouts, or refunds.
- LI.FI, Circle CCTP, Allbridge, Mayan, Jupiter swaps, and other bridge/swap routing.
- x402, card checkout, multi-chain checkout, and broad payment-method picker.
- Bounty escrow, auctions, displaced-bid refunds, AI review, growth marketplace, and investment-like tokens.

Roadmap features must not block the MVP loop or be treated as acceptance criteria.

## Active Project Layout

```text
app/
  src/           React UI, routes, hooks, and Solana client logic
  api/           Vercel serverless API routes deployed with the app root
  docs/          product, architecture, deployment, and contract notes
  package.json   app scripts and dependencies
vercel.json      root deploy config for Vercel
push-baraza.bat  simple git push helper
```

## Canonical Docs

- Product requirements: `app/docs/PRD.md`
- MVP build architecture: `app/docs/MVP_ARCHITECTURE.md`
- Extracted DAO logic reference: `app/docs/DAO_LOGIC_REFERENCE.md`
- Governance contract roadmap: `app/docs/GOVERNANCE_CONTRACT_ROADMAP.md`
- Deployment notes: `app/docs/DEPLOYMENT.md`
- Contract integration notes: `app/docs/CONTRACT_INTEGRATION.md`
- Supabase schema starter: `app/docs/SUPABASE_SCHEMA.sql`

Treat `MVP_ARCHITECTURE.md` as the source of truth for implementation scope. `DAO_LOGIC_REFERENCE.md` is roadmap/reference material, not an MVP requirement.

## Current Implementation Status

The app is currently an integrated review build, not an MVP-complete production product.

Working today:

- Vite React SPA builds from `app/`.
- Wallet adapter wiring is present for Phantom, Solflare, and Coinbase Wallet.
- Community, proposal, membership, treasury, and bounty screens render from Supabase when configured, with local fallback data for review.
- The contract hook exists at `app/src/hooks/useBarazaContract.ts` and blocks unwired write flows instead of submitting no-op transactions.
- Community creation and bounty workflows save to Supabase when configured, or to localStorage in local development.
- Join dues can be verified through the M-Pesa simulator or Stellar testnet/mainnet Horizon.
- The app uses the Baraza SVG mark from `app/public/baraza-logo.svg` for the header/footer logo and favicon.
- The active colour palette is `#8ECAE6`, `#219EBC`, `#023047`, `#FFB703`, and `#FB8500`.

Current prototype guardrails:

- Proposal creation and vote actions still need real Solana program instructions before they are production-grade.
- Unknown community IDs render a not-found state instead of falling back to the first mock community.
- The dashboard "New Decision" link now targets the registered route `/dashboard/:id/decisions/create`.
- New community success is ready to navigate by created community ID once persistence returns a real record.

Before production readiness, the app still needs real provider webhooks, deployed Solana program instructions, production Supabase migrations, and reviewer-verified Vercel environment variables.

## Local Development

```bash
nvm use 20
cd app
npm install
npm run dev
```

## Production Build

```bash
cd app
npm run build
```

Useful checks:

```bash
cd app
npm run typecheck
npm run lint
npm run build
```

## Environment

Copy `app/.env.example` to `app/.env.local` if present, then configure only the integrations needed for your branch.

Common variables:

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_RPC_ENDPOINT` | No | Custom Solana RPC URL |
| `VITE_PROGRAM_ID` | No | Baraza on-chain program ID |
| `VITE_SUPABASE_URL` | No | Supabase URL for off-chain metadata/state |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `SUPABASE_URL` | Yes for server persistence | Supabase project URL for API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for server persistence | Server-only Supabase service role key |
| `STELLAR_NETWORK` | No | Server-side Stellar network, usually `testnet` for review |
| `STELLAR_HORIZON_URL` | No | Server-side Horizon URL |
| `STELLAR_TREASURY_ACCOUNT` | Recommended | Stellar account that verified XLM payments must reach |

Never expose payment provider secrets, webhook secrets, private keys, or admin credentials in frontend code.

## Reviewer Readiness

- Vercel is linked to `baraza-protocol`.
- Non-secret review envs for Solana devnet and Stellar testnet are configured in Vercel production/development.
- Supabase production envs are still required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Run all SQL files in `supabase/migrations/` in filename order before testing durable production flows.
- A live Stellar testnet payment was verified locally through `/api/stellar/verify-payment` using Horizon ledger `2731921`.

## Deployment

The root Vercel config runs:

```bash
cd app && npm install && npm run build
```

and serves `app/dist`.

## Notes

- Older duplicate app trees and export artifacts were removed so this repo reflects the actual deployment target.
- The repository has one README: this root file is canonical for setup and scope.
- The app is React 18, TypeScript, Vite, Tailwind, Radix UI, and Solana wallet adapter.
- The app currently uses mock community/proposal/member data.
- Smart contract integration is still scaffolded around mock data in `app/src/hooks/useBarazaContract.ts`.
- Anchor program integration still needs real instructions, IDL, PDAs, and tests.
- Roadmap items like AI bounties, auctions, cross-chain bridging, Stellar disbursements, and advanced treasury execution should not block the MVP loop.
