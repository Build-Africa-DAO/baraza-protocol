# Production Database Deployment & Migration Runbook

**Document Identifier:** BRZ-DOC-2026-DB-RUNBOOK-001  
**Classification:** S&P 500 Enterprise Fintech / Production Database Runbook  
**Target Persistence Engine:** Supabase Managed PostgreSQL 16 (PgBouncer Pooling)  
**Governing Documents:** HGD Rev 2, SAD v1.1, Launch Direction Memo 3, NIST SP 800-53 Rev 5, SASRA Cap 490B, ODPC Kenya §40  
**Lead Auditor & Systems Architect:** Simon Wandera  
**Date:** September 2026  

---

## 1. Executive Summary & Database Topology

The Baraza Protocol persistence layer is deployed on **Supabase Managed PostgreSQL 16**, operating behind **PgBouncer** connection pooling in transaction mode (Port 6543) and direct session mode (Port 5432). 

This runbook establishes the formal, deterministic deployment instructions for applying, verifying, and quarantining database migrations across production and staging environments.

```mermaid
flowchart TD
    subgraph MigrationPipeline ["Production Migration & Hardening Pipeline"]
        M1["1. Pre-Flight Backup & Connection Check<br/>(pg_dump / Supabase Snapshot)"]
        M2["2. Sequential DDL Execution<br/>(Migrations 000 through 043)"]
        M3["3. Critical Security Delta Application<br/>(Migrations 035 - 043)"]
        M4["4. Role Quarantine & RLS Enforcement<br/>(REVOKE ALL FROM anon, authenticated)"]
        M5["5. PostgREST Cache Invalidation<br/>(NOTIFY pgrst, 'reload schema')"]
        M6["6. Post-Flight Health Verification<br/>(Automated Integrity Queries)"]
    end

    M1 --> M2 --> M3 --> M4 --> M5 --> M6
```

---

## 2. Complete Migration Inventory & Critical Delta

The repository contains **42 sequential SQL migration files** in [`supabase/migrations/`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations).

### 2.1 Critical Security & Invariant Delta (Migrations 035 – 043)

If the deployed database was initialized prior to recent architectural hardening, the following migrations **MUST** be verified and applied:

