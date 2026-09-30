#!/usr/bin/env node
// scripts/devops/apply-remote-migration.mjs
// Standard: S&P 500 Enterprise Fintech / Automated Remote Migration Runner
// Applies migration 044 without touching the browser SQL Editor, then triggers the verification suite.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

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
    } catch (err) {
      console.error('❌ Failed to execute via Supabase Management API:', err.message);
      process.exit(1);
    }
  } else if (dbUrl) {
    console.log('\n▶ [METHOD B] Applying via Supabase CLI (Canonical Schema Push)...');
    try {
      execSync(`npx -y supabase db push --db-url "${dbUrl}"`, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
      console.log('\n✅ Supabase db push completed.');
    } catch (err) {
      console.error('\n❌ Supabase db push execution error:', err.message);
      process.exit(1);
    }
  } else {
    console.log(`
ℹ️  No remote credentials detected in environment variables.

To apply this migration via the industry-standard headless methods, run ONE of the following:

--------------------------------------------------------------------------------
OPTION 1: Canonical Supabase CLI (Using DB Connection String)
--------------------------------------------------------------------------------
DATABASE_URL="postgres://postgres.${PROJECT_REF}:[YOUR_DB_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \\
node scripts/devops/apply-remote-migration.mjs

Or directly via Supabase CLI:
npx supabase db push --db-url "postgres://postgres.${PROJECT_REF}:[YOUR_DB_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

--------------------------------------------------------------------------------
OPTION 2: Headless Supabase Management API (Using Personal Access Token)
--------------------------------------------------------------------------------
SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxx" \\
node scripts/devops/apply-remote-migration.mjs

--------------------------------------------------------------------------------
OPTION 3: Supabase CLI Project Link
--------------------------------------------------------------------------------
npx supabase link --project-ref ${PROJECT_REF}
npx supabase db push
--------------------------------------------------------------------------------
`);
    process.exit(0);
  }

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

main();
