// scripts/chaos-harness/seedCluster.mjs
// Standard: S&P 500 Enterprise Fintech / NIST SP 800-115
// High-performance database cluster seeder for 5,000-persona chaos simulation

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '../..');
const MANIFEST_PATH = resolve(ROOT_DIR, 'tests/personas/manifest.json');

function sha256Hex(str) {
  return createHash('sha256').update(str).digest('hex');
}

function runSql(sql) {
  return execSync('docker exec -i baraza-postgres psql -U postgres -d postgres', {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

async function seed() {
  console.log('==> [1/6] Reading persona manifest from', MANIFEST_PATH);
  const raw = readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);

  const founders = manifest.tier_1_founders;
  const members = manifest.tier_2_members;
  console.log(`==> Loaded ${founders.length} founders and ${members.length} members.`);

  // 1. Communities (50 Canonical Communities)
  console.log('==> [2/6] Seeding 50 canonical communities...');
  const communityRows = [];
  for (let i = 1; i <= 50; i++) {
    const commId = `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    const founder = founders[i - 1];
    const commName = `Alpha Community ${String(i).padStart(3, '0')}`;
    const slug = `alpha-comm-${String(i).padStart(3, '0')}`;
    communityRows.push(
      `('${commId}', '${commName}', '${slug}', 'chama', 'mtaa', 'active', 'multisig-ready', 7, '${founder.walletAddress}', 'stellar')`
    );
  }

  const sqlCommunities = `
    INSERT INTO public.communities (id, name, slug, type, tier, status, treasury_policy, voting_period_days, created_by, chain)
    VALUES ${communityRows.join(',\n    ')}
    ON CONFLICT (id) DO UPDATE SET
      status = 'active',
      treasury_policy = 'multisig-ready',
      created_by = EXCLUDED.created_by;
  `;
  runSql(sqlCommunities);
  console.log('    ✓ 50 canonical communities active.');

  // 2. Founders (250 Profiles, Sessions, Members, Memberships)
  console.log('==> [3/6] Seeding 250 Founder profiles, sessions, and memberships...');
  const founderProfileRows = [];
  const founderSessionRows = [];
  const founderMemberRows = [];

  for (let i = 0; i < founders.length; i++) {
    const f = founders[i];
    const uuid = `10000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const tokenHash = sha256Hex(f.sessionToken);
    const email = `founder_${f.id.toLowerCase()}@barazaprotocol.com`;

    founderProfileRows.push(
      `('${uuid}', '${f.walletAddress}', 'Founder ${f.id}', 'founder', '${email}', '${f.phone}', 'KE', 'en', 'KES')`
    );

    founderSessionRows.push(
      `(gen_random_uuid(), '${uuid}', '${tokenHash}', now() + interval '30 days')`
    );

    founderMemberRows.push(
      `('${f.id}', '${uuid}', '${f.communityId}', '${f.walletAddress}', 'founder', 'active')`
    );
  }

  const sqlFounders = `
    INSERT INTO public.user_profiles (id, wallet_address, display_name, role, email, phone_e164, country, locale, default_currency)
    VALUES ${founderProfileRows.join(',\n    ')}
    ON CONFLICT (id) DO UPDATE SET
      wallet_address = EXCLUDED.wallet_address,
      role = 'founder';

    INSERT INTO public.auth_sessions (id, user_profile_id, session_token_hash, expires_at)
    VALUES ${founderSessionRows.join(',\n    ')}
    ON CONFLICT (session_token_hash) DO UPDATE SET
      expires_at = EXCLUDED.expires_at,
      revoked_at = NULL;

    INSERT INTO public.members (member_id, auth_user_id, community_id, wallet_address, role, activation_status)
    VALUES ${founderMemberRows.join(',\n    ')}
    ON CONFLICT (member_id) DO UPDATE SET
      role = 'founder',
      activation_status = 'active';
  `;
  runSql(sqlFounders);
  console.log('    ✓ 250 founders seeded with live sessions.');

  // 3. Members (2,200 Profiles, Sessions, Members, Memberships)
  console.log('==> [4/6] Seeding 2,200 Member profiles, sessions, and memberships...');
  // Batch in chunks of 500 to keep SQL statements manageable
  const CHUNK_SIZE = 500;
  for (let c = 0; c < members.length; c += CHUNK_SIZE) {
    const chunk = members.slice(c, c + CHUNK_SIZE);
    const profileRows = [];
    const sessionRows = [];
    const memberRows = [];
    const membershipRows = [];

    for (let i = 0; i < chunk.length; i++) {
      const idx = c + i + 1;
      const m = chunk[i];
      const uuid = `20000000-0000-0000-0000-${String(idx).padStart(12, '0')}`;
      const tokenHash = sha256Hex(m.sessionToken);
      const email = `member_${m.id.toLowerCase()}@barazaprotocol.com`;

      profileRows.push(
        `('${uuid}', '${m.walletAddress}', 'Member ${m.id}', 'member', '${email}', '${m.phone}', 'KE', 'en', 'KES')`
      );

      sessionRows.push(
        `(gen_random_uuid(), '${uuid}', '${tokenHash}', now() + interval '30 days')`
      );

      memberRows.push(
        `('${m.id}', '${uuid}', '${m.communityId}', '${m.walletAddress}', 'member', 'active')`
      );

      const userIdHash = sha256Hex(uuid);
      membershipRows.push(
        `('${m.id}', '${m.communityId}', '${userIdHash}', '${m.walletAddress}', 'ACTIVE', ${m.votingWeight})`
      );
    }

    const sqlChunk = `
      INSERT INTO public.user_profiles (id, wallet_address, display_name, role, email, phone_e164, country, locale, default_currency)
      VALUES ${profileRows.join(',\n      ')}
      ON CONFLICT (id) DO UPDATE SET
        wallet_address = EXCLUDED.wallet_address;

      INSERT INTO public.auth_sessions (id, user_profile_id, session_token_hash, expires_at)
      VALUES ${sessionRows.join(',\n      ')}
      ON CONFLICT (session_token_hash) DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        revoked_at = NULL;

      INSERT INTO public.members (member_id, auth_user_id, community_id, wallet_address, role, activation_status)
      VALUES ${memberRows.join(',\n      ')}
      ON CONFLICT (member_id) DO UPDATE SET
        activation_status = 'active';

      INSERT INTO public.memberships (member_id, community_id, user_id_hash, wallet_address, status, voting_weight)
      VALUES ${membershipRows.join(',\n      ')}
      ON CONFLICT (member_id) DO UPDATE SET
        status = 'ACTIVE',
        voting_weight = EXCLUDED.voting_weight;
    `;
    runSql(sqlChunk);
    console.log(`    ✓ Chunk ${c + 1} - ${c + chunk.length} seeded.`);
  }

  // 4. Governance Proposals (50 Active Proposals)
  console.log('==> [5/6] Seeding 50 active governance proposals...');
  const proposalRows = [];
  for (let i = 1; i <= 50; i++) {
    const propId = `prop-active-${String(i).padStart(3, '0')}`;
    const commId = `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    const title = `Democratic Treasury Allocation Cycle ${i}`;
    const desc = `Treasury funding proposal to disburse development liquidity to verified community projects.`;

    proposalRows.push(
      `('${propId}', '${commId}', '${title}', '${desc}', 'treasury', 'active', 'stellar', 2000, 0, 0, 0, now() - interval '1 hour', now() + interval '7 days')`
    );
  }

  const sqlProposals = `
    INSERT INTO public.proposals (id, community_id, title, description, kind, status, chain, quorum_threshold_bps, for_votes, against_votes, abstain_votes, starts_at, ends_at)
    VALUES ${proposalRows.join(',\n    ')}
    ON CONFLICT (id) DO UPDATE SET
      status = 'active',
      ends_at = now() + interval '7 days';
  `;
  runSql(sqlProposals);
  console.log('    ✓ 50 active governance proposals ready for quorum voting.');

  // 5. System Configuration & Payment Orders
  console.log('==> [6/6] Seeding System Config and Initial Payment Orders...');
  const orderRows = [];
  for (let i = 1; i <= 50; i++) {
    const orderId = `ord-reconcile-seed-${String(i).padStart(3, '0')}`;
    const commId = `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    orderRows.push(
      `('${orderId}', '${commId}', 'kotani', 'sandbox', 1000.00, 1000.00, 'KES', 'INDEXER_CONFIRMED', now() - interval '10 minutes')`
    );
  }

  const sqlSystem = `
    INSERT INTO public.system_config (key, value)
    VALUES
      ('circuit_breaker', '{"is_emergency_paused": false, "reason": "", "paused_at": null, "paused_by": null, "affected_rails": ["mpesa", "minisend", "soroban", "cron"]}'::jsonb),
      ('sasra_reserve_floor', '{"reserve_ratio": 0.15}'::jsonb),
      ('treasury_limits', '{"max_daily_payout_kes": 500000}'::jsonb)
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value;

    INSERT INTO public.payment_orders (order_id, community_id, provider, provider_environment, amount_expected, amount_received, currency, status, created_at)
    VALUES ${orderRows.join(',\n    ')}
    ON CONFLICT (order_id) DO UPDATE SET
      status = 'INDEXER_CONFIRMED';
  `;
  runSql(sqlSystem);
  console.log('    ✓ System config and 50 reconciliation test orders seeded.');

  console.log('\n======================================================');
  console.log('Cluster Seeding Complete: 5,000-Persona State Primed!');
  console.log('======================================================');
}

seed().catch((err) => {
  console.error('Fatal Seeder Error:', err);
  process.exit(1);
});
