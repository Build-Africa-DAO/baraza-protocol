# Deployment Guide

## Prerequisites
- Node.js ≥ 18
- Vercel account + CLI (`npm i -g vercel`)
- Git repository

## Vercel Deployment

### First-time setup
```bash
cd "Project Title"
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

## SPA Routing
`vercel.json` rewrites all routes to `/index.html` for React Router compatibility.

## Build Settings
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`
