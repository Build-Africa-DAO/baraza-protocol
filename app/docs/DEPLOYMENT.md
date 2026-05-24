# Deployment Guide

## Prerequisites
- Node.js ≥ 18
- Vercel account + CLI (`npm i -g vercel`)
- Git repository

## Vercel Deployment

### First-time setup
```bash
cd app
vercel
# Follow prompts: link to project, set framework to Vite
```

### Production deploy
```bash
vercel --prod
```

### Environment Variables (Vercel Dashboard)
Set these in Project Settings → Environment Variables:
- `VITE_RPC_ENDPOINT` — Optional custom RPC
- `VITE_PROGRAM_ID` — Baraza program ID once deployed
- `VITE_STELLAR_NETWORK` — `testnet`, `mainnet`, or `custom`
- `VITE_STELLAR_HORIZON_URL` — Horizon URL used for Stellar balance and tx confirmation
- `VITE_STELLAR_NETWORK_PASSPHRASE` — Stellar network passphrase
- `VITE_DEWORK_WORKSPACE_URL` — Dework workspace used for bounty posting and submissions

For Stellar testnet review:
```bash
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

## SPA Routing
`vercel.json` rewrites all routes to `/index.html` for React Router compatibility.

## Build Settings
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`
