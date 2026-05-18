/**
 * M-Pesa simulator — sandbox-only endpoint that fakes the
 * Africa's Talking webhook lifecycle for local + preview deploys.
 *
 * Real flow (per MVP_ARCHITECTURE.md §7):
 *   client → POST /api/mpesa/simulate
 *          → write payment_order row (Supabase)
 *          → write payment_event row (Supabase)
 *          → transition order to PAYMENT_CONFIRMED
 *          → enqueue mint_job
 *
 * MVP-stub behaviour (this file):
 *   - Validates request shape
 *   - Generates a deterministic-looking order_id
 *   - Writes a payment_order row to Supabase IF SUPABASE_SERVICE_ROLE_KEY is set
 *   - Returns 200 with the order_id and a status of PAYMENT_CONFIRMED
 *
 * Production hook-up will replace this with the real Africa's Talking webhook
 * receiver — same response contract, different signature verification.
 */

export const config = { runtime: 'edge' };

interface SimulateRequest {
  phone: string;
  communityId: string;
  tierId?: string;
  amount: number;
  currency?: string;
}

interface SimulateResponse {
  orderId: string;
  status: 'PAYMENT_PENDING' | 'PAYMENT_CONFIRMED';
  amount: number;
  currency: string;
  simulatedAt: string;
  persisted: boolean;
  note: string;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

function badRequest(message: string): Response {
  return json({ error: 'invalid_request', message }, { status: 400 });
}

function generateOrderId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ord_sim_${ts}_${rand}`;
}

async function persistOrder(input: {
  orderId: string;
  request: SimulateRequest;
}): Promise<boolean> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return false;

  // Direct fetch against Supabase REST so we don't need the JS SDK in Edge.
  const res = await fetch(`${url}/rest/v1/payment_orders`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      order_id: input.orderId,
      community_id: input.request.communityId,
      membership_tier_id: input.request.tierId ?? null,
      provider: 'africastalking',
      provider_environment: 'sandbox',
      amount_expected: input.request.amount,
      currency: input.request.currency ?? 'KES',
      status: 'PAYMENT_CONFIRMED',
      confirmed_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    // Surface the underlying message to logs; degrade gracefully on the wire.
    const detail = await res.text().catch(() => '');
    console.warn('[mpesa-simulate] Supabase insert failed:', res.status, detail);
    return false;
  }
  return true;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  let body: SimulateRequest;
  try {
    body = (await req.json()) as SimulateRequest;
  } catch {
    return badRequest('Body must be valid JSON');
  }

  if (!body.phone || typeof body.phone !== 'string') {
    return badRequest('phone is required');
  }
  if (!body.communityId || typeof body.communityId !== 'string') {
    return badRequest('communityId is required');
  }
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return badRequest('amount must be a positive number');
  }

  const orderId = generateOrderId();
  const persisted = await persistOrder({ orderId, request: body });

  const response: SimulateResponse = {
    orderId,
    status: 'PAYMENT_CONFIRMED',
    amount: body.amount,
    currency: body.currency ?? 'KES',
    simulatedAt: new Date().toISOString(),
    persisted,
    note: persisted
      ? 'Simulator persisted to Supabase payment_orders. Real M-Pesa webhook hook-up replaces this in production.'
      : 'Simulator in stateless mode (SUPABASE_SERVICE_ROLE_KEY not set). The order_id is ephemeral.',
  };

  return json(response, {
    status: 200,
    headers: { 'access-control-allow-origin': '*' },
  });
}
