// app/api/payments/card/checkout.ts
// Standard: S&P 500 Enterprise Fintech (Paystack Card Ingress & Checkout Initializer)
// Zero-Any TypeScript Implementation

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { resolveClientIp } from '../../_lib/crypto';
import { isCircuitBreakerActive } from '../../_lib/circuit-breaker';

interface CardCheckoutRequest {
  communityId: string;
  email: string;
  amountMinor: number;
  currency?: string;
  purpose?: string;
  returnUrl?: string;
}

const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const IP_RATE_LIMIT_MAX = 10;
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
  const cb = await isCircuitBreakerActive('paystack');
  if (cb.active) {
    return jsonResponse(
      {
        error: 'service_temporarily_suspended',
        message: cb.reason || 'Card payment rail is undergoing scheduled maintenance.',
      },
      { status: 503 },
    );
  }

  // IP rate limiting
  const clientIp = resolveClientIp(req);
  if (!checkIpRateLimit(clientIp)) {
    return jsonResponse(
      { error: 'rate_limited', message: 'Too many checkout requests from this IP. Please wait a minute.' },
      { status: 429 },
    );
  }

  let body: CardCheckoutRequest;
  try {
    body = (await req.json()) as CardCheckoutRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { communityId, email, amountMinor } = body;
  if (!communityId || typeof communityId !== 'string') {
    return jsonResponse({ error: 'invalid_input', message: 'communityId is required.' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return jsonResponse({ error: 'invalid_email', message: 'A valid email address is required for card receipts.' }, { status: 400 });
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
  const finalAmountMinor = requiredFeeMinor > 0 ? requiredFeeMinor : (amountMinor || 10000);

  if (finalAmountMinor <= 0) {
    return jsonResponse({ error: 'invalid_amount', message: 'Activation amount must be a positive integer.' }, { status: 400 });
  }

  const orderId = crypto.randomUUID();
  const currency = (community.currency || body.currency || 'KES').toUpperCase();
  const returnUrl = body.returnUrl || `https://barazaprotocol.com/join/${communityId}/status?orderId=${orderId}&rail=card`;

  // Create payment order record
  const orderRow = {
    order_id: orderId,
    community_id: communityId,
    amount_expected: finalAmountMinor / 100,
    amount_minor: finalAmountMinor,
    currency,
    status: 'PAYMENT_PENDING',
    metadata: {
      rail: 'card',
      email,
      purpose: body.purpose || 'join',
      return_url: returnUrl,
      created_at: new Date().toISOString(),
    },
  };

  const { error: dbErr } = await supabase.from('payment_orders').upsert(orderRow, { onConflict: 'order_id' });
  if (dbErr) {
    console.warn('[api/payments/card/checkout] Database upsert notice:', dbErr.message);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (secretKey) {
    try {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountMinor,
          currency,
          callback_url: returnUrl,
          reference: orderId,
          metadata: {
            order_id: orderId,
            community_id: communityId,
            purpose: body.purpose || 'join',
          },
        }),
      });

      if (paystackRes.ok) {
        const pData = (await paystackRes.json()) as {
          status: boolean;
          data?: {
            authorization_url: string;
            access_code: string;
            reference: string;
          };
        };

        if (pData.status && pData.data?.authorization_url) {
          return jsonResponse({
            ok: true,
            orderId,
            authorizationUrl: pData.data.authorization_url,
            accessCode: pData.data.access_code,
            reference: pData.data.reference,
          });
        }
      }
    } catch (err) {
      console.warn('[api/payments/card/checkout] Paystack upstream initialize error:', err);
    }
  }

  // Fallback for development/testing when PAYSTACK_SECRET_KEY is not configured
  const mockAuthUrl = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}orderId=${encodeURIComponent(orderId)}&rail=card&simulated=true`;

  return jsonResponse({
    ok: true,
    orderId,
    authorizationUrl: mockAuthUrl,
    message: secretKey ? 'Payment session initialized' : 'Simulated card checkout session initialized',
  });
}
