# BRZA Tokenomics Consistency Audit Report

**Date:** 2026-06-14
**Source of Truth:** `app/src/lib/brza/constants.ts`

## Summary
- **Total files audited:** 20 (Note: `docs/akili-council/HISTORICAL_FOUNDATIONS.md` was not found in the repository).
- **Files with discrepancies:** 4
- **Verified clean files:** 16

## Per-file findings

### `docs/CLAUDE_CONTEXT_PROMPT.md`
- **Line 56**: Claim: "Operations | ... | 0 cliff | 36 months (milestone-gated)". Contradicting `constants.ts`: `cliffDays: 365`.
  - *Note:* Stale snapshot (Operations cliff added 2026-06-08 per constants.ts comments).
- **Line 58**: Claim: "Reserve | ... | 12 months cliff | 36 months". Contradicting `constants.ts`: `cliffDays: 730` (24 months).
  - *Note:* Stale snapshot.
- **Line 57 & Vesting Table**: Claim: "Public Sale | ... | 0 cliff | 0 vest". Contradicting `constants.ts`: `cliffDays: 180`, `vestingDays: 365`.
  - *Note:* Stale snapshot (Public sale vesting added 2026-06-08).

### `app/docs/DESIGN_SPEC.md`
- **Line 115**: Claim: "Total Supply: 10,000,000 tokens". Contradicting `constants.ts`: `1,000,000,000`.
  - *Note:* Typo/Placeholder (likely from a generic template).

### `docs/OPEN_TASKS_RESEARCH_UPDATE.md`
- **Line 33**: Claim: "Notion product spec allocation table sums to 1,100,000,000 (110% of supply)". Contradicting `constants.ts`: `1,000,000,000`.
  - *Note:* Aligns with stale Notion spec, contradicts authoritative constants.ts.

### `contracts/evm/docs/mainnet-v2-upgrade-runbook.md`
- **Line 78**: Claim: `barazaRewardsBPS = 250` (2.5%). Contradicting `constants.ts`: `treasuryTxPct: 0.02` (2%).
  - *Note:* Intentional design alternative (EVM-specific auction reward split).

## Verified clean
- `CLAUDE.md`
- `AGENTS.md`
- `AUDIT.md`
- `TODOS.md`
- `docs/KNOWLEDGE_GRAPH.md`
- `docs/MULTI_REPO_STRATEGY.md`
- `docs/TESTNET_CONTRACT_API_REVIEW.md`
- `docs/akili-council/COUNCIL_OVERVIEW.md`
- `docs/akili-council/KOFI.md`
- `docs/akili-council/ZARA.md`
- `docs/akili-council/SEKU.md`
- `app/docs/DESIGN.md`
- `app/docs/PRD.md`
- `app/docs/BRAND_GUIDELINES.md`
- `app/docs/MVP_ARCHITECTURE.md`
- `app/docs/DAO_LOGIC_REFERENCE.md`

## Recommended fixes (priority-ordered)
1. **Urgent**: Synchronize `docs/CLAUDE_CONTEXT_PROMPT.md` with `constants.ts`. As this file provides context for AI sessions, stale vesting/cliff data can lead to hallucinated or incorrect implementation advice.
2. **High**: Update `app/docs/DESIGN_SPEC.md` to reflect the 1B total supply. Having "10,000,000" in the spec creates confusion for developers and designers regarding scale and percentages.
3. **Medium**: Reconcile the Notion discrepancy mentioned in `docs/OPEN_TASKS_RESEARCH_UPDATE.md` and `constants.ts` to ensure the product spec matches the code's 1B limit.
4. **Low**: Clarify in `contracts/evm/docs/mainnet-v2-upgrade-runbook.md` whether the 2.5% reward split is an intentional deviation from the 2% protocol fee defined in the core constants.
