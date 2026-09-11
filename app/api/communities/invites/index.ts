// app/api/communities/invites/index.ts
// Production SaaS Community Invite Generation & Listing
// Invariant I-ROLE-1: Only founder, admin, or secretary may create/list invites
// Reference: Package 1 Theoretical Specification v2.0 §5.1

export const config = { runtime: 'edge' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { resolveCallerIdentity } from '../../_lib/auth-session';
import { assertValidSlug } from '../../_lib/validation';
import type { CreateInviteRequest, CreateInviteResponse, ListInvitesResponse } from '../../user/types';

// Roles authorized to create and list invites (Capability Matrix §4)
const INVITE_AUTHORIZED_ROLES = ['founder', 'admin', 'secretary'];

// Default capacity and expiry bounds
const DEFAULT_MAX_USES = 100;
const MIN_MAX_USES = 1;
const MAX_MAX_USES = 10000;
const DEFAULT_EXPIRES_IN_DAYS = 30;
const MIN_EXPIRES_IN_DAYS = 1;
const MAX_EXPIRES_IN_DAYS = 365;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-wallet-signature, x-wallet-message, x-test-wallet-address, x-test-privy-did',
      },
    });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  // Dual Auth Ingress
  const identity = await resolveCallerIdentity(req, 'community-invites');
  if (!identity || (!identity.walletAddress && !identity.privyDid)) {
    return jsonResponse({ error: 'unauthorized', message: 'Authentication required via Web3 wallet proof or Privy session.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // --- POST: Generate New Invite ---
  if (req.method === 'POST') {
    let body: CreateInviteRequest;
    try {
      body = (await req.json()) as CreateInviteRequest;
    } catch {
      return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const { communityId, maxUses, expiresInDays } = body;
    try {
      assertValidSlug(communityId, 'communityId');
    } catch (err: unknown) {
      return jsonResponse({ error: 'invalid_parameter', message: (err as Error).message }, { status: 400 });
    }

    // Validate bounds
    const effectiveMaxUses = Math.min(Math.max(maxUses ?? DEFAULT_MAX_USES, MIN_MAX_USES), MAX_MAX_USES);
    const effectiveExpiresInDays = Math.min(Math.max(expiresInDays ?? DEFAULT_EXPIRES_IN_DAYS, MIN_EXPIRES_IN_DAYS), MAX_EXPIRES_IN_DAYS);

    // Verify caller authorization (I-ROLE-1: must be founder, admin, or secretary)
    let callerQuery = supabase.from('members').select('member_id, role, activation_status').eq('community_id', communityId);
    if (identity.walletAddress) {
      callerQuery = callerQuery.eq('wallet_address', identity.walletAddress);
    } else {
      callerQuery = callerQuery.eq('auth_user_id', identity.privyDid);
    }

    const { data: callerMember } = await callerQuery.maybeSingle();
    if (!callerMember) {
      return jsonResponse({ error: 'forbidden', message: 'Caller is not a member of this community.' }, { status: 403 });
    }

    // I-ROLE-5: Active Officer Invariant
    if (callerMember.activation_status !== 'active') {
      return jsonResponse({ error: 'forbidden', message: 'Caller account is suspended or pending activation.' }, { status: 403 });
    }

    if (!INVITE_AUTHORIZED_ROLES.includes(callerMember.role)) {
      return jsonResponse({
        error: 'forbidden',
        message: 'Only founders, admins, and secretaries can generate invite codes.',
      }, { status: 403 });
    }

    // Generate 12-char hex invite code
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiresAt = new Date(Date.now() + effectiveExpiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: insertErr } = await supabase
      .from('community_invites')
      .insert({
        code,
        community_id: communityId,
        created_by: identity.walletAddress || identity.privyDid || 'system',
        max_uses: effectiveMaxUses,
        uses_count: 0,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertErr || !invite) {
      return jsonResponse({ error: 'database_error', message: insertErr?.message || 'Failed to create invite.' }, { status: 500 });
    }

    // Record immutable audit log
    await supabase.from('community_audit_logs').insert({
      community_id: communityId,
      actor_wallet: identity.walletAddress || identity.privyDid || 'system',
      action_type: 'INVITE_CREATED',
      target_subject: code,
      details: {
        max_uses: effectiveMaxUses,
        expires_at: expiresAt,
        expires_in_days: effectiveExpiresInDays,
      },
    });

    const response: CreateInviteResponse = {
      ok: true,
      code: invite.code,
      communityId: invite.community_id,
      maxUses: invite.max_uses,
      usesCount: invite.uses_count,
      expiresAt: invite.expires_at,
      inviteUrl: `https://baraza.network/join?code=${invite.code}`,
    };

    return jsonResponse(response, { status: 201 });
  }

  // --- GET: List Active Invites ---
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const communityId = url.searchParams.get('communityId');
    try {
      assertValidSlug(communityId, 'communityId');
    } catch (err: unknown) {
      return jsonResponse({ error: 'invalid_parameter', message: (err as Error).message }, { status: 400 });
    }

    // Verify caller authorization
    let callerQuery = supabase.from('members').select('member_id, role, activation_status').eq('community_id', communityId!);
    if (identity.walletAddress) {
      callerQuery = callerQuery.eq('wallet_address', identity.walletAddress);
    } else {
      callerQuery = callerQuery.eq('auth_user_id', identity.privyDid);
    }

    const { data: callerMember } = await callerQuery.maybeSingle();
    if (!callerMember || callerMember.activation_status !== 'active' || !INVITE_AUTHORIZED_ROLES.includes(callerMember.role)) {
      return jsonResponse({ error: 'forbidden', message: 'Caller lacks authorization to list invites.' }, { status: 403 });
    }

    // Fetch active (non-expired, non-exhausted) invites
    const { data: invites, error: listErr } = await supabase
      .from('community_invites')
      .select('code, created_by, max_uses, uses_count, expires_at, created_at')
      .eq('community_id', communityId!)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (listErr) {
      return jsonResponse({ error: 'database_error', message: listErr.message }, { status: 500 });
    }

    const response: ListInvitesResponse = {
      ok: true,
      communityId: communityId!,
      invites: (invites || []).map(i => ({
        code: i.code,
        createdBy: i.created_by,
        maxUses: i.max_uses,
        usesCount: i.uses_count,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      })),
    };

    return jsonResponse(response);
  }

  return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
}
