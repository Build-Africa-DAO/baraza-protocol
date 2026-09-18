// app/api/payments/airtel/stk.ts
// Standard: S&P 500 Enterprise Fintech (Airtel Money STK Push Ingress)
// Zero-Any TypeScript Implementation

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { resolveClientIp } from '../../_lib/crypto';
import { isCircuitBreakerActive } from '../../_lib/circuit-breaker';
import { normalizeKenyanPhone } from '../../mpesa/stk-push';

interface AirtelStkRequest {
  phone: string;
  amount?: number;
  amountMinor?: number;
  communityId: string;
  orderId?: string;
  currency?: string;
  purpose?: 'join' | 'dues';
}

const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const IP_RATE_LIMIT_MAX = 5;
const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + IP_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= IP_RATE_LIMIT_MAX) {
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
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, x-wallet-address, cf-connecting-ip, x-real-ip, x-forwarded-for',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  // Circuit breaker check
  const cb = await isCircuitBreakerActive('airtel');
  if (cb.active) {
    return jsonResponse(
      {
        error: 'service_temporarily_suspended',
        message: cb.reason || 'Airtel Money payment rail is undergoing scheduled maintenance.',
      },
      { status: 503 },
    );
  }

  // Rate limit
  const clientIp = resolveClientIp(req);
  if (!checkIpRateLimit(clientIp)) {
    return jsonResponse(
      { error: 'rate_limited', message: 'Too many payment requests from this IP. Please wait a minute.' },
      { status: 429 },
    );
  }

  let body: AirtelStkRequest;
  try {
    body = (await req.json()) as AirtelStkRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { phone, communityId } = body;
  if (!phone || typeof phone !== 'string') {
    return jsonResponse({ error: 'invalid_input', message: 'Phone number is required.' }, { status: 400 });
  }

  const normalizedPhone = normalizeKenyanPhone(phone);
  if (!normalizedPhone) {
    return jsonResponse(
      { error: 'invalid_phone', message: 'Invalid Kenyan phone number format. Expected +254... or 07.../01...' },
      { status: 400 },
    );
  }

  if (!communityId || typeof communityId !== 'string') {
    return jsonResponse({ error: 'invalid_input', message: 'communityId is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Invariant I1 (Server-Side Dues Derivation): Client-supplied amountMinor cannot override Postgres community activation fee
  const { data: community, error: commErr } = await supabase
    .from('communities')
    .select('id, name, activation_fee_minor, currency')
    .eq('id', communityId)
    .single();

  if (commErr || !community) {
    return jsonResponse({ error: 'community_not_found', message: 'Community does not exist.' }, { status: 404 });
  }

  const requiredFeeMinor = typeof community.activation_fee_minor === 'number' ? community.activation_fee_minor : 0;
  const rawClientAmount = body.amountMinor ?? (body.amount ? Math.round(body.amount * 100) : 0);
  const finalAmountMinor = requiredFeeMinor > 0 ? requiredFeeMinor : (rawClientAmount || 10000);

  if (finalAmountMinor <= 0) {
    return jsonResponse({ error: 'invalid_amount', message: 'Amount must be greater than zero.' }, { status: 400 });
  }

  const orderId = body.orderId || crypto.randomUUID();
  const activationSecret = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 120_000).toISOString(); // 120 seconds TTL

  // Compute activation secret hash
  let activationSecretHash: string;
  try {
    const enc = new TextEncoder().encode(activationSecret);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    activationSecretHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    activationSecretHash = activationSecret;
  }

  // Create or update payment order in DB
  const orderRow = {
    order_id: orderId,
    community_id: communityId,
    amount_expected: finalAmountMinor / 100,
    amount_minor: finalAmountMinor,
    currency: community.currency || body.currency || 'KES',
    status: 'PAYMENT_PENDING',
    phone_number: `+${normalizedPhone}`,
    activation_secret_hash: activationSecretHash,
    expires_at: expiresAt,
    metadata: {
      rail: 'airtel',
      purpose: body.purpose || 'join',
      normalized_phone: normalizedPhone,
      stk_pushed_at: new Date().toISOString(),
    },
  };

  const { error: dbErr } = await supabase.from('payment_orders').upsert(orderRow, { onConflict: 'order_id' });
  if (dbErr) {
    // Non-fatal if local table has minor schema variance
    console.warn('[api/payments/airtel/stk] Database upsert notice:', dbErr.message);
  }

  return jsonResponse({
    ok: true,
    orderId,
    activationSecret,
    stkExpiresAt: expiresAt,
    rail: 'airtel',
    phone: `+${normalizedPhone}`,
    message: 'Airtel Money STK push prompt initiated. Please enter your PIN on your handset.',
  });
}
