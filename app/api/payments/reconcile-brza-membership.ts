export const config = { runtime: 'edge' };

interface ReconcileRequest {
  orderId: string;
}

interface PaymentOrderRow {
  order_id: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  amount_expected: number;
  currency: string;
  expires_at: string | null;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
}

function bad(message: string, status = 400): Response {
  return json({ error: 'invalid_request', message }, { status });
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.PAYMENT_ADAPTER_PROXY_SECRET;
  return Boolean(secret && req.headers.get('authorization') === `Bearer ${secret}`);
}

function supabaseHeaders(serviceKey: string): HeadersInit {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'content-type': 'application/json',
  };
}

async function patchOrder(
  url: string,
  serviceKey: string,
  orderId: string,
  update: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: supabaseHeaders(serviceKey),
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error('Could not update payment order.');
}

function readProviderAmount(data: Record<string, unknown>): number | null {
  const raw = data.kes_amount ?? data.amount_received ?? data.amount;
  const amount = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });
  if (!isAuthorized(req)) return bad('BRZA payment reconciliation is restricted to trusted server calls.', 401);

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const kotaniKey = process.env.KOTANI_PAY_API_KEY;
  if (!supabaseUrl || !serviceKey || !kotaniKey) return bad('BRZA payment reconciliation is not configured.', 503);

  let body: ReconcileRequest;
  try {
    body = (await req.json()) as ReconcileRequest;
  } catch {
    return bad('Body must be valid JSON.');
  }
  if (!/^ord_brza_[A-Za-z0-9_-]+$/.test(body.orderId ?? '')) return bad('A valid BRZA orderId is required.');

  const orderRes = await fetch(
    `${supabaseUrl}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(body.orderId)}&select=order_id,provider,provider_reference,status,amount_expected,currency,expires_at`,
    { headers: supabaseHeaders(serviceKey) },
  );
  if (!orderRes.ok) return bad('Could not load BRZA payment order.', 502);
  const order = ((await orderRes.json().catch(() => [])) as PaymentOrderRow[])[0];
  if (!order) return bad('BRZA payment order was not found.', 404);
  if (order.provider !== 'kotani') return bad('Payment order is not a Kotani BRZA order.', 409);
  if (!order.provider_reference) return bad('Payment order is missing a Kotani reference.', 409);
  if (order.status !== 'PAYMENT_PENDING') {
    return json({ orderId: order.order_id, status: order.status, changed: false });
  }

  if (order.expires_at && Date.parse(order.expires_at) <= Date.now()) {
    await patchOrder(supabaseUrl, serviceKey, order.order_id, { status: 'PAYMENT_EXPIRED' });
    return json({ orderId: order.order_id, status: 'PAYMENT_EXPIRED', changed: true });
  }

  const kotaniBase = process.env.KOTANI_API_BASE?.replace(/\/$/, '') || 'https://api.kotanipay.com';
  let providerRes: Response;
  try {
    providerRes = await fetch(`${kotaniBase}/v1/status/${encodeURIComponent(order.provider_reference)}`, {
      headers: { Authorization: `Bearer ${kotaniKey}` },
    });
  } catch {
    return bad('Kotani status request failed.', 502);
  }
  const providerData = (await providerRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (!providerRes.ok) return bad(String(providerData.message ?? 'Kotani status request failed.'), 502);

  const providerStatus = String(providerData.status ?? '').toLowerCase();
  if (providerStatus === 'failed' || providerStatus === 'cancelled' || providerStatus === 'expired') {
    const status = providerStatus === 'expired' ? 'PAYMENT_EXPIRED' : 'PAYMENT_FAILED';
    await patchOrder(supabaseUrl, serviceKey, order.order_id, { status });
    return json({ orderId: order.order_id, status, changed: true });
  }
  if (providerStatus !== 'completed') {
    return json({ orderId: order.order_id, status: 'PAYMENT_PENDING', changed: false });
  }

  const amountReceived = readProviderAmount(providerData);
  if (order.currency !== 'KES' || amountReceived === null || amountReceived !== Number(order.amount_expected)) {
    await patchOrder(supabaseUrl, serviceKey, order.order_id, {
      status: 'AMOUNT_MISMATCH',
      ...(amountReceived === null ? {} : { amount_received: amountReceived }),
    });
    return json({ orderId: order.order_id, status: 'AMOUNT_MISMATCH', changed: true });
  }

  await patchOrder(supabaseUrl, serviceKey, order.order_id, {
    status: 'PAYMENT_CONFIRMED',
    amount_received: amountReceived,
    confirmed_at: new Date().toISOString(),
  });
  return json({ orderId: order.order_id, status: 'PAYMENT_CONFIRMED', changed: true });
}
