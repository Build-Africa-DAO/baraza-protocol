export const config = { runtime: 'edge' };

interface PaymentOrderRow {
  order_id: string;
  community_id: string;
  membership_tier_id: string | null;
  status: string;
  amount_expected: number;
  amount_received: number | null;
  currency: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  activation_secret_hash: string | null;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      ...(init?.headers ?? {}),
    },
  });
}

async function hashActivationSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 });

  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json({ error: 'supabase_not_configured' }, { status: 503 });

  const requestUrl = new URL(req.url);
  const orderId = requestUrl.searchParams.get('orderId') ?? '';
  const activationSecret = requestUrl.searchParams.get('activationSecret') ?? '';
  if (!orderId || !activationSecret) {
    return json({ error: 'invalid_request', message: 'orderId and activationSecret are required' }, { status: 400 });
  }

  const res = await fetch(
    `${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,community_id,membership_tier_id,status,amount_expected,amount_received,currency,confirmed_at,created_at,updated_at,activation_secret_hash`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  if (!res.ok) return json({ error: 'upstream_error' }, { status: 502 });

  const rows = (await res.json().catch(() => [])) as PaymentOrderRow[];
  const order = rows[0];
  if (!order) return json({ error: 'not_found' }, { status: 404 });
  if (!order.activation_secret_hash || await hashActivationSecret(activationSecret) !== order.activation_secret_hash) {
    return json({ error: 'forbidden' }, { status: 403 });
  }

  const { activation_secret_hash: _secretHash, ...safeOrder } = order;
  return json(safeOrder);
}