| Migration File | Primary Functional & Security Scope | Governing Invariant | Breaking Risk |
| :--- | :--- | :--- | :---: |
| [`035_cr007_payment_exceptions_dlq.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/035_cr007_payment_exceptions_dlq.sql) | Creates Dead-Letter Queue table `public.payment_exceptions`. Implements `resolve_payment_exception_atomic()` stored procedure with **Dijkstra Monotonic Lock Hierarchy** (`payment_exceptions` L4 $\rightarrow$ `payment_orders` L3). | Invariant $I8$ (DLQ Poison-Pill Isolation) | **Zero** |
| [`036_cr007_artizen_campaigns_reconciliation.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/036_cr007_artizen_campaigns_reconciliation.sql) | Creates `artizen_campaigns`, `artizen_settlement_ledger`, and `artizen_splits` for atomic grant revenue sharing. | Invariant $I5$ (Zero Balance Drift) | **Zero** |
| [`037_custom_auth_and_otp_sessions.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/037_custom_auth_and_otp_sessions.sql) | Provisions `auth_otp_challenges` (with `attempts_remaining`, `consumed_at`, and per-challenge salts) and `auth_sessions` (with `session_token_hash`). | NIST SP 800-63B Monotonic Rate Limiting | **Zero** |
| [`038_enable_rls_cr007_and_auth_tables.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/038_enable_rls_cr007_and_auth_tables.sql) | Enables RLS across all new tables and revokes anon/authenticated write access. | Defense-in-Depth / Least Privilege | **Zero** |
| [`039_user_profiles_identity_expansion_and_payout_statuses.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/039_user_profiles_identity_expansion_and_payout_statuses.sql) | **CRITICAL:** Adds composite unique constraint `uq_votes_proposal_member UNIQUE(proposal_id, member_id)` to permanently eliminate TOCTOU voting concurrency races. Creates partial index `idx_payment_orders_status_created`. | Invariant `I-GOV-VOTE-1` (Single-Vote Consensus) | **Zero** |
| [`040_reconcile_schema_fractures.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/040_reconcile_schema_fractures.sql) | Reconciles column discrepancies across `communities`, `members`, and `treasuries`. | Schema Symmetry | **Zero** |
| [`041_auth_salt_and_bot_sessions.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/041_auth_salt_and_bot_sessions.sql) | Adds cryptographic salt and pepper support to OTP verification. | NIST SP 800-63B Authentication Security | **Zero** |
| [`042_system_config_and_circuit_breaker.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/042_system_config_and_circuit_breaker.sql) | Seeds `public.system_config` table and initializes global `circuit_breaker` state (`false`) for fail-closed solvency halts. | Invariant `I-REC-1` (Circuit Breaker Tripping) | **Zero** |
| [`043_community_image_url.sql`](file:///home/nothim/HIM/baraza-work/baraza-protocol/supabase/migrations/043_community_image_url.sql) | Adds `image_url` column to `communities` for decentralized brand assets. | UI / UX Asset Consistency | **Zero** |

---

## 3. Step-by-Step Production Deployment Runbook

### Step 1: Pre-Flight Snapshot & Connection Check
Before executing any DDL on production Supabase:
1. Navigate to **Supabase Dashboard $\rightarrow$ Settings $\rightarrow$ Database $\rightarrow$ Backups** and trigger a manual point-in-time snapshot.
2. Confirm database connection strings:
   * Direct Session URI (Port 5432): `postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
   * Transaction Pooler URI (Port 6543): `postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### Step 2: Sequential Migration Application
Execute the transactional migration harness or apply via Supabase CLI:

#### Option A: Automated Harness (Recommended)
```bash
cd /home/nothim/HIM/baraza-work/baraza-protocol
# 1. Validate all 42 migrations locally with zero syntax errors
node scripts/devops/migrate-database.mjs --dry-run

# 2. Execute sequentially against the target remote PostgreSQL database
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
node scripts/devops/migrate-database.mjs
```

#### Option B: Supabase CLI
```bash
supabase db push --linked
```

#### Option C: Consolidated Schema Direct Apply (For New Provisioning)
If setting up a fresh staging or disaster-recovery database, apply the audited consolidated schema:
```bash
psql "postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -f supabase/consolidated_schema.sql
```

### Step 3: Mandatory Permission Quarantine Execution
To guarantee that public and authenticated client tokens cannot tamper with financial ledgers, Dead-Letter Queues, or OTP verification tables, execute the following SQL script directly in the Supabase SQL Editor:

```sql
-- -----------------------------------------------------------------------------
-- S&P 500 Enterprise Security: Mandatory Table Quarantine & RLS Enforcement
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.steward_mutations, 
              public.payment_exceptions, 
              public.artizen_settlement_ledger, 
              public.auth_otp_challenges, 
              public.auth_sessions, 
              public.notification_outbox 
FROM anon, authenticated;

-- Ensure service_role retains full administrative execution privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

### Step 4: PostgREST Schema Cache Reload
Supabase caches table definitions, constraints, and stored procedures in memory via PostgREST. To reload the cache immediately without restarting the database:

```sql
NOTIFY pgrst, 'reload schema';
```

---

## 4. Post-Deployment Verification Queries

Run the following SQL queries in the Supabase SQL Editor to certify that the deployed database is 100% compliant with S&P 500 standards:

### Query 1: Verify Anti-Double Voting Unique Constraint
```sql
SELECT conname, contype, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'votes' AND c.conname = 'uq_votes_proposal_member';
```
* **Expected Output:**
  ```
  conname                  | contype | pg_get_constraintdef
  -------------------------+---------+----------------------------------------------
  uq_votes_proposal_member | u       | UNIQUE (proposal_id, member_id)
  ```

### Query 2: Verify Dead-Letter Queue (DLQ) Table & Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'payment_exceptions';
```
* **Expected Output:** Indexes present on `(order_id, provider)`, `(status, created_at DESC)`, and `(order_id)`.

### Query 3: Verify Dijkstra Atomic Exception Resolution Procedure
```sql
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'resolve_payment_exception_atomic';
```
* **Expected Output:** `resolve_payment_exception_atomic | FUNCTION | DEFINER`.

### Query 4: Verify Global Circuit Breaker Initial State
```sql
SELECT key, value, description 
FROM public.system_config 
WHERE key = 'circuit_breaker';
```
* **Expected Output:** `circuit_breaker | false | Global emergency circuit breaker`.

### Query 5: Verify RLS is Enabled on All Financial & Security Tables
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('votes', 'payment_orders', 'journal_entries', 'payment_exceptions', 'auth_otp_challenges', 'auth_sessions');
```
* **Expected Output:** `rowsecurity = true` for all rows.

---

## 5. Emergency Rollback Runbook

If any migration step fails or introduces unforeseen application regressions:
1. **Immediate Circuit Breaker Activation:**
   Trip the fail-closed circuit breaker to halt all disbursements:
   ```sql
   UPDATE public.system_config SET value = 'true' WHERE key = 'circuit_breaker';
   NOTIFY pgrst, 'reload schema';
   ```
2. **Point-In-Time Restore:**
   Use the Supabase manual snapshot taken in Step 1 to restore database state within $< 10$ minutes.
3. **Targeted DDL Rollback:**
   Each migration script contains an inverse drop statement (e.g. `ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_votes_proposal_member;`). Execute only under lead architect supervision.
