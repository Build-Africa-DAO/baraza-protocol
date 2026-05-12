# Baraza Protocol

Baraza is a phone-first community governance and membership product for African groups. The MVP focuses on one tight loop:

```text
Create community
-> Join with wallet or live Africa's Talking sandbox M-Pesa flow
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

## Active Project Layout

```text
app/
  src/           React UI, routes, hooks, and Solana client logic
  docs/          product, architecture, deployment, and contract notes
  package.json   app scripts and dependencies
vercel.json      root deploy config for Vercel
push-baraza.bat  simple git push helper
```

## Canonical Docs

- Product requirements: `app/docs/PRD.md`
- MVP build architecture: `app/docs/MVP_ARCHITECTURE.md`
- Extracted DAO logic reference: `app/docs/DAO_LOGIC_REFERENCE.md`
- Deployment notes: `app/docs/DEPLOYMENT.md`
- Contract integration notes: `app/docs/CONTRACT_INTEGRATION.md`

Treat `MVP_ARCHITECTURE.md` as the source of truth for implementation scope. `DAO_LOGIC_REFERENCE.md` is roadmap/reference material, not an MVP requirement.

## Local Development

```bash
cd app
npm install --legacy-peer-deps
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
```

## Deployment

The root Vercel config runs:

```bash
npm --prefix app install --legacy-peer-deps
npm --prefix app run build
```

and serves `app/dist`.

## Notes

- Older duplicate app trees and export artifacts were removed so this repo reflects the actual deployment target.
- Smart contract integration is still scaffolded around mock data in `app/src/hooks/useBarazaContract.ts`.
- Roadmap items like AI bounties, auctions, cross-chain bridging, Stellar disbursements, and advanced treasury execution should not block the MVP loop.
