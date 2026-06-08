# Baraza Protocol — Claude Code Context Prompt

> Copy and paste this entire document as the first message when starting a new Claude Code session on this repo. It gives Claude full product, architecture, tokenomics, and decision context without needing to re-explain every session.

---

## Who you are working with

Aziz Mohammed (azizudinly / @azizke on Farcaster), founder of Baraza Protocol. Building Africa's first multi-chain community governance and treasury protocol — for chamas, SACCOs, cooperatives, DAOs, and stokvels. Primary market: Kenya, Tanzania, Uganda, Ethiopia, Nigeria. Primary payment rail: M-Pesa via Kotani Pay.

---

## What Baraza is

Baraza is a governance and treasury protocol for African community groups. It lets communities:
- Pool funds in Stellar treasury accounts
- Pay membership dues in KES via M-Pesa (converted to XLM via Kotani Pay)
- Govern shared resources through proposals and votes
- Earn and distribute BRZA — the native Stellar custom asset

**Products in the ecosystem:**
1. **Baraza Protocol** — core governance/treasury/membership (this repo)
2. **Baraza TV** — content/media layer, creator fund, community channels
3. **Public Launch / IDO** — Phase 0 at $0.02, IDO at $0.10 on Stellar DEX
4. **DEX** — BRZA/XLM on Stellar SDEX, BRZA/USDC on Base, BRZA/cUSD on Celo

---

## Chain architecture

| Chain | Role | Status |
|---|---|---|
| **Stellar** | Primary settlement. All treasuries are Stellar G-accounts. BRZA is a Stellar custom asset. M-Pesa → Kotani → XLM → treasury. | testnet-ready |
| **Solana** | Governance layer. 5 Anchor programs: community registry, governance, membership, payment attestation, treasury vault. | written, not deployed |
| **Base (EVM)** | Secondary governance. Aragon OSx Manager factory at known addresses. ERC-721 NFT membership. | wired, not deployed |
| **Celo** | Mobile-first. GoodDollar G$ identity + bounty rewards. | scaffold |

**Hard rule**: Stellar is the launch chain. Do not treat EVM/Solana as launch blockers.

---

## BRZA Token

- **Type**: Stellar custom asset
- **Supply**: 1,000,000,000 (1B), 7 decimals
- **Issuer**: `VITE_BRZA_ISSUER_ADDRESS` (Stellar G-account, env var)
- **Distributor**: `VITE_BRZA_DISTRIBUTOR_ADDRESS` (Stellar G-account, env var)

### Allocation

| Bucket | Tokens | % | Cliff | Vest |
|---|---|---|---|---|
| Community Rewards | 200,000,000 | 20% | 0 | Emission 2M/month |
| Founder A | 75,000,000 | 7.5% | 12 months | 36 months |
| Founder B | 75,000,000 | 7.5% | 12 months | 36 months |
| Operations | 150,000,000 | 15% | 0 | 36 months (milestone-gated) |
| Public Sale | 120,000,000 | 12% | 0 | Phase 0: 20M · IDO: 100M |
| Reserve | 100,000,000 | 10% | 12 months | 36 months |
| Liquidity Pool | 80,000,000 | 8% | 0 | Unlock at IDO, locked 12 months |
| Referral | 50,000,000 | 5% | 0 | Per referral event |
| Grants | 80,000,000 | 8% | 6 months | 24 months |
| Events | 40,000,000 | 4% | 0 | Per event |
| Baraza TV Creator Fund | 30,000,000 | 3% | 0 | Per content milestone |

### Price phases

| Phase | Price | Label |
|---|---|---|
| phase0 | $0.02 | Community Seed |
| launch | $0.10 | IDO |
| market | TBD | Post-IDO |

### Token flow

- **Protocol fee**: 2% of all treasury transactions → reserve vault
- **Swap fee**: 0.5% on DEX swaps → LP providers
- **Join reward**: member earns BRZA on activation (from community rewards pool)
- **Vote reward**: voter earns BRZA per cast vote
- **Proposal anti-spam**: proposer stakes BRZA; rejected proposals burn 10% of stake
- **Buyback loop**: quarterly — reserve vault buys BRZA on DEX → 50% burned, 50% back to community rewards
- **Baraza TV**: 70% subscription revenue to creator, 20% to community DAO treasury, 10% to protocol reserve
- **IDO proceeds**: 60% operations, 30% liquidity, 10% development grants
- **IDO gate**: TVL must reach $50,000 in Stellar pool before IDO opens

---

## Payment flow (source of truth)

