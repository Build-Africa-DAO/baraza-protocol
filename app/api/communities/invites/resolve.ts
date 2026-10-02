// app/api/communities/invites/resolve.ts
// Public Community Invite Code Resolver
// Resolves invite metadata and associated community identity without requiring prior authentication.
// Enables branded invite landing screens (e.g. Canva Creators Kenya) before the member signs in.

export const config = { runtime: 'edge' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').trim();

  if (!code || !/^[a-zA-Z0-9_-]{6,64}$/.test(code)) {
    return jsonResponse({ error: 'invalid_code', message: 'Valid invite code required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: invite, error: inviteErr } = await supabase
    .from('community_invites')
    .select('code, community_id, max_uses, uses_count, expires_at, created_at')
    .eq('code', code)
    .maybeSingle();

  if (inviteErr) {
    return jsonResponse({ error: 'database_error', message: inviteErr.message }, { status: 500 });
  }

  if (!invite) {
    // Fallback: Check if code directly matches a public community id (e.g. from public share link)
    const { data: directComm, error: directCommErr } = await supabase
      .from('communities')
      .select('id, name, type, description, image_url, member_count, currency, membership_fee, fee_type')
      .eq('id', code)
      .maybeSingle();

    if (!directCommErr && directComm) {
      return jsonResponse({
        ok: true,
        invite: {
          code: directComm.id,
          communityId: directComm.id,
          maxUses: 0,
          usesCount: directComm.member_count ?? 0,
          expiresAt: null,
        },
        community: {
          id: directComm.id,
          name: directComm.name,
          type: directComm.type,
          description: directComm.description,
          imageUrl: directComm.image_url,
          memberCount: directComm.member_count ?? 0,
          currency: directComm.currency ?? 'KES',
          membershipFee: directComm.membership_fee ?? 0,
          feeType: directComm.fee_type ?? 'free',
        },
      });
    }

    return jsonResponse({ error: 'not_found', message: 'Invite code does not exist.' }, { status: 404 });
  }

  const isExpired = invite.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false;
  if (isExpired) {
    return jsonResponse({ error: 'invite_expired', message: 'This invite code has expired.' }, { status: 410 });
  }

  if (invite.max_uses > 0 && invite.uses_count >= invite.max_uses) {
    return jsonResponse({ error: 'invite_exhausted', message: 'This invite code has reached its maximum uses.' }, { status: 410 });
  }

  const { data: community, error: commErr } = await supabase
    .from('communities')
    .select('id, name, type, description, image_url, member_count, currency, membership_fee, fee_type')
    .eq('id', invite.community_id)
    .maybeSingle();

  if (commErr || !community) {
    return jsonResponse({ error: 'community_not_found', message: 'Associated community could not be found.' }, { status: 404 });
  }

  return jsonResponse({
    ok: true,
    invite: {
      code: invite.code,
      communityId: invite.community_id,
      maxUses: invite.max_uses,
      usesCount: invite.uses_count,
      expiresAt: invite.expires_at,
    },
    community: {
      id: community.id,
      name: community.name,
      type: community.type,
      description: community.description,
      imageUrl: community.image_url,
      memberCount: community.member_count ?? 0,
      currency: community.currency ?? 'KES',
      membershipFee: community.membership_fee ?? 0,
      feeType: community.fee_type ?? 'free',
    },
  });
}
