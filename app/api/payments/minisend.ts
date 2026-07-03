export const config = { runtime: 'edge' };

interface MinisendRequest {
  phone: string;
  usdcAmount: string;
  chain: 'base' | 'polygon' | 'celo';
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });
  if (!isAuthorized(req)) return bad('Payment adapter proxy is restricted to trusted server calls.', 401);
  const key = process.env.MINISEND_API_KEY;
  if (!key) return bad('Minisend is not configured.', 503);

  let body: MinisendRequest;
  try {
    body = (await req.json()) as MinisendRequest;
  } catch {
    return bad('Body must be valid JSON.');
  }
  if (!body.phone || !body.usdcAmount || !['base', 'polygon', 'celo'].includes(body.chain)) {
    return bad('phone, usdcAmount, and a supported chain are required.');
  }

  const base = process.env.MINISEND_API_BASE?.replace(/\/$/, '') || 'https://api.minisend.xyz';
  const response = await fetch(`${base}/v1/offramp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ phone: body.phone, amount: body.usdcAmount, chain: body.chain, currency: 'KES' }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return bad(data.message ?? 'Minisend request failed.', 502);
  return json({ reference: data.id, kesAmount: data.kes_amount });
}
