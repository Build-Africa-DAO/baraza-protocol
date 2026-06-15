# Baraza Protocol — Claude Code Instructions

## What this is

Baraza is a multi-chain community governance and treasury protocol for African DAOs, chamas, SACCOs, cooperatives, and stokvels. Primary market: Kenya, Tanzania, Uganda, Ethiopia, Nigeria.

**Products:** Baraza Protocol · Baraza TV · IDO/Public Launch · DEX  
**Founder:** Aziz Mohammed (@azizke) — `wethem2022@gmail.com`  
**Live:** baraza-protocol.vercel.app · GitHub: github.com/Azizudinly/baraza-protocol

---

## Chain priority (do not reorder)

1. **Stellar** — primary. All treasuries are Stellar G-accounts. BRZA is a Stellar custom asset. M-Pesa → Kotani Pay → XLM → treasury.
2. **Solana** — governance. 5 Anchor programs (written, not deployed to devnet yet).
3. **Base (EVM)** — secondary. Aragon OSx Manager factory at known addresses.
4. **Celo** — mobile. GoodDollar G$ identity. Scaffold only.

Stellar launches first. Never treat EVM or Solana as launch blockers.

---

## Architecture rules — never break

- All business logic lives in `app/src/lib/` — components → hooks → lib. Never import lib directly in components.
- Chain adapters (`app/src/lib/adapters/`) are the single entry point for all chain interactions.
- Wallet support: **Phantom, Solflare, Coinbase Wallet only** — do not add others.
- Supabase is optional everywhere — every route falls back gracefully without env vars.
- `intentToken` is required for Stellar mainnet verification — legacy fields dev-only.
- Activation secret is client-side only from order creation to membership activation.
- BRZA ≠ XLM — never conflate the token with the payment rail.
- `withdrawals_enabled` stays `false` until multisig handoff is tested on devnet.
- Update `app/src/lib/knowledgeGraph.ts` when adding chain rails, contracts, or settlement routes.
- Do not reference Builder Protocol or Nouns in UI, docs, or comments — use Aragon OSx.
- Do not add Magic UI or heavy animation libraries.

---

## BRZA token (quick ref)

- **Supply:** 1,000,000,000 · 7 decimals · Stellar custom asset
- **Phase 0:** $0.02 · **IDO:** $0.10
- **Source of truth:** `app/src/lib/brza/constants.ts`

| Bucket | % | Vesting |
|---|---|---|
| Community Rewards | 20% | Emission 2M/month |
| Founder A + B | 7.5% each | 1yr cliff + 3yr vest |
| Operations | 15% | Milestone-gated |
| Public Sale | 12% | Phase 0 (20M) + IDO (100M) |
| Reserve | 10% | 1yr cliff + 3yr vest |
| Liquidity Pool | 8% | Unlock at IDO |
| Grants | 8% | 6mo cliff + 2yr vest |
| Referral | 5% | Per event |
| Events | 4% | Per event |
| Baraza TV Creators | 3% | Per content milestone |

---

## Security — never relax

- Use `crypto.timingSafeEqual` for all secret comparisons — never `===`
- Never log or expose: `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `KOTANI_PAY_API_KEY`, private keys
- `payment_orders` SELECT is `false` via RLS — reads go through `/api/payment-orders/status` + activation secret
- Rate-limit payment routes before public launch

---

## Key files

| File | Purpose |
|---|---|
| `AGENTS.md` | Full agent instructions, API routes, payment flow source of truth |
| `app/src/lib/brza/constants.ts` | BRZA tokenomics, allocation, vesting, emission |
| `app/src/lib/chains/config.ts` | Chain config + Aragon OSx addresses |
| `app/src/lib/evm/manager.ts` | Aragon OSx deployDao() client |
| `app/src/lib/evm/base-governance.ts` | viem governance: castVote, getVotes, proposal state |
| `app/src/lib/programs/pda.ts` | Solana PDA derivation (all 5 programs) |
| `app/api/agent/chat.ts` | Akili community brain (Claude claude-sonnet-4-6, SSE streaming) |
| `app/src/lib/akili/` | Akili Council — 5 specialised one-shot agents (Amara, Kofi, Zara, Nia, Seku) |
| `app/api/stellar/verify-payment.ts` | Payment verification — HMAC, Horizon, Supabase |
| `supabase/migrations/` | Run 001–010 in filename order before any payment flow |
| `docs/NEXT_STEPS.md` | Phase 0–5 PRD with dependency order |
| `docs/CLAUDE_CONTEXT_PROMPT.md` | Full context for new sessions |

---

## AI layer

- **Akili brain** (`/api/agent/chat`) — Claude claude-sonnet-4-6 streaming. Drafts proposals, flags bad ones, answers community questions. Falls back to static when `ANTHROPIC_API_KEY` unset.
- **Akili Council** (`app/src/lib/akili/`) — 5 specialised one-shot agents: Amara (community intel), Kofi (governance), Zara (compliance), Nia (research), Seku (content). Invoke via `invokeCouncilAgent(name, message)`.
- **Dev swarm** (`.github/workflows/agent-swarm.yml`) — 4 parallel agents on every PR: SEO · Design · Security · Code. Requires `ANTHROPIC_API_KEY` in GitHub secrets.

---

## Immediate blockers (in order)

1. `ANTHROPIC_API_KEY` → Vercel + GitHub secrets
2. Supabase env vars → Vercel (URL, anon key, service role key)
3. `supabase db push` — run migrations 001–012
4. Fund Stellar testnet treasury G-account + run XLM payment verification smoke
5. Replace demo cron promoter with real BRZA mint submission logic

---

## Do not

- Add wallets beyond Phantom, Solflare, Coinbase Wallet
- Commit secrets, private keys, or service role keys
- Set `withdrawals_enabled = true` before multisig handoff
- Relax `intentToken` requirement for Stellar mainnet
- Bypass activation secret gate in `membership/activate.ts`
- Reference Builder Protocol, Nouns DAO, or noun.wtf anywhere
