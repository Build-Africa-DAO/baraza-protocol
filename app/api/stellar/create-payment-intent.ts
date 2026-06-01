export const config = { runtime: 'edge' };

interface CreateIntentRequest {
  communityId: string;
  amountXlm: number;
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

function bad(message: string, status = 400): Response {
  return json({ error: 'invalid_request', message }, { status });
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signPayload(encodedPayload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return base64url(new Uint8Array(sig));
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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  const secret = process.env.STELLAR_INTENT_SECRET;
  if (!secret) {
    return json({
      error: 'intent_signing_not_configured',
      message: 'Set STELLAR_INTENT_SECRET to enable secure payment intent binding.',
    }, { status: 503 });
  }

  let body: CreateIntentRequest;
  try {
    body = (await req.json()) as CreateIntentRequest;
  } catch {
    return bad('Body must be valid JSON');
  }

  if (!body.communityId?.trim()) return bad('communityId is required');
  if (!Number.isFinite(body.amountXlm) || body.amountXlm <= 0) return bad('amountXlm must be greater than zero');

  const nonce = base64url(crypto.getRandomValues(new Uint8Array(12)));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const payload = JSON.stringify({
    communityId: body.communityId.trim(),
    amountXlm: body.amountXlm,
    expiresAt,
    nonce,
  });
  const encodedPayload = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const sig = await signPayload(encodedPayload, secret);

  return json({
    intentToken: `${encodedPayload}.${sig}`,
    amountXlm: body.amountXlm,
    expiresAt,
  }, { status: 201 });
}
