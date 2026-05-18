# Deploy checklist

How to take the Vercel deploy from "ships static SPA in localStorage mode" to
"end-to-end with Supabase + cron + persistence."

## 1. Supabase project

```
1. Create a project at https://supabase.com
2. Copy from Project Settings → API:
   - Project URL          (used for both SUPABASE_URL and VITE_SUPABASE_URL)
   - anon public key      (VITE_SUPABASE_ANON_KEY)
   - service_role secret  (SUPABASE_SERVICE_ROLE_KEY — server-only, never VITE_*)
```

## 2. Apply migrations (in order)

```
supabase/migrations/001_communities_governance_columns.sql
supabase/migrations/002_payment_orders.sql
supabase/migrations/003_payment_attestations.sql
supabase/migrations/004_memberships.sql
```

Easiest path: Supabase dashboard → SQL Editor → paste each migration in order
and run. Or with CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## 3. Vercel env vars

Vercel dashboard → Settings → Environment Variables → add for **Production +
Preview + Development**:

| Variable | Scope | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Build-time | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Build-time | anon public key |
| `SUPABASE_URL` | Runtime | Same as above (server-side reads can't use VITE_*) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime, secret | service_role key |
| `CRON_SECRET` | Runtime, secret | Any random string (`openssl rand -hex 32`) |
| `VITE_SOLANA_NETWORK` | Build-time | `devnet` (or `mainnet`) |
| `VITE_RPC_ENDPOINT` | Build-time, optional | Helius/QuickNode URL if you want a private RPC |
| `VITE_ADMIN_WALLETS` | Build-time, optional | Comma-separated pubkeys allowed to view `/admin` |

After adding, redeploy (or just push another commit) for env vars to apply.

## 4. Smoke test

After redeploy completes:

```
1. Open the production URL
2. Browse /communities — see the four seed DAOs
3. Create one — should persist to communities table (no longer localStorage)
4. /join/<id> — enter 712 345 678 → Request M-Pesa Prompt
5. Check Supabase → payment_orders → new row, status = PAYMENT_CONFIRMED
6. Wait 1 min for cron tick → status advances to MINT_QUEUED
7. After ~5 min cron ticks → RECONCILED → memberships table has a row
8. /dashboard/<id> Wallet tab — your real SOL balance from VITE_SOLANA_NETWORK
9. /profile — joined community shows up as a row
```

## 5. Verify cron is running

Vercel dashboard → Functions → Crons. The schedule from `vercel.json`:

```
* * * * *    /api/cron/promote-orders
```

Cron runs only on the **Pro plan**. On Hobby plan the schedule is registered
but not executed — promote orders manually with:

```bash
curl -X GET https://<your-domain>/api/cron/promote-orders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 6. Known limitations (not blockers for deploy)

- **No real Solana mint.** The cron simulates `MINT_QUEUED → ... → RECONCILED`
  without touching the chain. Wire `programs/` to the cron later.
- **No real M-Pesa.** `/api/mpesa/simulate` immediately marks orders
  `PAYMENT_CONFIRMED`. Replace with Africa's Talking webhook receiver in
  production.
- **No phone auth.** `memberships.user_id_hash` uses `wallet:<address>` as a
  placeholder until phone-first signup is wired (per `MVP_ARCHITECTURE.md §4`).
- **Stellar disabled.** UI surfaces it as Phase 2; no code path attempts a
  Stellar tx.

## Rollback

Vercel keeps every deployment. If something breaks:

```
Vercel dashboard → Deployments → previous green deploy → Promote to Production
```

Or revert the offending commit and push.
