## What this PR does

<!-- One sentence summary -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Docs / config

## Chain(s) affected

- [ ] Stellar
- [ ] Solana
- [ ] EVM/Base
- [ ] None (UI/infra only)

## Checklist

- [ ] No chain names in UI (except onboarding/withdrawal screens)
- [ ] All chain calls go through `/lib/adapters/index.ts`
- [ ] No secrets committed
- [ ] `withdrawals_enabled` is still `false`
- [ ] `.env.example` updated if new env vars added
- [ ] Migrations added to `supabase/migrations/` if schema changed
