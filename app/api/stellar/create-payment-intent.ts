export const config = { runtime: 'edge' };

interface CreateIntentRequest {
  communityId: string;
  amountXlm: number;
}

// MVP rate pinned at intent creation so verify-payment derives a reproducible
// brza_allocated regardless of price drift. Replace with a live oracle call
// when one is wired in. Override via XLM_USD_RATE_MVP env var for staging.
const XLM_USD_RATE_DEFAULT = 0.10;

// The BRZA phase price is counsel-gated and intentionally not committed to
// the repo (see brza/constants.ts — all phase prices ship unset). Deployments
// provide it via the BRZA_PRICE_USD env var; intent creation returns 503
// until it is configured. This edge handler must stay free of Vite-only
// import.meta.env modules, so it reads process.env directly.
function resolveBrzaPriceUsd(): number | null {
  const fromEnv = process.env.BRZA_PRICE_USD;
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function resolveXlmUsdRate(): number {
  const fromEnv = process.env.XLM_USD_RATE_MVP;
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return XLM_USD_RATE_DEFAULT;
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

// btoa() is Latin-1 only — encode to UTF-8 bytes first so non-ASCII
// communityId values (Arabic, Swahili, etc.) don't throw a DOMException.
function base64urlFromString(str: string): string {
  return base64url(new TextEncoder().encode(str));
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
  // Pin both rates in the signed payload. verify-payment uses these to derive
  // brza_allocated from the actual amountXlm Horizon settled (may differ from
  // body.amountXlm if the user overpaid).
  const xlmUsdRate = resolveXlmUsdRate();
  const brzaPriceUsd = resolveBrzaPriceUsd();
  if (brzaPriceUsd === null) {
    return json({
      error: 'pricing_not_configured',
      message: 'Set BRZA_PRICE_USD to enable payment intent creation.',
    }, { status: 503 });
  }
  const payload = JSON.stringify({
    communityId: body.communityId.trim(),
    amountXlm: body.amountXlm,
    xlmUsdRate,
    brzaPriceUsd,
    expiresAt,
    nonce,
  });
  const encodedPayload = base64urlFromString(payload);
  const sig = await signPayload(encodedPayload, secret);

  return json({
    intentToken: `${encodedPayload}.${sig}`,
    amountXlm: body.amountXlm,
    xlmUsdRate,
    brzaPriceUsd,
    expiresAt,
  }, { status: 201 });
}
