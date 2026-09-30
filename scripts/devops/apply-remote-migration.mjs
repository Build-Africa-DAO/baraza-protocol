#!/usr/bin/env node
// scripts/devops/apply-remote-migration.mjs
// Standard: S&P 500 Enterprise Fintech / Automated Remote Migration Runner
// Applies migration 044 without touching the browser SQL Editor, then triggers the verification suite.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(__filename), '../..');

console.log('='.repeat(80));
console.log('   BARAZA PROTOCOL — INDUSTRY STANDARD REMOTE MIGRATION ENGINE');
console.log('   Standard: S&P 500 Enterprise Fintech / Headless & Audited Schema Apply');
console.log('='.repeat(80));

const migrationFile = resolve(ROOT_DIR, 'supabase/migrations/044_launch_pricing_and_pilot_exemptions.sql');
if (!existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}
const sql = readFileSync(migrationFile, 'utf8');

// Project reference from production config
const PROJECT_REF = 'jwoibelpyvemhzazccym';

async function executeViaPgClient(connectionString, label) {
  console.log(`\n▶ Connecting via PostgreSQL wire (${label})...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to remote Supabase PostgreSQL database.');
    console.log('⏳ Executing migration 044 inside transaction block...');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration 044 executed and committed successfully.');
    await client.end();
    return true;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors if connection was severed
    }
    await client.end().catch(() => {});
    throw err;
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.PGPASSWORD || process.argv[2];
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  let migrationSuccess = false;

  if (accessToken) {
    console.log(`\n▶ [METHOD A] Applying via Supabase Management API (Project: ${PROJECT_REF})...`);
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('❌ Supabase API Error:', data);
        process.exit(1);
      }
      console.log('✅ Migration executed successfully via Supabase Management API.');
      migrationSuccess = true;
    } catch (err) {
      console.error('❌ Failed to execute via Supabase Management API:', err.message);
      process.exit(1);
    }
  } else if (dbUrl) {
    console.log('\n▶ [METHOD B] Applying via direct connection string...');
    try {
      await executeViaPgClient(dbUrl, 'Custom DATABASE_URL');
      migrationSuccess = true;
    } catch (err) {
      console.error('❌ PostgreSQL connection error:', err.message);
      process.exit(1);
    }
  } else if (dbPassword) {
    console.log('\n▶ [METHOD C] Applying via Supabase DB Password...');
    const encodedPassword = encodeURIComponent(dbPassword.trim());
    
    // Candidate 1: Session mode pooler (IPv4 compatible)
    const poolerUrl = `postgres://postgres.${PROJECT_REF}:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
    // Candidate 2: Direct DB connection
    const directUrl = `postgres://postgres:${encodedPassword}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
    // Candidate 3: Transaction mode pooler
    const txPoolerUrl = `postgres://postgres.${PROJECT_REF}:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

    try {
      await executeViaPgClient(poolerUrl, 'Pooler Port 5432');
      migrationSuccess = true;
    } catch (err1) {
      console.warn(`⚠️ Pooler connection failed (${err1.message}). Trying direct DB host...`);
      try {
        await executeViaPgClient(directUrl, 'Direct Port 5432');
        migrationSuccess = true;
      } catch (err2) {
        console.warn(`⚠️ Direct DB connection failed (${err2.message}). Trying transaction pooler...`);
        try {
          await executeViaPgClient(txPoolerUrl, 'Pooler Port 6543');
          migrationSuccess = true;
        } catch (err3) {
          console.error('❌ All connection attempts failed:');
          console.error('  1. Pooler 5432:', err1.message);
          console.error('  2. Direct 5432:', err2.message);
          console.error('  3. Pooler 6543:', err3.message);
          process.exit(1);
        }
      }
    }
  } else {
    console.log(`
ℹ️  No remote credentials detected in environment variables.

To apply this migration via the industry-standard headless methods, run ONE of the following:

--------------------------------------------------------------------------------
OPTION 1: Pass the DB Password directly
--------------------------------------------------------------------------------
SUPABASE_DB_PASSWORD="[YOUR_PASSWORD]" npm run db:migrate:remote

or pass as an argument:
node scripts/devops/apply-remote-migration.mjs "[YOUR_PASSWORD]"

--------------------------------------------------------------------------------
OPTION 2: Full DATABASE_URL Connection String
--------------------------------------------------------------------------------
DATABASE_URL="postgres://postgres.${PROJECT_REF}:[YOUR_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \\
npm run db:migrate:remote

--------------------------------------------------------------------------------
OPTION 3: Headless Supabase Management API (Using Personal Access Token)
--------------------------------------------------------------------------------
SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxx" \\
npm run db:migrate:remote
--------------------------------------------------------------------------------
`);
    process.exit(0);
  }

  if (migrationSuccess) {
    // Automatically trigger the Post-Migration Verification Suite
    console.log('\n' + '='.repeat(80));
    console.log('   RUNNING AUTOMATED POST-MIGRATION VERIFICATION SUITE');
    console.log('='.repeat(80));
    try {
      execSync('node scripts/devops/verify-migration-044.mjs', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
    } catch {
      process.exit(1);
    }
  }
}

main();
