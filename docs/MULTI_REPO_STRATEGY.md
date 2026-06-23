# Multi-repo strategy

When to split parts of `baraza-protocol` into separate GitHub repos — and when not to.

## TL;DR

Don't split anything yet. The protocol is one product pre-launch; the operational cost of two repos exceeds the strategic benefit until at least one of the signals below fires. The ecosystem repos (`Baraza TV`, `IDO/Public Launch`, `DEX`) are new products and should ship in their own repos from day one — that's a different question from splitting this one.

When the signals do start firing, the order to split is:
1. **Solana programs** at mainnet (audit + upgrade-authority boundary)
2. **BRZA token + Soroban contracts** at treasury go-live (deploy-key boundary)
3. **Akili Council** if it becomes a product for partner DAOs (external-consumer boundary)
4. Everything else stays in `baraza-protocol`.

---

## Framework

A split is worth doing when **at least three** of these criteria are true. Fewer than three and the monorepo wins on operational cost.

| Criterion | What it means in practice |
|---|---|
| **Independent release cadence** | One piece ships weekly, the other quarterly. Same-PR-ships-both is forcing churn. |
| **Clean API contract** | The boundary between pieces is small, versioned, and stable. Not 40 hooks calling 200 helpers. |
| **Identity boundary holds** | Auth, secrets, deploy keys, and access control can be different. Same secret = no real boundary. |
| **External consumer** | Someone outside Baraza wants to use it. Could be open-source, partner DAO, B2B sale. |
| **Different team / ownership** | Someone other than you is the primary committer. Or you want a contractor to work on one without touching the other. |
| **Compliance / audit boundary** | One piece needs SOC2 / Stellar audit / KYC reviewer scope; the other doesn't. |
| **Different tech stack pull** | Akili wants Python for evals. Soroban wants Rust. Forcing one toolchain pinches both. |

1-2 criteria: stay in monorepo, use internal folder boundaries. 3+: split. 5+: you should have split last quarter.

---

## Per-candidate analysis

### 1. Akili — chat brain + Council

**What exists today**

- `app/api/agent/chat.ts` — Claude streaming chat brain
- `app/src/components/chat/AkiliChat.tsx` — AkiliChat drawer UI (Akili community brain)
- `app/src/components/chat/AskAkili.tsx` — inline trigger component
- `app/src/lib/akili/` — Akili Council: 5 one-shot specialists (Amara, Kofi, Zara, Nia, Seku) with prompts + dispatcher

**Today's score: 0/7.** Single committer, no external consumer, no compliance scope, ~1000 LOC.

**Would need to be true to split:**

- [ ] **External consumer** — Akili Council is sold or open-sourced as a product for other African DAO tools (Convene, Aragon Africa, Sango on Celo). The Council is the more product-shaped piece — 5 named specialists with structured prompts read more like a SaaS API than the embedded chat drawer does.
- [ ] **Clean API contract** — `/api/agent/chat` or `invokeCouncilAgent(name, message)` is hit by other Baraza-ecosystem apps (Baraza TV, the DEX) and they break when you change a prompt.
- [ ] **Different team** — a contributor wants to work on prompts/evals without touching governance migrations.
- [ ] **Different tech stack** — eval pipeline grows (RAG over chama knowledge base, custom fine-tuned model, Swahili translation evals) and pulls in Python/Modal/Inngest tooling.

**Realistic timeline:** 6-12 months if Baraza gains traction. The Council is the strongest split candidate of the AI layer because it has a discrete API surface that other products could consume.

### 2. BRZA — token + governance

**What exists today**

- `app/src/lib/brza/constants.ts` — supply, allocation, vesting, emission
- Migrations 010-016 — proposals, votes, tally integrity, double-vote chain guard, weight CHECK
- Aragon OSx integration files for Base
- Stellar custom asset definition (BRZA on Stellar)

**Today's score: 1/7.** Migrations have audit/compliance scope the rest of the repo doesn't.

**Would need to be true to split:**

