import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CHECK_ONLY = process.argv.includes('--check');

const mappings = [
  ['protocol-artifacts/solana/idl/community_registry.ts', 'app/src/lib/programs/idl/community_registry.ts'],
  ['protocol-artifacts/solana/idl/governance.ts', 'app/src/lib/programs/idl/governance.ts'],
  ['protocol-artifacts/solana/idl/membership.ts', 'app/src/lib/programs/idl/membership.ts'],
  ['protocol-artifacts/solana/idl/payment_attestation.ts', 'app/src/lib/programs/idl/payment_attestation.ts'],
  ['protocol-artifacts/solana/idl/treasury_vault.ts', 'app/src/lib/programs/idl/treasury_vault.ts'],
  ['protocol-artifacts/evm/evmAddresses.ts', 'app/src/lib/programs/evmAddresses.ts'],
  ['protocol-artifacts/evm/abis.ts', 'app/src/lib/evm/abis.ts'],
];

const drifted = [];

for (const [sourceRel, destRel] of mappings) {
  const source = resolve(sourceRel);
  const dest = resolve(destRel);
  const sourceText = readFileSync(source, 'utf8');
  const destText = readFileSync(dest, 'utf8');

  if (sourceText === destText) continue;

  drifted.push({ sourceRel, destRel });

  if (!CHECK_ONLY) {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, sourceText, 'utf8');
  }
}

if (drifted.length === 0) {
  console.log(CHECK_ONLY ? 'Protocol artifacts are in sync.' : 'Protocol artifacts synced.');
  process.exit(0);
}

if (CHECK_ONLY) {
  console.error('Protocol artifact drift detected:');
  for (const { sourceRel, destRel } of drifted) {
    console.error(`- ${sourceRel} -> ${destRel}`);
  }
  process.exit(1);
}

console.log('Protocol artifacts synced:');
for (const { sourceRel, destRel } of drifted) {
  console.log(`- ${sourceRel} -> ${destRel}`);
}
