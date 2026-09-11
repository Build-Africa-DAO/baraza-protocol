// app/api/communities/invites/accept.ts
// Atomic Community Invite Acceptance via Single-Saga Stored Procedure
// Invariant I-INV-1: Capacity Conservation (uses_count ≤ max_uses under all concurrent interleavings)
// Invariant I-INV-2: Idempotent Re-Entrance (already-member short-circuit burns zero uses)
// Reference: Package 1 Theoretical Specification v2.0 §3 (accept_community_invite_atomic)

export const config = { runtime: 'edge' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { resolveCallerIdentity } from '../../_lib/auth-session';
import type { AcceptInviteResponse } from '../../user/types';

// In-Memory Rate Limiting Sliding Window (Max 10 attempts per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export function _resetRateLimitForTesting(): void {
  rateLimitMap.clear();
}

function checkRateLimit(ipOrKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipOrKey);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ipOrKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-wallet-signature, x-wallet-message, x-test-wallet-address, x-test-privy-did',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  // Rate Limiting Guard
  const clientIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return jsonResponse({
      error: 'rate_limited',
      message: 'Too many invite acceptance attempts. Please retry after 60 seconds.',
    }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  const identity = await resolveCallerIdentity(req, 'accept-invite');
  if (!identity || (!identity.walletAddress && !identity.privyDid)) {
    return jsonResponse({ error: 'unauthorized', message: 'Authentication required to accept an invite.' }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = (await req.json()) as { code?: string };
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code || !/^[a-zA-Z0-9_-]{6,32}$/.test(code)) {
    return jsonResponse({ error: 'invalid_code', message: 'Invalid invite code format.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Generate deterministic member_id and resolve identity vectors
  const memberId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const walletAddr = identity.walletAddress || `privy_wallet_${(identity.privyDid || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
  const authUid = identity.privyDid || identity.walletAddress || memberId;

  // Delegate to atomic stored procedure (zero-TOCTOU, zero partial failure)
  // The stored procedure uses SELECT ... FOR UPDATE to serialize concurrent redemptions
  const { data, error: rpcErr } = await supabase.rpc('accept_community_invite_atomic', {
    p_code: code,
    p_member_id: memberId,
    p_auth_user_id: authUid,
    p_wallet_address: walletAddr,
  });

  if (rpcErr) {
    const msg = rpcErr.message || '';

    if (msg.includes('INVITE_NOT_FOUND')) {
      return jsonResponse({ error: 'not_found', message: 'Invite link not found or invalid.' }, { status: 404 });
    }
    if (msg.includes('COMMUNITY_NOT_ACTIVE')) {
      return jsonResponse({ error: 'forbidden', message: 'Community is not currently active.' }, { status: 403 });
    }
    if (msg.includes('INVITE_EXPIRED')) {
      return jsonResponse({ error: 'expired', message: 'Invite link has expired.' }, { status: 410 });
    }
    if (msg.includes('INVITE_CAPACITY_EXHAUSTED')) {
      return jsonResponse({ error: 'capacity_exhausted', message: 'Invite link usage capacity has been exhausted.' }, { status: 410 });
    }

    return jsonResponse({ error: 'database_error', message: rpcErr.message }, { status: 500 });
  }

  // RPC returns array of rows; extract first result
  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    return jsonResponse({ error: 'database_error', message: 'Unexpected empty response from invite acceptance.' }, { status: 500 });
  }

  const response: AcceptInviteResponse = {
    ok: result.success,
    joined: !result.already_member,
    alreadyMember: result.already_member || undefined,
    communityId: result.community_id,
    role: result.role,
    message: result.already_member
      ? 'Caller is already an active member of this community. Invite capacity preserved.'
      : 'Successfully joined community via invite link.',
  };

  return jsonResponse(response);
}