### Stellar XLM path
```
Client → POST /api/stellar/create-payment-intent
  Server signs HMAC intent token (communityId + amountXlm + expiresAt + nonce)
  Returns intentToken

User sends XLM on Stellar network

Client → POST /api/stellar/verify-payment { txHash, intentToken }
  Server verifies HMAC (required on mainnet, legacy allowed dev-only)
  Fetches tx from Horizon: successful, native payment, amount >= expected, to == treasury
  Writes payment_orders row (PAYMENT_CONFIRMED)
  Returns { orderId, activationSecret }

Cron /api/cron/promote-orders advances order state machine
Client polls /api/payment-orders/status

Client → POST /api/membership/activate { orderId, communityId, walletAddress, activationSecret }
  Writes memberships row (ACTIVE)
```

### M-Pesa path
```
POST /api/payments/brza-membership (server-to-server, Bearer PAYMENT_ADAPTER_PROXY_SECRET)
  → Kotani POST /v1/onramp/stellar (KES → XLM → community treasury)
  → payment_orders row (CREATED → PAYMENT_PENDING)

POST /api/payments/reconcile-brza-membership { orderId }
  → Polls Kotani status → updates payment_orders

After PAYMENT_CONFIRMED → same cron + activate path as Stellar
```

### Order state machine
```
CREATED → PAYMENT_PENDING → PAYMENT_CONFIRMED → MINT_QUEUED → MINT_SUBMITTED
  → MINT_CONFIRMED → INDEXER_CONFIRMED → RECONCILED

Failure: PAYMENT_FAILED | PAYMENT_EXPIRED | AMOUNT_MISMATCH
```

---

## Repo structure

```
app/                      Vite + React SPA (TypeScript, Tailwind, Node 24)
  api/                    Vercel serverless functions
    agent/chat.ts         Asha AI community brain (Claude claude-sonnet-4-6, streaming SSE)
    stellar/              create-payment-intent.ts, verify-payment.ts
    payments/             brza-membership.ts, reconcile, kotani, minisend
    membership/activate.ts
    payment-orders/status.ts
    cron/promote-orders.ts
    webhooks/             africastalking.ts, kotani.ts
  src/
    components/
      chat/AshaChat.tsx   Community brain UI (streaming, falls back to static)
    lib/
      adapters/           solana.ts, stellar.ts, evm.ts, celo.ts
      brza/               constants.ts (allocations, phases, vesting, emission)
      chains/config.ts    Chain config + Base Aragon OSx addresses
      evm/
        base-governance.ts  viem client: castVote, getVoteWeight, ozStateToBaraza
        manager.ts          Aragon OSx deployDao() factory client
      programs/pda.ts     Solana PDA seed derivation (all 5 programs)

programs/                 5 Anchor/Solana programs (Rust)
contracts/evm/            ERC-721 governance token (Forge/Foundry)
contracts/stellar/        Soroban Rust contracts (5 — written, not deployed)
supabase/migrations/      001–010 SQL migrations (run in filename order)
.github/workflows/
  ci.yml                  TypeCheck + Lint + Test + Build on every push/PR
  agent-swarm.yml         4 AI agents on every PR: SEO, Design, Security, Code
scripts/agents/review.mjs Swarm runner (claude-opus-4-7 via Anthropic API)
docs/
  NEXT_STEPS.md           Phase 0–5 PRD with priority order
  PROTOCOL_STATUS_*.md    Current testnet readiness
  KNOWLEDGE_GRAPH.md      Node/edge types for the graph
```

---

## Architecture rules (never break these)

1. **All business logic lives in `app/src/lib/`** — components → hooks → lib. Never import lib directly in components.
2. **Chain adapters are the single entry point** for all chain interactions.
3. **Wallet support: Phantom, Solflare, Coinbase Wallet only** — no other wallets.
4. **Supabase is optional everywhere** — every API route falls back gracefully.
5. **intentToken is required for Stellar mainnet** — legacy communityId/amountXlm dev-only.
6. **Activation secret is client-side only** from order creation to membership activation.
7. **BRZA ≠ XLM** — never conflate the BRZA token with payment via XLM.
8. **Treasury withdrawals disabled** until governance CPI and release authority handoff tested.
9. **Update `app/src/lib/knowledgeGraph.ts`** when adding new chain rails, contract addresses, or settlement routes.
10. **Do not add Magic UI** or heavy animation libraries — removed deliberately.
11. **EVM contracts in contracts/evm/ are a Nouns/Builder fork** — do not reference Builder Protocol in docs or UI; rebrand to Baraza DAO or use Aragon OSx Manager.

---

## AI layer

### Asha — Community Brain
- **Endpoint**: `POST /api/agent/chat` (streaming SSE)
- **Model**: claude-sonnet-4-6
- **System prompt**: role (community brain), capabilities (draft/explain/flag/guide), proposal JSON schema, flag criteria (duplicate, overspend, personal benefit, unmeasurable criteria)
- **Context**: loads community name/chain/fee/quorum/proposals from Supabase when `communityId` is provided
- **Fallback**: static keyword responses when `ANTHROPIC_API_KEY` unset

