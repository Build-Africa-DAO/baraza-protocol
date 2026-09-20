#!/usr/bin/env node
// scripts/devops/validate-env-matrix.mjs
// Standard: S&P 500 Enterprise Fintech / NIST SP 800-53 Configuration Management
// Audits configuration across all 15 cloud, fintech, telecommunications & Web3 providers.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const isProd = args.includes('--mode=prod') || process.env.NODE_ENV === 'production';
const isStaging = args.includes('--mode=staging') || process.env.NODE_ENV === 'staging';
const isStrict = isProd || isStaging || args.includes('--strict');

console.log('='.repeat(78));
console.log('   BARAZA PROTOCOL — 15-PROVIDER ENVIRONMENT MATRIX AUDIT');
console.log(`   Execution Mode: ${isProd ? 'PRODUCTION (Strict Zero-Mock)' : isStaging ? 'STAGING (Pre-Prod)' : 'DEV/LOCAL (Sandbox & Fallbacks Active)'}`);
console.log('   Standard: S&P 500 Enterprise Fintech / NIST SP 800-53 CM-6 / PCI-DSS v4.0.1');
console.log('='.repeat(78));

// Read environment variables from process.env and optionally .env / .env.local
const env = { ...process.env };
['.env', '.env.local', 'app/.env', 'app/.env.local'].forEach((relPath) => {
  const fullPath = resolve(relPath);
  if (existsSync(fullPath)) {
    try {
      const lines = readFileSync(fullPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          const key = k.trim();
          const val = v.join('=').trim().replace(/^["']|["']$/g, '');
          if (!env[key]) env[key] = val;
        }
      }
    } catch {}
  }
});


const PROVIDERS = [
  {
    name: '1. Supabase (PostgreSQL 16 & RLS)',
    category: 'Database & Storage',
    keys: [
      { key: 'SUPABASE_URL', requiredInProd: true, pattern: /^https?:\/\//, desc: 'Supabase Project REST Endpoint' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', requiredInProd: true, secret: true, desc: 'Bypasses RLS for server ledger operations' },
      { key: 'SUPABASE_ANON_KEY', requiredInProd: true, secret: true, desc: 'Public anonymous client key' },
    ],
  },
  {
    name: '2. Cloudflare (Edge Workers & Pages)',
    category: 'Edge Network & WAF',
    keys: [
      { key: 'CLOUDFLARE_ACCOUNT_ID', requiredInProd: true, desc: 'Cloudflare Account ID for Pages Deployment' },
      { key: 'CLOUDFLARE_API_TOKEN', requiredInProd: true, secret: true, desc: 'Wrangler deployment and DNS API token' },
      { key: 'CRON_SECRET', requiredInProd: true, secret: true, desc: 'Bearer token gating edge cron dispatch' },
    ],
  },
  {
    name: '3. Stellar Horizon & Soroban RPC',
    category: 'Decentralized Chama Ledger',
    keys: [
      { key: 'STELLAR_HORIZON_URL', requiredInProd: true, pattern: /^https?:\/\//, desc: 'Stellar Horizon API Endpoint' },
      { key: 'STELLAR_NETWORK_PASSPHRASE', requiredInProd: true, desc: 'Testnet or Public Passphrase' },
      { key: 'BRZA_ISSUER_PUBLIC_KEY', requiredInProd: true, desc: 'Stellar Asset Issuer Account (G...)' },
      { key: 'BRZA_DISTRIBUTOR_SECRET', requiredInProd: true, secret: true, desc: 'Distributor Signing Seed (S...)' },
    ],
  },
  {
    name: '4. Base L2 / Ethereum RPC',
    category: 'EVM Dues Settlement',
    keys: [
      { key: 'BASE_RPC_URL', requiredInProd: false, pattern: /^https?:\/\//, desc: 'Alchemy / Infura Base Node RPC' },
      { key: 'NEXT_PUBLIC_CHAIN_ID', requiredInProd: false, desc: '8453 (Mainnet) or 84532 (Sepolia)' },
    ],
  },
  {
    name: '5. Solana RPC & Anchor Program',
    category: 'Quadratic Voting & Governance',
    keys: [
      { key: 'SOLANA_RPC_URL', requiredInProd: false, pattern: /^https?:\/\//, desc: 'Helius or Triton RPC Endpoint' },
      { key: 'SOLANA_COMMUNITY_REGISTRY_PROGRAM_ID', requiredInProd: false, desc: 'On-chain Anchor Program Public Key' },
    ],
  },
  {
    name: '6. Safaricom Daraja (M-Pesa)',
    category: 'Kenya Mobile Money',
    keys: [
      { key: 'MPESA_CONSUMER_KEY', requiredInProd: true, secret: true, desc: 'Daraja Consumer Key' },
      { key: 'MPESA_CONSUMER_SECRET', requiredInProd: true, secret: true, desc: 'Daraja Consumer Secret' },
      { key: 'MPESA_PASSKEY', requiredInProd: true, secret: true, desc: 'Daraja STK Push Passkey' },
      { key: 'MPESA_SHORTCODE', requiredInProd: true, desc: 'Business Shortcode (Paybill or Till)' },
    ],
  },
  {
    name: '7. Airtel Africa Money API',
    category: 'Mobile Money Gateway',
    keys: [
      { key: 'AIRTEL_CLIENT_ID', requiredInProd: false, secret: true, desc: 'Airtel Money OAuth Client ID' },
      { key: 'AIRTEL_CLIENT_SECRET', requiredInProd: false, secret: true, desc: 'Airtel Money OAuth Client Secret' },
      { key: 'AIRTEL_PIN', requiredInProd: false, secret: true, desc: 'Encrypted API PIN for Disbursals' },
    ],
  },
  {
    name: '8. Paystack (Card & Bank Ingress)',
    category: 'Pan-African Payment Ingress',
    keys: [
      { key: 'PAYSTACK_SECRET_KEY', requiredInProd: true, secret: true, desc: 'sk_live_ or sk_test_ Secret Key' },
      { key: 'PAYSTACK_PUBLIC_KEY', requiredInProd: true, desc: 'pk_live_ or pk_test_ Public Key' },
    ],
  },
  {
    name: '9. Minisend',
    category: 'Cross-Border Off-Ramp',
    keys: [
      { key: 'MINISEND_API_KEY', requiredInProd: true, secret: true, desc: 'Minisend Merchant API Key' },
      { key: 'MINISEND_WEBHOOK_SECRET', requiredInProd: true, secret: true, desc: 'Minisend Webhook Signature Secret' },
    ],
  },
  {
    name: '10. Kotani Pay',
    category: 'USSD Webhook & Fiat Ramp',
    keys: [
      { key: 'KOTANI_API_KEY', requiredInProd: false, secret: true, desc: 'Kotani Merchant API Key' },
      { key: 'KOTANI_WEBHOOK_SECRET', requiredInProd: false, secret: true, desc: 'Kotani Webhook Verification HMAC' },
    ],
  },
  {
    name: '11. Africa\'s Talking',
    category: 'SMS OTP & Voice Fallback',
    keys: [
      { key: 'AT_API_KEY', requiredInProd: true, secret: true, desc: 'Africa\'s Talking API Key' },
      { key: 'AT_USERNAME', requiredInProd: true, desc: 'Username (sandbox or live app)' },
    ],
  },
  {
    name: '12. Evolution API (WhatsApp Gateway)',
    category: 'WhatsApp Conversational UI',
    keys: [
      { key: 'EVOLUTION_API_URL', requiredInProd: true, pattern: /^https?:\/\//, desc: 'WhatsApp Gateway Host URL' },
      { key: 'EVOLUTION_API_KEY', requiredInProd: true, secret: true, desc: 'Evolution Global API Key' },
      { key: 'EVOLUTION_INSTANCE_NAME', requiredInProd: true, desc: 'Baraza Bot Instance Name' },
    ],
  },
  {
    name: '13. Anthropic Claude API',
    category: 'Akili Legal AI Assistant',
    keys: [
      { key: 'ANTHROPIC_API_KEY', requiredInProd: true, secret: true, desc: 'sk-ant- API Key for Claude 3.5 Sonnet' },
    ],
  },
  {
    name: '14. Upstash Redis REST',
    category: 'Distributed Rate Limiting & Mutex',
    keys: [
      { key: 'UPSTASH_REDIS_REST_URL', requiredInProd: true, pattern: /^https?:\/\//, desc: 'Upstash Global REST URL' },
      { key: 'UPSTASH_REDIS_REST_TOKEN', requiredInProd: true, secret: true, desc: 'Upstash REST Bearer Token' },
    ],
  },
  {
    name: '15. Slack API Webhook',
    category: 'Ops DLQ & Observability Alerts',
    keys: [
      { key: 'OPS_SLACK_WEBHOOK_URL', requiredInProd: true, pattern: /^https:\/\/hooks\.slack\.com/, desc: 'Slack Incident Channel Webhook' },
    ],
  },
];

let totalKeys = 0;
let configuredKeys = 0;
let criticalFailures = 0;
let warnings = 0;

for (const provider of PROVIDERS) {
  console.log(`\n▶ ${provider.name} [${provider.category}]`);
  for (const k of provider.keys) {
    totalKeys++;
    const val = env[k.key];
    const isConfigured = typeof val === 'string' && val.trim().length > 0;

    if (!isConfigured) {
      if (isStrict && k.requiredInProd) {
        criticalFailures++;
        console.error(`  [FAIL] ❌ ${k.key.padEnd(35)} : MISSING (Required in Production)`);
      } else {
        warnings++;
        console.warn(`  [WARN] ⚠️  ${k.key.padEnd(35)} : Unset (Using mock/sandboxed fallback in local mode)`);
      }
      continue;
    }

    // Value exists - check for dummy/placeholder in strict mode
    const isPlaceholder = ['test', 'dummy', 'placeholder', 'changeme', 'xxxx'].some(p => val.toLowerCase().includes(p));
    if (isStrict && isPlaceholder) {
      criticalFailures++;
      console.error(`  [FAIL] ❌ ${k.key.padEnd(35)} : Rejected placeholder "${val}" in strict mode`);
      continue;
    }

    if (k.pattern && !k.pattern.test(val)) {
      warnings++;
      console.warn(`  [WARN] ⚠️  ${k.key.padEnd(35)} : Value does not match expected format pattern`);
    } else {
      configuredKeys++;
      const displayVal = k.secret ? `***${val.slice(-4)}` : val.slice(0, 30);
      console.log(`  [PASS] ✅ ${k.key.padEnd(35)} : Configured (${displayVal})`);
    }
  }
}

console.log('\n' + '='.repeat(78));
console.log(`  ENVIRONMENT MATRIX AUDIT COMPLETE`);
console.log(`  Total Keys Inspected: ${totalKeys}`);
console.log(`  Configured Keys:      ${configuredKeys}`);
console.log(`  Missing / Fallbacks:  ${warnings}`);
console.log(`  Critical Failures:    ${criticalFailures}`);
console.log('='.repeat(78) + '\n');

if (criticalFailures > 0) {
  console.error('❌ STRICT VERIFICATION FAILED: Missing required production infrastructure keys.\n');
  process.exit(1);
} else {
  console.log('✅ ENVIRONMENT MATRIX VERIFIED: Ready for operation.\n');
  process.exit(0);
}
