#!/usr/bin/env node
// scripts/devops/verify-blockchain-nodes.mjs
// Standard: S&P 500 Enterprise Fintech / Multi-Chain RPC Health & Latency Probe
// Probes live RPC connectivity across Stellar Soroban, Base L2, and Solana.

import https from 'node:https';

console.log('='.repeat(78));
console.log('   BARAZA PROTOCOL — MULTI-CHAIN BLOCKCHAIN RPC PROBE');
console.log('   Standard: S&P 500 Enterprise Fintech / Decentralized Settlement Health');
console.log('='.repeat(78));

const NETWORKS = [
  {
    name: 'Stellar Horizon Testnet',
    url: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    checkType: 'GET',
    path: '/',
    validate: (data) => data.horizon_version && data.core_latest_ledger,
  },
  {
    name: 'Base L2 (Coinbase/Ethereum)',
    url: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
    checkType: 'JSON_RPC',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    validate: (data) => typeof data.result === 'string',
  },
  {
    name: 'Solana RPC (Devnet)',
    url: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    checkType: 'JSON_RPC',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
    validate: (data) => typeof data.result === 'number',
  },
];

async function probeEndpoint(net) {
  const parsed = new URL(net.url);
  const start = Date.now();

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + (net.path || ''),
        method: net.checkType === 'GET' ? 'GET' : 'POST',
        headers: net.checkType === 'GET' ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(net.body) },
        timeout: 8000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const latency = Date.now() - start;
          try {
            const parsedJson = JSON.parse(body);
            const isValid = net.validate(parsedJson);
            if (isValid && res.statusCode === 200) {
              resolve({ name: net.name, url: net.url, status: 'HEALTHY', latency, code: res.statusCode });
            } else {
              resolve({ name: net.name, url: net.url, status: 'DEGRADED', latency, code: res.statusCode });
            }
          } catch {
            resolve({ name: net.name, url: net.url, status: 'INVALID_JSON', latency, code: res.statusCode });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ name: net.name, url: net.url, status: 'UNREACHABLE', latency: Date.now() - start, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ name: net.name, url: net.url, status: 'TIMEOUT', latency: 8000 });
    });

    if (net.body) req.write(net.body);
    req.end();
  });
}

console.log('\nDispatching synthetic latency probes to all 3 settlement networks...\n');

Promise.all(NETWORKS.map(probeEndpoint)).then((results) => {
  let healthyCount = 0;
  for (const r of results) {
    if (r.status === 'HEALTHY') {
      healthyCount++;
      console.log(`  [HEALTHY] ✅ ${r.name.padEnd(28)} : ${r.latency}ms RTT (HTTP ${r.code}) -> ${r.url}`);
    } else {
      console.warn(`  [${r.status}] ⚠️  ${r.name.padEnd(28)} : ${r.latency}ms RTT -> ${r.error || `HTTP ${r.code}`}`);
    }
  }

  console.log('\n' + '-'.repeat(78));
  console.log(`Multi-Chain Health: ${healthyCount}/${results.length} networks reachable.`);
  console.log('-'.repeat(78) + '\n');
  process.exit(0);
});