### Dev swarm
- **Trigger**: every PR to main or dev
- **Agents**: SEO · Design · Security · Code (parallel, `claude-opus-4-7`)
- **Posts**: severity-ranked comment per agent (🔴 Critical / 🟠 Major / 🟡 Minor)
- **Requires**: `ANTHROPIC_API_KEY` in GitHub repo secrets

---

## Security rules (never relax)

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STELLAR_INTENT_SECRET`, `PAYMENT_ADAPTER_PROXY_SECRET`, `PAYMENT_PHONE_HASH_PEPPER`, `KOTANI_PAY_API_KEY`, or any private key in frontend code or logs.
- Use `crypto.timingSafeEqual` for all secret comparisons — never `===`.
- `payment_orders` SELECT returns `false` via RLS — reads go through `/api/payment-orders/status` with activation secret.
- Rate-limit `/api/stellar/create-payment-intent` (5/min per IP) and `/api/stellar/verify-payment` (10/min per IP) before production.

---

## Environment variables (summary)

### Server-side (never in VITE_ prefix)
```
ANTHROPIC_API_KEY          Asha community brain + dev swarm
SUPABASE_URL               Supabase project URL
SUPABASE_SERVICE_ROLE_KEY  Bypasses RLS — server only
STELLAR_NETWORK            testnet | mainnet
STELLAR_HORIZON_URL
STELLAR_TREASURY_ACCOUNT   Community treasury G-account
STELLAR_INTENT_SECRET      HMAC key for payment intent tokens
PAYMENT_ADAPTER_PROXY_SECRET  Bearer for /api/payments/*
PAYMENT_PHONE_HASH_PEPPER  HMAC pepper for phone hashing
KOTANI_PAY_API_KEY
KOTANI_WEBHOOK_SECRET
AT_USERNAME / AT_API_KEY   Africa's Talking
CRON_SECRET                Vercel cron auth
```

### Client-side (VITE_ prefix)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STELLAR_NETWORK
VITE_STELLAR_HORIZON_URL
VITE_STELLAR_TREASURY_ACCOUNT
VITE_BRZA_ISSUER_ADDRESS
VITE_BRZA_DISTRIBUTOR_ADDRESS
VITE_BASE_TESTNET          true for Base Sepolia
VITE_BASE_GOVERNOR_ADDRESS Per-community after deployDao()
VITE_BASE_TOKEN_ADDRESS    Per-community after deployDao()
```

---

## Pending blockers (in priority order)

1. Add `ANTHROPIC_API_KEY` to Vercel + GitHub secrets (unlocks Asha + swarm)
2. Add Supabase env vars to Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. Run Supabase migrations 001–010 (`supabase db push`)
4. Implement `persistOrder()` in `app/api/stellar/verify-payment.ts` (stub returns `persisted: false`)
5. Wire `CreateCommunity.tsx` to `POST /api/communities` → Supabase insert
6. Deploy Solana programs to devnet (`anchor deploy --provider.cluster devnet`)
7. Deploy Soroban contracts to Stellar testnet
8. Call `Manager.deployDao()` on Base Sepolia to get per-community contract addresses
9. Rate-limit payment API routes before public launch
10. Replace demo cron promoter with real BRZA mint + Stellar indexer confirmation

---

## Hard production blockers (do not go live without these)

1. Cron promoter is a demo step-counter — replace with real mint + indexer logic
2. Governance → treasury CPI dispatch must be complete and tested
3. Treasury release authority must be handed to multisig (Squads) on devnet first
4. `user_id_hash` in membership/activate.ts is a placeholder — replace with HMAC-peppered phone hash
5. Solana `payment_attestation::attest_payment` must be wired to Supabase payment orders
6. Run all Supabase migrations before any durable payment flow

---

## What NOT to do

- Do not add wallets beyond Phantom, Solflare, Coinbase Wallet
- Do not add Magic UI or framer-motion heavy animations
- Do not set `withdrawals_enabled = true` before multisig handoff
- Do not commit secrets, private keys, seed phrases, or service role keys
- Do not import files from another repo with logic changes — copy verbatim
- Do not relax intentToken requirement for Stellar mainnet
- Do not bypass the activation secret gate in membership/activate.ts
- Do not treat EVM as a launch blocker — Stellar launches first
- Do not reference Builder Protocol or Nouns in UI, docs, or code comments

---

*Last updated: 2026-06-08 · Repo: github.com/Azizudinly/baraza-protocol*
