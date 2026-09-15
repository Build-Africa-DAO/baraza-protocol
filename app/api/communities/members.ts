// app/api/communities/members.ts
// Standard: S&P 500 Enterprise Fintech (Community Member Roster Route)
// Package: 1 — SaaS Workspace Community Identity & Governance
// Governing Spec: POST_PR89_ADJUSTED_THEORETICAL_SOLUTION_DEFINITION.md §3 [BE-7]

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { resolveCallerIdentity } from '../_lib/auth-session';
import { assertValidSlug } from '../_lib/validation';

export interface CommunityMemberRecord {
  memberId: string;
  walletAddress: string;
  role: string;
  activationStatus: string;
  displayName: string;
  avatarUrl: string;
  votingWeight: number;
  joinedAt: string;
  activatedAt?: string | null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, x-wallet-address, x-wallet-signature, x-wallet-message, x-test-wallet-address, x-test-privy-did, x-test-user-profile-id',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const communityId = url.searchParams.get('communityId');
  if (!communityId) {
    return jsonResponse({ error: 'invalid_request', message: 'communityId query parameter is required.' }, { status: 400 });
  }

  try {
    assertValidSlug(communityId, 'communityId');
  } catch (err: unknown) {
    return jsonResponse({ error: 'invalid_parameter', message: (err as Error).message }, { status: 400 });
  }

  const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);
  const limit = isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 100);

  const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);
  const offset = isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

  const roleFilter = url.searchParams.get('role')?.toLowerCase();

  const supabase = getSupabaseAdmin();

  // 1. Verify community existence and privacy status (is_public)
  const { data: community, error: commErr } = await supabase
    .from('communities')
    .select('id, is_public')
    .eq('id', communityId)
    .maybeSingle();

  if (commErr) {
    return jsonResponse({ error: 'database_error', message: commErr.message }, { status: 500 });
  }

  if (!community) {
    return jsonResponse({ error: 'community_not_found', message: 'Community does not exist.' }, { status: 404 });
  }

  // 2. Enforce authorization if community is private (is_public === false)
  if (community.is_public === false) {
    const identity = await resolveCallerIdentity(req, 'community-members');
    if (!identity || (!identity.walletAddress && !identity.privyDid && !identity.userProfileId)) {
      return jsonResponse({ error: 'unauthorized', message: 'Authentication required for private community roster.' }, { status: 401 });
    }

    let isMember = false;
    if (identity.walletAddress) {
      const { data: mem } = await supabase
        .from('members')
        .select('member_id, activation_status')
        .eq('community_id', communityId)
        .eq('wallet_address', identity.walletAddress)
        .maybeSingle();
      if (mem && (mem.activation_status === 'ACTIVE' || mem.activation_status === 'active')) {
        isMember = true;
      }
    }

    if (!isMember && identity.userProfileId) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('id', identity.userProfileId)
        .maybeSingle();
      if (prof?.wallet_address) {
        const { data: mem } = await supabase
          .from('members')
          .select('member_id, activation_status')
          .eq('community_id', communityId)
          .eq('wallet_address', prof.wallet_address)
          .maybeSingle();
        if (mem && (mem.activation_status === 'ACTIVE' || mem.activation_status === 'active')) {
          isMember = true;
        }
      }
    }

    if (!isMember) {
      return jsonResponse(
        { error: 'forbidden', message: 'Access to member roster of private community is restricted to active members.' },
        { status: 403 },
      );
    }
  }

  // 3. Query members for community
  let query = supabase
    .from('members')
    .select('member_id, wallet_address, role, activation_status, activated_at, created_at', { count: 'exact' })
    .eq('community_id', communityId);

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: memberRows, count, error: memberErr } = await query;
  if (memberErr) {
    return jsonResponse({ error: 'database_error', message: memberErr.message }, { status: 500 });
  }

  const membersList = memberRows || [];
  if (membersList.length === 0) {
    return jsonResponse({
      ok: true,
      communityId,
      total: count ?? 0,
      limit,
      offset,
      members: [],
    });
  }

  const wallets = Array.from(new Set(membersList.map((m) => m.wallet_address).filter(Boolean)));

  // 4. Fetch profile data (displayName, avatarUrl)
  let profileMap = new Map<string, { display_name?: string; avatar_url?: string }>();
  if (wallets.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('wallet_address, display_name, avatar_url')
      .in('wallet_address', wallets);

    if (profiles) {
      profileMap = new Map(profiles.map((p) => [p.wallet_address, p]));
    }
  }

  // 5. Fetch membership voting weights
  let votingWeightMap = new Map<string, number>();
  if (wallets.length > 0) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('wallet_address, voting_weight')
      .eq('community_id', communityId)
      .in('wallet_address', wallets);

    if (memberships) {
      votingWeightMap = new Map(memberships.map((m) => [m.wallet_address, Number(m.voting_weight) || 1]));
    }
  }

  // 6. Construct enriched member roster
  const enriched: CommunityMemberRecord[] = membersList.map((m) => {
    const prof = profileMap.get(m.wallet_address);
    const weight = votingWeightMap.get(m.wallet_address) ?? 1;

    return {
      memberId: m.member_id,
      walletAddress: m.wallet_address,
      role: m.role,
      activationStatus: m.activation_status,
      displayName: prof?.display_name || '',
      avatarUrl: prof?.avatar_url || '',
      votingWeight: weight,
      joinedAt: m.created_at,
      activatedAt: m.activated_at,
    };
  });

  return jsonResponse({
    ok: true,
    communityId,
    total: count ?? enriched.length,
    limit,
    offset,
    members: enriched,
  });
}

export { handler as GET, handler as OPTIONS };
