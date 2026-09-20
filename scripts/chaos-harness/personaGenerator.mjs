// scripts/chaos-harness/personaGenerator.mjs
// Generates the deterministic catalog of 5,000 unique cryptographic personas
// across all 5 access tiers, writing to tests/personas/manifest.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { TIERS, TIER_COUNTS } from './types.mjs';

const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.YEHFlsDyYXjxJ5oIZyJ6HuS62T6qaal7bGnWI5GxbRs';
const CRON_SECRET = 'live_cron_secret_67890';

export function generateAllPersonas() {
  const personas = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCount: 5000,
      epoch: 2,
    },
    [TIERS.TIER_0]: [],
    [TIERS.TIER_1]: [],
    [TIERS.TIER_2]: [],
    [TIERS.TIER_3]: [],
    [TIERS.TIER_4]: [],
  };

  // 1. Tier 0: 50 Superadmins (SA-001 .. SA-050)
  for (let i = 1; i <= TIER_COUNTS[TIERS.TIER_0]; i++) {
    const id = `SA-${String(i).padStart(3, '0')}`;
    personas[TIERS.TIER_0].push({
      id,
      tier: TIERS.TIER_0,
      role: 'superadmin',
      serviceRoleKey: SERVICE_KEY,
      cronSecret: CRON_SECRET,
      walletAddress: `0xSA${String(i).padStart(38, '0')}`,
    });
  }

  // 2. Tier 1: 250 Founders & Officers (FO-001 .. FO-250)
  for (let i = 1; i <= TIER_COUNTS[TIERS.TIER_1]; i++) {
    const id = `FO-${String(i).padStart(3, '0')}`;
    const communityIndex = ((i - 1) % 50) + 1;
    const communityId = `00000000-0000-0000-0000-${String(communityIndex).padStart(12, '0')}`;
    personas[TIERS.TIER_1].push({
      id,
      tier: TIERS.TIER_1,
      role: i <= 50 ? 'founder' : i <= 150 ? 'treasurer' : 'secretary',
      communityId,
      sessionToken: `brz_sess_founder_${id}`,
      walletAddress: `0xFO${String(i).padStart(38, '0')}`,
      phone: `+254700${String(i).padStart(6, '0')}`,
      saccoLicense: `CS/${1000 + i}`,
    });
  }

  // 3. Tier 2: 2,200 Members (ME-0001 .. ME-2200)
  for (let i = 1; i <= TIER_COUNTS[TIERS.TIER_2]; i++) {
    const id = `ME-${String(i).padStart(4, '0')}`;
    const communityIndex = ((i - 1) % 50) + 1; // 44 members per community
    const communityId = `00000000-0000-0000-0000-${String(communityIndex).padStart(12, '0')}`;
    personas[TIERS.TIER_2].push({
      id,
      tier: TIERS.TIER_2,
      role: 'member',
      communityId,
      sessionToken: `brz_sess_member_${id}`,
      walletAddress: `0xME${String(i).padStart(38, '0')}`,
      phone: `+254710${String(i).padStart(6, '0')}`,
      votingWeight: 1,
    });
  }

  // 4. Tier 3: 500 Integrators (DE-001 .. DE-500)
  const rails = ['daraja', 'kotani', 'artizen', 'swypt', 'minisend'];
  for (let i = 1; i <= TIER_COUNTS[TIERS.TIER_3]; i++) {
    const id = `DE-${String(i).padStart(3, '0')}`;
    const rail = rails[(i - 1) % rails.length];
    personas[TIERS.TIER_3].push({
      id,
      tier: TIERS.TIER_3,
      role: 'integrator',
      rail,
      hmacSecret: `secret_hmac_${rail}_key_${i}`,
      partnerId: `partner_${rail}_${i}`,
    });
  }

  // 5. Tier 4: 2,000 Adversaries (AD-0001 .. AD-2000)
  const attackProfiles = [
    'rls_quarantine_probe',
    'mock_token_bleed',
    'double_vote_sybil',
    'rate_limit_ddos',
    'prompt_injection',
    'circuit_breaker_probe',
    'otp_brute_force',
  ];
  for (let i = 1; i <= TIER_COUNTS[TIERS.TIER_4]; i++) {
    const id = `AD-${String(i).padStart(4, '0')}`;
    const profile = attackProfiles[(i - 1) % attackProfiles.length];
    personas[TIERS.TIER_4].push({
      id,
      tier: TIERS.TIER_4,
      role: 'adversary',
      attackProfile: profile,
      mockPrivyToken: `test_privy_token_spoof_${i}`,
      mockGoogleToken: `test_google_token_spoof_${i}`,
      walletAddress: `0xAD${String(i).padStart(38, '0')}`,
      bogusPhone: `+254000${String(i).padStart(6, '0')}`,
    });
  }

  return personas;
}

// Execute and write manifest when run directly
const manifestPath = resolve('tests/personas/manifest.json');
mkdirSync(dirname(manifestPath), { recursive: true });
const catalog = generateAllPersonas();
writeFileSync(manifestPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`[PersonaGenerator] Successfully generated 5,000 personas at ${manifestPath}`);
