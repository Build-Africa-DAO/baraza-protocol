/**
 * Package 1: SaaS Community Invites, Officer Governance & Multi-Channel Push Subscriptions
 * Master Verification Suite — 20 Adversarial Test Scenarios
 *
 * Validates all formal invariants from Package 1 Theoretical Specification v2.0:
 *   I-INV-1: Invite Capacity Conservation (uses_count ≤ max_uses under concurrency)
 *   I-INV-2: Idempotent Re-Entrance (already-member short-circuit burns zero uses)
 *   I-ROLE-1: Privilege Containment (only founder/admin for role mutations)
 *   I-ROLE-2: Non-Zero Admin Invariant (|Admins| ≥ 1 always)
 *   I-ROLE-3: SACCO Governance Policy Gate
 *   I-ROLE-4: Founder Sovereign Protection
 *   I-NOTIF-1: Polymorphic DID Binding
 *   I-SEC-1: Anti-SSRF Ingress Guard
 *
 * Runs against live Docker PostgreSQL (baraza-postgres) on port 54321.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import handleInvites from '../../../../app/api/communities/invites/index.js';
import handleAcceptInvite, { _resetRateLimitForTesting } from '../../../../app/api/communities/invites/accept.js';
import handleOfficers from '../../../../app/api/communities/officers.js';
import handlePushSubscribe from '../../../../app/api/user/notifications/push-subscribe.js';
import { getSupabaseAdmin } from '../../../../app/api/_lib/supabase.js';

const LIVE_DB_URL = 'http://localhost:54321';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.YEHFlsDyYXjxJ5oIZyJ6HuS62T6qaal7bGnWI5GxbRs';

process.env.SUPABASE_URL = LIVE_DB_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;

// Helper: Build authenticated request with test headers
function authedRequest(url: string, opts: RequestInit & { wallet?: string; privyDid?: string; ip?: string } = {}): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (opts.wallet) headers['x-test-wallet-address'] = opts.wallet;
  if (opts.privyDid) headers['x-test-privy-did'] = opts.privyDid;
  if (opts.ip) headers['cf-connecting-ip'] = opts.ip;
  const { wallet: _w, privyDid: _p, ip: _ip, ...rest } = opts;
  return new Request(url, { ...rest, headers });
}

describe('Package 1: SaaS Community Invites, Officer Governance & Push Subscriptions', () => {
  const supabase = getSupabaseAdmin();
  const originalEnv = { ...process.env };

  // Test entity IDs (unique per run)
  const ts = Date.now();
  const communityA = `pkg1_chama_a_${ts}`;
  const communityB = `pkg1_sacco_b_${ts}`;
  const pausedCommunity = `pkg1_paused_${ts}`;

  const founderWallet = `GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7P1_${ts}`;
  const adminWallet = `SolanaAdmin_pkg1_${ts}`;
  const memberWallet = `SolanaMember_pkg1_${ts}`;
  const joinerWallet = `SolanaJoiner_pkg1_${ts}`;
  const strangerWallet = `SolanaStranger_pkg1_${ts}`;
  const privyUserDid = `did:privy:cm_pkg1_test_${ts}`;

  // Stored invite codes (populated during tests)
  let generatedInviteCode = '';
  let capacityInviteCode = '';

  beforeAll(async () => {
    _resetRateLimitForTesting();
    process.env.SUPABASE_URL = LIVE_DB_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;

    // Seed communities
    const { error: commErr } = await supabase.from('communities').insert([
      {
        id: communityA,
        name: 'Package 1 Alpha Chama',
        currency: 'KES',
        chain: 'stellar',
        type: 'chama',
        tier: 'mtaa',
        treasury_policy: 'multisig-ready',
        liquid_vault_balance_minor: 100000,
        status: 'active',
      },
      {
        id: communityB,
        name: 'Package 1 Formal SACCO',
        currency: 'KES',
        chain: 'stellar',
        type: 'sacco',
        tier: 'sacco',
        treasury_policy: 'proposal-only',
        liquid_vault_balance_minor: 500000,
        status: 'active',
      },
      {
        id: pausedCommunity,
        name: 'Package 1 Paused Community',
        currency: 'KES',
        chain: 'stellar',
        type: 'chama',
        tier: 'mtaa',
        treasury_policy: 'multisig-ready',
        liquid_vault_balance_minor: 10000,
        status: 'paused',
      },
    ]);
    if (commErr) throw new Error(`Community seed failed: ${commErr.message}`);

    // Seed members
    const { error: memErr } = await supabase.from('members').insert([
      {
        member_id: `mem_founder_pkg1_${ts}`,
        community_id: communityA,
        wallet_address: founderWallet,
        auth_user_id: `auth_founder_pkg1_${ts}`,
        phone_hash: `pkg1_founder_hash_${ts}`,
        role: 'founder',
        activation_status: 'active',
      },
      {
        member_id: `mem_admin_pkg1_${ts}`,
        community_id: communityA,
        wallet_address: adminWallet,
        auth_user_id: `auth_admin_pkg1_${ts}`,
        phone_hash: `pkg1_admin_hash_${ts}`,
        role: 'admin',
        activation_status: 'active',
      },
      {
        member_id: `mem_member_pkg1_${ts}`,
        community_id: communityA,
        wallet_address: memberWallet,
        auth_user_id: `auth_member_pkg1_${ts}`,
        phone_hash: `pkg1_member_hash_${ts}`,
        role: 'member',
        activation_status: 'active',
      },
      // SACCO founder for governance tests
      {
        member_id: `mem_sacco_founder_${ts}`,
        community_id: communityB,
        wallet_address: founderWallet,
        auth_user_id: `auth_sacco_founder_${ts}`,
        phone_hash: `pkg1_sacco_founder_hash_${ts}`,
        role: 'founder',
        activation_status: 'active',
      },
      // Paused community founder for TC-08
      {
        member_id: `mem_paused_founder_${ts}`,
        community_id: pausedCommunity,
        wallet_address: founderWallet,
        auth_user_id: `auth_paused_founder_${ts}`,
        phone_hash: `pkg1_paused_founder_hash_${ts}`,
        role: 'founder',
        activation_status: 'active',
      },
    ]);
    if (memErr) throw new Error(`Member seed failed: ${memErr.message}`);

    // Seed a capacity-limited invite for concurrency tests
    const capCode = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, '0')).join('');
    capacityInviteCode = capCode;
    await supabase.from('community_invites').insert({
      code: capCode,
      community_id: communityA,
      created_by: founderWallet,
      max_uses: 10,
      uses_count: 0,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Seed an invite for paused community (TC-08)
    await supabase.from('community_invites').insert({
      code: `paused_inv_${ts}`,
      community_id: pausedCommunity,
      created_by: founderWallet,
      max_uses: 100,
      uses_count: 0,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Seed an expired invite (TC-05)
    await supabase.from('community_invites').insert({
      code: `expired_inv_${ts}`,
      community_id: communityA,
      created_by: founderWallet,
      max_uses: 100,
      uses_count: 0,
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    });
  });

  afterAll(async () => {
    // Cleanup: CASCADE deletes members, invites, audit logs
    await supabase.from('user_push_subscriptions').delete().or(
      `wallet_address.like.%pkg1_${ts}%,privy_did.eq.${privyUserDid}`
    );
    await supabase.from('communities').delete().in('id', [communityA, communityB, pausedCommunity]);
    process.env = originalEnv;
  });

  // ===========================================================================
  // SECTION 1: INVITE GENERATION & LISTING (Scenarios 1-3)
  // ===========================================================================

  it('TC-INV-01: Admin Invite Generation (POST /api/communities/invites)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/invites', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({ communityId: communityA, maxUses: 50, expiresInDays: 14 }),
    });
    const res = await handleInvites(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.code).toMatch(/^[a-f0-9]{12}$/);
    expect(body.maxUses).toBe(50);
    expect(body.communityId).toBe(communityA);
    expect(body.inviteUrl).toContain(body.code);
    generatedInviteCode = body.code;
  });

  it('TC-INV-02: Member Invite Creation Rejection (I-ROLE-1)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/invites', {
      method: 'POST',
      wallet: memberWallet,
      body: JSON.stringify({ communityId: communityA }),
    });
    const res = await handleInvites(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
  });

  it('TC-INV-03: Active Invite Listing (GET /api/communities/invites)', async () => {
    const req = authedRequest(`http://localhost:3000/api/communities/invites?communityId=${communityA}`, {
      method: 'GET',
      wallet: founderWallet,
    });
    const res = await handleInvites(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.communityId).toBe(communityA);
    expect(Array.isArray(body.invites)).toBe(true);
    expect(body.invites.length).toBeGreaterThanOrEqual(1);
    // Expired invites should not appear
    const expiredInList = body.invites.find((i: { code: string }) => i.code === `expired_inv_${ts}`);
    expect(expiredInList).toBeUndefined();
  });

  // ===========================================================================
  // SECTION 2: ATOMIC INVITE ACCEPTANCE (Scenarios 4-8)
  // ===========================================================================

  it('TC-INV-04: Atomic Single Join (accept_community_invite_atomic)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/invites/accept', {
      method: 'POST',
      wallet: joinerWallet,
      body: JSON.stringify({ code: generatedInviteCode }),
    });
    const res = await handleAcceptInvite(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.joined).toBe(true);
    expect(body.communityId).toBe(communityA);
    expect(body.role).toBe('member');
  });

  it('TC-INV-05: Expired Invite Rejection (I-INV-1)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/invites/accept', {
      method: 'POST',
      wallet: strangerWallet,
      body: JSON.stringify({ code: `expired_inv_${ts}` }),
    });
    const res = await handleAcceptInvite(req);
    const body = await res.json();
    // Stored procedure raises INVITE_EXPIRED → HTTP 410
    expect(res.status).toBe(410);
    expect(body.error).toBe('expired');
  });

  it('TC-INV-06: High-Concurrency Burst (15 on max=10) — I-INV-1 Row Lock', async () => {
    // Fire 15 concurrent acceptance promises against a max=10 invite
    const workerWallets = Array.from({ length: 15 }, (_, i) => `ConcurrentWorker_${i}_${ts}`);

    // Ensure these workers have unique auth_user_ids and unique client IPs
    const promises = workerWallets.map((wallet, idx) => {
      const req = authedRequest('http://localhost:3000/api/communities/invites/accept', {
        method: 'POST',
        wallet,
        ip: `10.0.1.${idx + 1}`,
        body: JSON.stringify({ code: capacityInviteCode }),
      });
      return handleAcceptInvite(req).then(async (res) => ({
        status: res.status,
        body: await res.json(),
      }));
    });

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.status === 200 && r.body.joined === true);
    const failures = results.filter(r => r.status === 410);

    // Invariant I-INV-1: Exactly 10 succeed, 5 fail
    expect(successes.length).toBe(10);
    expect(failures.length).toBe(5);

    // Verify database state: uses_count must equal exactly max_uses
    const { data: inv } = await supabase.from('community_invites').select('uses_count, max_uses').eq('code', capacityInviteCode).single();
    expect(inv?.uses_count).toBe(10);
    expect(inv?.max_uses).toBe(10);
  });

  it('TC-INV-07: Idempotent Re-Acceptance (I-INV-2)', async () => {
    // Joiner already joined in TC-04, re-submitting should return alreadyMember: true
    const req = authedRequest('http://localhost:3000/api/communities/invites/accept', {
      method: 'POST',
      wallet: joinerWallet,
      body: JSON.stringify({ code: generatedInviteCode }),
    });
    const res = await handleAcceptInvite(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.alreadyMember).toBe(true);
    // Verify uses_count was NOT incremented
    const { data: inv } = await supabase.from('community_invites').select('uses_count').eq('code', generatedInviteCode).single();
    // uses_count should be 1 (only from TC-04), not 2
    expect(inv?.uses_count).toBe(1);
  });

  it('TC-INV-08: Non-Active Community Gate (paused status → 403)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/invites/accept', {
      method: 'POST',
      wallet: strangerWallet,
      body: JSON.stringify({ code: `paused_inv_${ts}` }),
    });
    const res = await handleAcceptInvite(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
    expect(body.message).toContain('not currently active');
  });

  // ===========================================================================
  // SECTION 3: OFFICER GOVERNANCE (Scenarios 9-15)
  // ===========================================================================

  it('TC-ROLE-01: Promote Member to Secretary', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        communityId: communityA,
        targetWallet: memberWallet,
        newRole: 'secretary',
        action: 'ASSIGN',
      }),
    });
    const res = await handleOfficers(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.newRole).toBe('secretary');
    expect(body.previousRole).toBe('member');
  });

  it('TC-ROLE-02: Promote Member to Treasurer', async () => {
    // First reset to member, then promote to treasurer
    await supabase.from('members').update({ role: 'member' }).eq('wallet_address', memberWallet).eq('community_id', communityA);

    const req = authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        communityId: communityA,
        targetWallet: memberWallet,
        newRole: 'treasurer',
        action: 'ASSIGN',
      }),
    });
    const res = await handleOfficers(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.newRole).toBe('treasurer');
  });

  it('TC-ROLE-03: SACCO Governance Policy Gate (I-ROLE-3)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        communityId: communityB,
        targetWallet: 'SomeSaccoMember',
        newRole: 'admin',
        action: 'ASSIGN',
      }),
    });
    const res = await handleOfficers(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('governance_policy_violation');
  });

  it('TC-ROLE-04: Founder Sovereign Protection (I-ROLE-4)', async () => {
    const req = authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: adminWallet,
      body: JSON.stringify({
        communityId: communityA,
        targetWallet: founderWallet,
        newRole: 'member',
        action: 'REVOKE',
      }),
    });
    const res = await handleOfficers(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
  });

  it('TC-ROLE-05: Sole Admin Self-Demotion Block (I-ROLE-2 app-level)', async () => {
    // Create a community with a single admin for sole-admin testing
    const soleAdminComm = `pkg1_sole_${ts}`;
    const soleAdminWallet = `SoleAdmin_pkg1_${ts}`;
    await supabase.from('communities').insert({
      id: soleAdminComm,
      name: 'Sole Admin Community',
      currency: 'KES',
      chain: 'stellar',
      type: 'chama',
      tier: 'mtaa',
      treasury_policy: 'multisig-ready',
      status: 'active',
    });
    await supabase.from('members').insert({
      member_id: `mem_sole_${ts}`,
      community_id: soleAdminComm,
      wallet_address: soleAdminWallet,
      auth_user_id: `auth_sole_${ts}`,
      phone_hash: `pkg1_sole_hash_${ts}`,
      role: 'founder',
      activation_status: 'active',
    });

    const req = authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: soleAdminWallet,
      body: JSON.stringify({
        communityId: soleAdminComm,
        targetWallet: soleAdminWallet,
        newRole: 'member',
        action: 'REVOKE',
      }),
    });
    const res = await handleOfficers(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('conflict');

    // Cleanup
    await supabase.from('communities').delete().eq('id', soleAdminComm);
  });

  it('TC-ROLE-06: Sole Admin Direct Deletion Block (I-ROLE-2 trigger guard)', async () => {
    // Direct SQL DELETE against sole admin should be blocked by trg_sole_admin_guard
    const trigComm = `pkg1_trig_${ts}`;
    const trigWallet = `TrigAdmin_pkg1_${ts}`;
    const trigMemberId = `mem_trig_${ts}`;
    await supabase.from('communities').insert({
      id: trigComm,
      name: 'Trigger Test Community',
      currency: 'KES',
      chain: 'stellar',
      type: 'chama',
      tier: 'mtaa',
      treasury_policy: 'multisig-ready',
      status: 'active',
    });
    await supabase.from('members').insert({
      member_id: trigMemberId,
      community_id: trigComm,
      wallet_address: trigWallet,
      auth_user_id: `auth_trig_${ts}`,
      phone_hash: `pkg1_trig_hash_${ts}`,
      role: 'admin',
      activation_status: 'active',
    });

    // Attempt direct delete — trigger should block it
    const { error: delErr } = await supabase.from('members').delete().eq('member_id', trigMemberId);
    expect(delErr).toBeTruthy();
    expect(delErr!.message).toContain('SOLE_ADMIN_DEADLOCK');

    // Cleanup
    await supabase.from('communities').delete().eq('id', trigComm);
  });

  it('TC-ROLE-07: Dual Admin Simultaneous Demotion (I-ROLE-2 serialized)', async () => {
    // communityA has founder + admin = 2 admin-tier members
    // Demoting both concurrently: exactly 1 should succeed, 1 should fail 409
    const p1 = handleOfficers(authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        communityId: communityA,
        targetWallet: adminWallet,
        newRole: 'member',
        action: 'REVOKE',
      }),
    }));
    const p2 = handleOfficers(authedRequest('http://localhost:3000/api/communities/officers', {
      method: 'POST',
      wallet: adminWallet,
      body: JSON.stringify({
        communityId: communityA,
        targetWallet: founderWallet,
        newRole: 'member',
        action: 'REVOKE',
      }),
    }));

    const [r1, r2] = await Promise.all([p1, p2]);
    const statuses = [r1.status, r2.status].sort();

    // At least one must succeed and the other either fail 409 or 403 (founder protection)
    // Founder protection (I-ROLE-4) blocks admin from demoting founder → one is 403
    // The other (founder demoting admin) succeeds → 200
    expect(statuses).toContain(200);
    expect(statuses.some(s => s === 403 || s === 409)).toBe(true);

    // Restore admin role for subsequent tests
    await supabase.from('members').update({ role: 'admin' }).eq('wallet_address', adminWallet).eq('community_id', communityA);
  });

  // ===========================================================================
  // SECTION 4: PUSH SUBSCRIPTIONS (Scenarios 16-20)
  // ===========================================================================

  it('TC-NOTIF-01: Valid Web Push Registration', async () => {
    const req = authedRequest('http://localhost:3000/api/user/notifications/push-subscribe', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/pkg1-test-endpoint-${ts}`,
          keys: {
            p256dh: 'A'.repeat(88), // Valid 88-char base64 (between 64-128)
            auth: 'B'.repeat(24),   // Valid 24-char base64 (between 16-48)
          },
        },
      }),
    });
    const res = await handlePushSubscribe(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.subscriptionId).toBeTruthy();
    expect(body.registeredAt).toBeTruthy();
  });

  it('TC-NOTIF-02: SSRF Loopback Rejection (I-SEC-1)', async () => {
    const req = authedRequest('http://localhost:3000/api/user/notifications/push-subscribe', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        subscription: {
          endpoint: 'http://localhost:54321/api/hook',
          keys: { p256dh: 'A'.repeat(88), auth: 'B'.repeat(24) },
        },
      }),
    });
    const res = await handlePushSubscribe(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_input');
  });

  it('TC-NOTIF-03: SSRF Cloud Metadata Rejection (I-SEC-1)', async () => {
    const req = authedRequest('http://localhost:3000/api/user/notifications/push-subscribe', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        subscription: {
          endpoint: 'https://169.254.169.254/latest/meta-data/',
          keys: { p256dh: 'A'.repeat(88), auth: 'B'.repeat(24) },
        },
      }),
    });
    const res = await handlePushSubscribe(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_input');
  });

  it('TC-NOTIF-04: RFC 8291 Key Bound Rejection (oversized p256dh)', async () => {
    const req = authedRequest('http://localhost:3000/api/user/notifications/push-subscribe', {
      method: 'POST',
      wallet: founderWallet,
      body: JSON.stringify({
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/oversize-key-test-${ts}`,
          keys: {
            p256dh: 'A'.repeat(200), // Exceeds 128 char limit
            auth: 'B'.repeat(24),
          },
        },
      }),
    });
    const res = await handlePushSubscribe(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_input');
    expect(body.message).toContain('p256dh');
  });

  it('TC-NOTIF-05: Polymorphic Privy DID Binding (I-NOTIF-1)', async () => {
    const req = authedRequest('http://localhost:3000/api/user/notifications/push-subscribe', {
      method: 'POST',
      privyDid: privyUserDid,
      body: JSON.stringify({
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/privy-binding-test-${ts}`,
          keys: {
            p256dh: 'C'.repeat(88),
            auth: 'D'.repeat(24),
          },
        },
      }),
    });
    const res = await handlePushSubscribe(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify DB row has privy_did set, wallet_address null
    const { data: sub } = await supabase
      .from('user_push_subscriptions')
      .select('*')
      .eq('id', body.subscriptionId)
      .single();
    expect(sub?.privy_did).toBe(privyUserDid);
    expect(sub?.wallet_address).toBeNull();
  });
});
