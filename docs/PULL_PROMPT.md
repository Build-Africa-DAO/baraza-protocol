# Baraza — Information Pull Prompt

> Run this prompt in a new Claude Code session to pull scattered knowledge
> from Notion, NotebookLM, GitHub, and BAD reference into the repo.
> Replace every `[PASTE ...]` block with the actual content before running.

---

## Prompt (copy everything below this line)

---

You are working on the Baraza Protocol repo at `C:\Users\USER\Downloads\baraza-protocol`.

Read `CLAUDE.md` and `docs/CLAUDE_CONTEXT_PROMPT.md` first — they are your source of truth for architecture rules, chain priorities, and what not to change.

I am going to paste content from four external sources. Your job is to:
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
- Tokenomics changes → `app/src/lib/brza/constants.ts` (only BRZA_ALLOCATION, BRZA_VESTING, BRZA_PHASES)
- Governance rules (quorum, thresholds, proposal types) → `app/docs/PRD.md`
- Community types or membership tiers → `app/src/lib/constants.ts` (COMMUNITY_TYPES array)
- Any new API routes described → `AGENTS.md` (API Routes table)

---

## SOURCE 2 — NotebookLM (research synthesis / architecture decisions)

[PASTE NOTEBOOKLM CHAT EXPORT OR KEY NOTES HERE]

**Extract and update:**
- Architecture decisions that differ from current impl → `AGENTS.md` (Architecture Rules section)
- New chain integrations or contract addresses → `app/src/lib/chains/config.ts` + `app/src/lib/knowledgeGraph.ts`
- Security findings → `AUDIT.md` (add dated entry)
- Resolved open questions → `docs/OPEN_TASKS_RESEARCH_UPDATE.md`
- Any reference to Baraza TV mechanics → `app/src/lib/brza/constants.ts` (BARAZA_TV object)

---

## SOURCE 3 — GitHub reference repos

Repos to pull logic from (already cloned at `C:\Users\USER\Downloads\BAD-reference`):

**PowerBridge-ai/BAD** (`C:\Users\USER\Downloads\BAD-reference\BAD_BUILD_2.0`):
- Read `BAD_DAO_GOVERNANCE_PROPOSAL.md` and `BAD-DAO-Vesting-Governance-Delegation-Proposal.md`
- Extract: role-based voting weights, proposal lifecycle steps, AI agent governance patterns
- Update: `app/docs/PRD.md` — add/reconcile governance role definitions
- Update: `app/api/agent/chat.ts` system prompt — add role-based context if missing
- Do NOT copy BAD token parameters (BAD ≠ BRZA) — only copy governance patterns

**BuilderOSS** (fetch from https://github.com/BuilderOSS if accessible):
- Extract: any DAO tooling, SDK patterns, or contract interfaces relevant to Baraza
- Update: `docs/CONTRACT_INTEGRATION.md` with any useful patterns
- Do NOT add any Builder Protocol branding or Nouns references

---

## SOURCE 4 — Current repo audit

Read these files in full and identify gaps:

```
AGENTS.md
app/docs/NEXT_STEPS.md
app/src/lib/brza/constants.ts
app/src/lib/chains/config.ts
app/src/lib/evm/manager.ts
app/src/lib/evm/base-governance.ts
app/src/lib/programs/pda.ts
supabase/migrations/ (list all files)
```

For each gap found, do one of:
- Fix it directly if it is a clear error (wrong address, broken type, stale comment)
- Add a `// TODO:` comment if it needs external input (deployed contract address, API key)
- Add to `docs/OPEN_TASKS_RESEARCH_UPDATE.md` if it is a product decision

---

## After all sources are processed

1. Run `npm run typecheck` from `app/` — fix all errors
2. Run `npm run lint` from `app/` — fix all errors  
3. Run `npm run test` from `app/` — all 231 tests must still pass
4. Run `git status` and show me what changed
5. Stage only the files you intentionally modified
6. Write a commit message that lists each source and what was extracted
7. Do NOT commit — show me the staged diff and ask for approval first

---

## What NOT to do

- Do not delete existing architecture rules or security constraints
- Do not change `STELLAR_INTENT_SECRET` logic or the `intentToken` requirement
- Do not add new npm packages without asking
- Do not add Builder Protocol, Nouns DAO, or noun.wtf references anywhere
- Do not change wallet adapter list (Phantom, Solflare, Coinbase only)
- Do not change BRZA total supply (1,000,000,000)
- Do not set `withdrawals_enabled = true`
