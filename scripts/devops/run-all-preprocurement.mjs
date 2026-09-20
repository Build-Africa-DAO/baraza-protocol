#!/usr/bin/env node
// scripts/devops/run-all-preprocurement.mjs
// Standard: S&P 500 Enterprise Fintech / Master Pre-Procurement Orchestrator
// Executes all Phase P0 automated pre-procurement infrastructure & verification gates.

import { execSync } from 'node:child_process';

const TASKS = [
  { name: '1. Cloudflare Edge Router 100% Route Coverage Audit', cmd: 'node scripts/devops/verify-edge-router.mjs' },
  { name: '2. 15-Provider Environment & Secrets Matrix Validator', cmd: 'node scripts/devops/validate-env-matrix.mjs' },
  { name: '3. Transactional Database Migration DDL Dry-Run', cmd: 'node scripts/devops/migrate-database.mjs --dry-run' },
  { name: '4. Cloudflare WAF & Edge DDoS Rule Compilation', cmd: 'node scripts/devops/configure-cloudflare-waf.mjs' },
  { name: '5. Multi-Chain RPC Node Health & Latency Probe', cmd: 'node scripts/devops/verify-blockchain-nodes.mjs' },
  { name: '6. Production Readiness Pre-Flight Tripwires', cmd: 'node scripts/validate-production-readiness.mjs' },
  { name: '7. Synthetic Health & Security Edge Smoke Test', cmd: 'node scripts/devops/smoke-test.mjs' },
];

console.log('='.repeat(80));
console.log('   BARAZA PROTOCOL — MASTER PRE-PROCUREMENT DEVOPS HARNESS');
console.log('   Classification: S&P 500 Enterprise Infrastructure Readiness Gate');
console.log('='.repeat(80));

let success = true;

for (const task of TASKS) {
  console.log(`\n>>> Executing ${task.name}...`);
  try {
    execSync(task.cmd, { stdio: 'inherit' });
    console.log(`✅ Passed: ${task.name}`);
  } catch (err) {
    console.error(`❌ Failed: ${task.name}`);
    success = false;
    break;
  }
}

console.log('\n' + '='.repeat(80));
if (success) {
  console.log('   ALL PRE-PROCUREMENT DEVOPS AUDITS & AUTOMATIONS SUCCESSFULLY PASSED');
  console.log('   STATUS: INFRASTRUCTURE IS 100% CERTIFIED FOR EXECUTING SUBSCRIPTIONS');
  console.log('='.repeat(80) + '\n');
  process.exit(0);
} else {
  console.error('   PRE-PROCUREMENT AUDIT FAILED: REMEDIATE BLOCKERS BEFORE PROCEEDING');
  console.log('='.repeat(80) + '\n');
  process.exit(1);
}
