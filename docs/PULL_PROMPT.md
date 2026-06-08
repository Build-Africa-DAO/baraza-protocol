# Baraza — Information Pull Prompt (Claude Code)

> Paste this entire prompt into a new Claude Code session.
> Fill every `[PASTE ...]` block with real content before running.
> Do NOT run with empty paste blocks — you will get a no-op or hallucinated output.

---

## Before you start

You are working on the Baraza Protocol repo at `C:\Users\USER\Downloads\baraza-protocol`.

Read `CLAUDE.md` and `docs/CLAUDE_CONTEXT_PROMPT.md` first — they are your source of truth for architecture rules, chain priorities, and what not to change. Do not proceed until you have read both files in full.

Your job across all four sources:
1. Read each source carefully
2. Extract only what is new, missing, or contradicts the current repo docs
3. Update the specific files listed for each source
4. Never delete existing content — only add, correct, or reconcile
5. After all updates, run `npm run typecheck` from the `app/` directory and fix any errors

---

## SOURCE 1 — Notion (product spec / roadmap / tokenomics)

[PASTE NOTION PAGE CONTENT HERE]

**Extract and update:**
- New product features or phases → `app/docs/NEXT_STEPS.md` (add to correct Phase section)
- Tokenomics changes → `app/src/lib/brza/constants.ts` (only `BRZA_ALLOCATION`, `BRZA_VESTING`, `BRZA_PHASES`)
- Governance rules (quorum, thresholds, proposal types) → `app/docs/PRD.md`
- Community types or membership tiers → `app/src/lib/constants.ts` (`COMMUNITY_TYPES` array)
- Any new API routes described → `AGENTS.md` (API Routes table)

---

## SOURCE 2 — NotebookLM (research synthesis / architecture decisions)

[PASTE NOTEBOOKLM CHAT EXPORT OR KEY NOTES HERE]

**Extract and update:**
- Architecture decisions that differ from current impl → `AGENTS.md` (Architecture Rules section)
- New chain integrations or contract addresses → `app/src/lib/chains/config.ts` + `app/src/lib/knowledgeGraph.ts`
- Security findings → `AUDIT.md` (add a dated entry; create the file if it does not exist)
- Resolved open questions → `docs/OPEN_TASKS_RESEARCH_UPDATE.md`
- Any reference to Baraza TV mechanics → `app/src/lib/brza/constants.ts` (`BARAZA_TV` object)

---

## SOURCE 3 — GitHub reference repos

Two repos to pull logic from. Read them in order.

### 3A — PowerBridge-ai/BAD

Location: `C:\Users\USER\Downloads\BAD-reference\BAD_BUILD_2.0`

Read these two files in full:
- `BAD_DAO_GOVERNANCE_PROPOSAL.md`
- `BAD-DAO-Vesting-Governance-Delegation-Proposal.md`

**Extract and update:**
- Role-based voting weights, proposal lifecycle steps, AI agent governance patterns → `app/docs/PRD.md` (add/reconcile governance role definitions)
- Role-based context missing from the agent system prompt → `app/api/agent/chat.ts` (verify this path exists first; if the file lives elsewhere under `app/src/`, use the correct path and note the discrepancy)

**Hard constraints:**
- Do NOT copy BAD token parameters — only copy governance patterns (BAD ≠ BRZA)
- Do NOT add Builder Protocol, Nouns DAO, or noun.wtf references anywhere

### 3B — BuilderOSS

**Before attempting:** Check whether `C:\Users\USER\Downloads\BAD-reference\BuilderOSS` exists locally. If it does, read from disk. If it does not, skip this sub-source entirely and add a note to `docs/OPEN_TASKS_RESEARCH_UPDATE.md` that BuilderOSS was not available and needs a manual clone. Do NOT attempt a live GitHub fetch.

If available, extract:
- DAO tooling, SDK patterns, or contract interfaces relevant to Baraza → `docs/CONTRACT_INTEGRATION.md` (create if it does not exist)

**Hard constraints:**
- Do NOT add Builder Protocol branding or Nouns references

---

## SOURCE 4 — Current repo audit

Read each of the following files in full. Then read `docs/CONTRACT_INTEGRATION.md` as well — it is a target file for Source 3 so gaps there should be caught here too.

```
AGENTS.md
AUDIT.md  (if it exists)
docs/CONTRACT_INTEGRATION.md  (if it exists)
app/docs/NEXT_STEPS.md
app/src/lib/brza/constants.ts
app/src/lib/chains/config.ts
app/src/lib/evm/manager.ts
app/src/lib/evm/base-governance.ts
app/src/lib/programs/pda.ts
supabase/migrations/  (list all files, read the two most recent in full)
```

For each gap found, do exactly one of:
- **Fix directly** if it is a clear error (wrong address, broken type, stale comment)
- **Add a `// TODO:` comment** if it needs external input (deployed contract address, API key, etc.)
- **Add to `docs/OPEN_TASKS_RESEARCH_UPDATE.md`** if it is a product decision that requires human input

---

## After all sources are processed

Run these checks in order. Do not skip any step even if the previous one passes.

```bash
cd app
npm run typecheck   # fix all errors before continuing
npm run lint        # fix all errors before continuing
npm run test        # all existing tests must still pass
cd ..
git status          # show what changed
```

Then:
- Stage only the files you intentionally modified
- Write a commit message that lists each source and what was extracted from it
- **Do NOT commit** — show me the staged diff and ask for approval first

---

## Hard constraints (apply to all sources)

- Do not delete existing architecture rules or security constraints from any file
- Do not change `STELLAR_INTENT_SECRET` logic or the `intentToken` requirement
- Do not add new npm packages without asking first
- Do not add Builder Protocol, Nouns DAO, or noun.wtf references anywhere
- Do not change the wallet adapter list (Phantom, Solflare, Coinbase only)
- Do not change BRZA total supply (1,000,000,000)
- Do not set `withdrawals_enabled = true`
- Do not run a live GitHub fetch for BuilderOSS — use local clone only or skip and log