- [ ] **Compliance boundary** — external smart contract audit needs a specific commit range as scope. (You'd typically freeze a branch for this rather than repo-splitting; weak signal alone.)
- [ ] **Identity boundary** — treasury-handling code (vault PDA, Soroban contracts) needs deploy keys the frontend repo never touches.
- [ ] **External consumer** — other communities want to fork the BRZA tokenomics model without forking the whole app. Today the tokenomics are in one constants file; if it became a published spec or template, that's a signal.
- [ ] **Different tech stack** — Stellar Soroban + Solana Anchor programs grow to the point where Rust toolchain dominates the repo.

**Realistic timeline:** before mainnet launch. Once treasury keys are real money, the deploy boundary matters and you want the smart contract code out of reach of frontend PRs.

### 3. Stellar payment rail

**What exists today**

- `app/api/stellar/verify-payment.ts` — HMAC intent token, Horizon proof, Supabase persistence
- Intent-token signing + payer identity HMAC
- M-Pesa → Kotani Pay → XLM flow scaffold

**Today's score: 2/7.** Has its own secrets (`STELLAR_INTENT_SECRET`, `STELLAR_TREASURY_ACCOUNT`, `PAYMENT_PHONE_HASH_PEPPER`); could serve as a generic settlement product.

**Would need to be true to split:**

- [ ] **External consumer** — Kotani Pay / IntaSend / similar Kenyan PSPs want the M-Pesa→XLM bridge as a hosted service.
- [ ] **Identity boundary** — the intent-token signing key rotates separately from the Supabase service-role key.
- [ ] **Different team** — settlement pipeline operator who doesn't need to touch governance.

**Realistic timeline:** post-mainnet. Pre-launch the rail is too entangled with membership activation to split cleanly.

### 4. USSD handler

**What exists today**

- `app/api/ussd/index.ts` — Africa's Talking session handler
- `app/src/lib/ussd/menu.ts` — menu tree, BRZA balance prefetch

**Today's score: 1/7.** Has its own session model and gateway integration.

**Would need to be true to split:**

- [ ] **External consumer** — Africa's Talking / similar gateway integrations grow beyond Kenya (Tanzania → Vodacom, Nigeria → MTN) and each gateway adds its own session quirks. Per-gateway plugin model could justify a split.

**Realistic timeline:** unlikely. USSD is tightly tied to membership identity (phone hash, dues collection). Probably permanent in `baraza-protocol`.

### 5. Solana programs

**What exists today**

- 5 Anchor programs in `programs/` (community-registry, governance, membership, payment-attestation, treasury-vault)
- Written, not yet deployed to devnet

**Today's score: 2/7.** Different tech stack (Rust), different deploy target.

**Would need to be true to split:**

- [ ] **Clean API contract** — programs deployed and frozen on mainnet. IDL becomes the contract.
- [ ] **Identity boundary** — program upgrade authority moves to multisig / governance.
- [ ] **Compliance boundary** — audit firm wants a separate scope.

**Realistic timeline:** at mainnet launch. Most Solana protocols split programs out the day they're audited. The IDL becomes a published artifact (npm or crates.io) the frontend consumes.

### 6. Knowledge graph

**What exists today**

- `app/src/lib/knowledgeGraph.ts` — graph data + Supabase reads
- Visualization component

**Today's score: 0/7.** Single contributor, internal-only.

**Would need to be true to split:**

- [ ] **External consumer** — open-sourcing it as a "Community Graph" library other DAO tools use. Only realistic if you write a blog post that gets traction.

**Realistic timeline:** never, unless it becomes a side project.

---

## Cheaper intermediate step — internal folder boundaries

Before any actual split, do this inside `baraza-protocol`:

```
app/src/
  akili/          ← chat + council code lives here, no exceptions
  brza/           ← token model, vote logic, tokenomics
  components/     ← UI shell (Header, Footer, Layout, …)
  hooks/          ← cross-cutting hooks
  lib/            ← shared utilities
  pages/          ← routes
```

Once `import x from '@/akili/...'` is the only way the rest of the app touches Akili, the *actual* repo split becomes `git mv app/src/akili ./` in a new repo. Until then, internal boundaries are 95% of the value at 5% of the cost.

The Akili Council is already in `app/src/lib/akili/` — that's the right shape. The chat drawer (`AkiliChat.tsx`, `AskAkili.tsx`, `useAkiliChat.ts`, `AkiliChatContext`) is the piece that should move into the same folder, so the entire AI layer has one boundary.

---

## What about the ecosystem repos?

`scripts/create-repos.sh` scaffolds four ecosystem repos: Baraza Protocol, Baraza TV, IDO/Public Launch, DEX. These are *new products*, not splits of this one. They should live in their own repos from day one because they have different audiences, different release cycles, and different revenue models. The right question for each ecosystem repo is "what does it consume from `baraza-protocol`?" — that's the API contract that drives whether the *protocol* eventually splits.

---

## Decision log

When you actually do a split, record it here.

| Date | Split | Reason | Criteria met |
|---|---|---|---|
| _(none yet)_ | — | — | — |

---

_Last updated: 2026-06-15_
