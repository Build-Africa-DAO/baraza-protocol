// app/api/user/notifications/push-subscribe.ts
// Multi-Channel Web Push Subscription Registration (RFC 8291 / RFC 8292)
// Anti-SSRF: Rejects loopback, link-local, RFC 1918 endpoints
// Invariant I-NOTIF-1: Polymorphic DID Binding (wallet | privy | profile FK)
// Invariant I-SEC-1: Anti-SSRF Ingress Guard
// Reference: Package 1 Theoretical Specification v2.0 §5.4

export const config = { runtime: 'edge' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { resolveCallerIdentity } from '../../_lib/auth-session';
import { assertValidHttpsUrl, HttpError } from '../../_lib/validation';
import type { PushSubscriptionRequest, PushSubscriptionResponse } from '../types';

// RFC 8291 key length bounds (base64-encoded)
const P256DH_MIN_LEN = 64;
const P256DH_MAX_LEN = 128;
const AUTH_MIN_LEN = 16;
const AUTH_MAX_LEN = 48;

// W3C Push API endpoint maximum length (audit remediation F-01: 2048 not 512)
const ENDPOINT_MAX_LENGTH = 2048;

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

  // Dual Auth Ingress
  const identity = await resolveCallerIdentity(req, 'push-subscribe');
  if (!identity || (!identity.walletAddress && !identity.privyDid)) {
    return jsonResponse({ error: 'unauthorized', message: 'Authentication required to register push subscription.' }, { status: 401 });
  }

  let body: PushSubscriptionRequest;
  try {
    body = (await req.json()) as PushSubscriptionRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { subscription, userAgent } = body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return jsonResponse({ error: 'invalid_input', message: 'subscription.endpoint and subscription.keys are required.' }, { status: 400 });
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  // Anti-SSRF validation (assertValidHttpsUrl with 2048-char ceiling per audit F-01)
  try {
    const validatedEndpoint = assertValidHttpsUrl(endpoint, 'endpoint', ENDPOINT_MAX_LENGTH);
    if (!validatedEndpoint) {
      return jsonResponse({ error: 'invalid_input', message: 'endpoint must be a non-empty HTTPS URL.' }, { status: 400 });
    }
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: 'invalid_input', message: err.message }, { status: err.statusCode });
    }
    return jsonResponse({ error: 'invalid_input', message: (err as Error).message }, { status: 400 });
  }

  // RFC 8291 cryptographic key bounds clamping
  if (!p256dh || typeof p256dh !== 'string') {
    return jsonResponse({ error: 'invalid_input', message: 'subscription.keys.p256dh is required.' }, { status: 400 });
  }
  if (p256dh.length < P256DH_MIN_LEN || p256dh.length > P256DH_MAX_LEN) {
    return jsonResponse({
      error: 'invalid_input',
      message: `p256dh key must be between ${P256DH_MIN_LEN} and ${P256DH_MAX_LEN} characters (RFC 8291).`,
    }, { status: 400 });
  }

  if (!auth || typeof auth !== 'string') {
    return jsonResponse({ error: 'invalid_input', message: 'subscription.keys.auth is required.' }, { status: 400 });
  }
  if (auth.length < AUTH_MIN_LEN || auth.length > AUTH_MAX_LEN) {
    return jsonResponse({
      error: 'invalid_input',
      message: `auth key must be between ${AUTH_MIN_LEN} and ${AUTH_MAX_LEN} characters (RFC 8291).`,
    }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Resolve optional user_profile_id FK for polymorphic binding
  let userProfileId: string | null = null;
  if (identity.walletAddress) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('wallet_address', identity.walletAddress)
      .maybeSingle();
    if (profile) userProfileId = profile.id;
  } else if (identity.privyDid) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('privy_did', identity.privyDid)
      .maybeSingle();
    if (profile) userProfileId = profile.id;
  }

  // Idempotent UPSERT on conflict(endpoint)
  // updated_at is explicitly set since the trigger only fires on UPDATE, not on INSERT conflict resolution
  const upsertRow = {
    wallet_address: identity.walletAddress || null,
    privy_did: identity.privyDid || null,
    user_profile_id: userProfileId,
    endpoint: endpoint.trim(),
    p256dh,
    auth,
    user_agent: userAgent || req.headers.get('user-agent') || null,
    updated_at: new Date().toISOString(),
  };

  const { data: result, error: upsertErr } = await supabase
    .from('user_push_subscriptions')
    .upsert(upsertRow, { onConflict: 'endpoint' })
    .select('id, created_at')
    .single();

  if (upsertErr || !result) {
    return jsonResponse({ error: 'database_error', message: upsertErr?.message || 'Failed to register push subscription.' }, { status: 500 });
  }

  const response: PushSubscriptionResponse = {
    ok: true,
    subscriptionId: result.id,
    registeredAt: result.created_at,
  };

  return jsonResponse(response, { status: 201 });
}
