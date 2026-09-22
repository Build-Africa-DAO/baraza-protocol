#!/usr/bin/env node
// scripts/devops/provision-stellar-keys.mjs
// Standard: S&P 500 Enterprise Fintech / NIST SP 800-63B / ed25519 Cryptographic Provisioner
// Generates and securely provisions Stellar protocol accounts and NIST cryptographic secrets.

import { randomBytes, generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync, readFileSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Keypair } = require(resolve('app/node_modules/@stellar/stellar-base'));

console.log('='.repeat(78));
console.log('   BARAZA PROTOCOL — STELLAR & NIST CRYPTOGRAPHIC VAULT PROVISIONER');
console.log('   Standard: S&P 500 Enterprise Fintech / NIST SP 800-63B High-Entropy');
console.log('='.repeat(78));

// 1. Generate 3 ed25519 Stellar Keypairs
const treasury = Keypair.random();
const brzaIssuer = Keypair.random();
const brzaDistributor = Keypair.random();

// 2. Generate 256-bit CSPRNG Hex Secrets
function generateHexSecret(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

const stellarIntentSecret = generateHexSecret(32);
const paymentPhonePepper = generateHexSecret(32);
const paymentProxySecret = generateHexSecret(32);

// 3. Generate RFC 8292 VAPID P-256 Keypair (Web Push)
function generateVapidKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });
  const rawPublic = publicKey.subarray(publicKey.length - 65);
  const rawPrivate = privateKey.subarray(privateKey.length - 32);
  return {
    publicKey: rawPublic.toString('base64url'),
    privateKey: rawPrivate.toString('base64url'),
  };
}
const vapidKeys = generateVapidKeyPair();

// 4. Construct Vault Artifact
const vaultData = {
  _metadata: {
    generated_at: new Date().toISOString(),
    standard: 'NIST SP 800-63B / S&P 500 Enterprise Fintech',
    warning: 'CRITICAL SECURITY ASSET — NEVER COMMIT TO VERSION CONTROL OR EXPOSE IN BROWSER',
  },
  stellar: {
    treasury_account: {
      public_address: treasury.publicKey(),
      secret_seed: treasury.secret(),
      role: 'Primary dues clearing vault and SACCO reserve holding account',
    },
    brza_issuer: {
      public_address: brzaIssuer.publicKey(),
      secret_seed: brzaIssuer.secret(),
      role: 'BRZA Governance Asset Issuer (Minting & Trustlines)',
    },
    brza_distributor: {
      public_address: brzaDistributor.publicKey(),
      secret_seed: brzaDistributor.secret(),
      role: 'BRZA Liquid Distributor (Settlement & Retro Allocations)',
    },
  },
  cryptographic_secrets: {
    STELLAR_INTENT_SECRET: stellarIntentSecret,
    PAYMENT_PHONE_HASH_PEPPER: paymentPhonePepper,
    PAYMENT_ADAPTER_PROXY_SECRET: paymentProxySecret,
    VAPID_PUBLIC_KEY: vapidKeys.publicKey,
    VAPID_PRIVATE_KEY: vapidKeys.privateKey,
  },
};

// 5. Securely Save Master Vault Backup
const credentialsDir = resolve('credentials');
if (!existsSync(credentialsDir)) {
  mkdirSync(credentialsDir, { recursive: true });
}
const vaultPath = resolve(credentialsDir, 'stellar-protocol-master-vault.json');
writeFileSync(vaultPath, JSON.stringify(vaultData, null, 2), { encoding: 'utf8', mode: 0o600 });
chmodSync(vaultPath, 0o600);
console.log(`\n🔒 Master Cryptographic Vault created at:`);
console.log(`   ${vaultPath} (Permissions: 0600 - Owner Read/Write Only)`);

// 6. Update app/.env
const envPath = resolve('app/.env');
let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

// Replace dev proxy secret if present
if (envContent.includes('PAYMENT_ADAPTER_PROXY_SECRET=dev-proxy-secret-change-in-prod')) {
  envContent = envContent.replace(
    'PAYMENT_ADAPTER_PROXY_SECRET=dev-proxy-secret-change-in-prod',
    `PAYMENT_ADAPTER_PROXY_SECRET="${paymentProxySecret}"`
  );
}

// Prepare Stellar & Crypto Block
const stellarEnvBlock = `
# ─── STELLAR PROTOCOL ACCOUNTS & KEYS ─────────────────────────
STELLAR_TREASURY_ACCOUNT="${treasury.publicKey()}"
VITE_STELLAR_TREASURY_ACCOUNT="${treasury.publicKey()}"

BRZA_ISSUER_ADDRESS="${brzaIssuer.publicKey()}"
VITE_BRZA_ISSUER_ADDRESS="${brzaIssuer.publicKey()}"

BRZA_DISTRIBUTOR_ADDRESS="${brzaDistributor.publicKey()}"
VITE_BRZA_DISTRIBUTOR_ADDRESS="${brzaDistributor.publicKey()}"
BRZA_DISTRIBUTOR_SECRET="${brzaDistributor.secret()}"

STELLAR_INTENT_SECRET="${stellarIntentSecret}"
PAYMENT_PHONE_HASH_PEPPER="${paymentPhonePepper}"

# ─── WEB PUSH VAPID NOTIFICATIONS ─────────────────────────────
VITE_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"

# ─── PROTOCOL ROOT ADMIN WALLETS ──────────────────────────────
VITE_ADMIN_WALLETS="${treasury.publicKey()}"
`;

// Append to env if not already present
if (!envContent.includes('STELLAR_TREASURY_ACCOUNT')) {
  envContent = envContent.trimEnd() + '\n' + stellarEnvBlock;
  writeFileSync(envPath, envContent, 'utf8');
  console.log(`\n✅ Production variables successfully injected into: ${envPath}`);
} else {
  console.log(`\nℹ️  STELLAR_TREASURY_ACCOUNT already exists in ${envPath}. Skipping overwrite.`);
}

console.log('\n' + '-'.repeat(78));
console.log('   PROVISIONED PROTOCOL IDENTITIES:');
console.log('-'.repeat(78));
console.log(`  Treasury Public Account   : ${treasury.publicKey()}`);
console.log(`  BRZA Issuer Public Account: ${brzaIssuer.publicKey()}`);
console.log(`  BRZA Distributor Account  : ${brzaDistributor.publicKey()}`);
console.log(`  Stellar Intent Secret     : [256-bit CSPRNG Active]`);
console.log(`  Phone Anonymization Pepper: [256-bit CSPRNG Active]`);
console.log(`  Payment Proxy Secret      : [256-bit CSPRNG Active]`);
console.log(`  VAPID WebPush Public Key  : ${vapidKeys.publicKey.substring(0, 20)}...`);
console.log('-'.repeat(78) + '\n');
