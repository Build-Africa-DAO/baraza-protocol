export const config = { runtime: 'edge' };

interface VerifyStellarRequest {
  // Preferred: server-signed token that binds communityId+amountXlm at intent creation time.
  // Required on mainnet. On testnet, falls back to legacy fields when absent.
  intentToken?: string;
  txHash: string;
  // Legacy fields — testnet/sandbox only when intentToken is not provided
  communityId?: string;
  amountXlm?: number;
}

interface HorizonTransaction {
  hash: string;
  ledger: number;
  successful: boolean;
}

interface HorizonOperation {
  type: string;
  asset_type?: string;
  amount?: string;
  from?: string;
  to?: string;
}

type PersistOrderResult =
  | { status: 'persisted' }
  | { status: 'not_configured' }
  | { status: 'duplicate'; detail: string }
  | { status: 'failed'; detail: string };

const DEFAULT_TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
const DEFAULT_MAINNET_HORIZON = 'https://horizon.stellar.org';

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
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stellarNetwork(): 'testnet' | 'mainnet' | 'custom' {
  const raw = process.env.STELLAR_NETWORK ?? process.env.VITE_STELLAR_NETWORK;
  if (raw === 'mainnet' || raw === 'custom') return raw;
  return 'testnet';
}

function horizonUrl(): string {
  const configured = process.env.STELLAR_HORIZON_URL ?? process.env.VITE_STELLAR_HORIZON_URL;
  if (configured?.trim()) return configured.replace(/\/$/, '');
  return stellarNetwork() === 'mainnet' ? DEFAULT_MAINNET_HORIZON : DEFAULT_TESTNET_HORIZON;
}

function providerEnvironment(): 'sandbox' | 'production' {
  return stellarNetwork() === 'mainnet' ? 'production' : 'sandbox';
}

function configuredTreasuryAccount(): string | null {
  const account = process.env.STELLAR_TREASURY_ACCOUNT?.trim() ?? '';
  if (!account) {
    if (stellarNetwork() === 'mainnet') {
      throw new Error('STELLAR_TREASURY_ACCOUNT is required for Stellar mainnet verification.');
    }
    return null;
  }
  if (!/^G[A-Z2-7]{55}$/.test(account)) {
    throw new Error('STELLAR_TREASURY_ACCOUNT must be a valid Stellar G-account.');
  }
  return account;
}

function generateOrderId(): string {
  return `ord_stellar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateActivationSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashActivationSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyIntentToken(
  token: string,
): Promise<{ communityId: string; amountXlm: number } | null> {
  const secret = process.env.STELLAR_INTENT_SECRET;
  if (!secret) return null;

  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const encodedPayload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigPad = sig.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - sig.length % 4) % 4);
  let sigBytes: Uint8Array;
  try {
    const bin = atob(sigPad);
    sigBytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (base64url(sigBytes) !== sig) return null;

  const signature = sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as ArrayBuffer;
  const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(encodedPayload));
  if (!valid) return null;

  const payPad =
    encodedPayload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encodedPayload.length % 4) % 4);
  try {
    const parsed = JSON.parse(atob(payPad)) as {
      communityId: string;
      amountXlm: number;
      expiresAt: string;
    };
    if (new Date(parsed.expiresAt) < new Date()) return null;
    if (!parsed.communityId || !Number.isFinite(parsed.amountXlm) || parsed.amountXlm <= 0) return null;
    return { communityId: parsed.communityId, amountXlm: parsed.amountXlm };
  } catch {
    return null;
  }
}

async function fetchHorizonJson<T>(path: string): Promise<T> {
  const res = await fetch(`${horizonUrl()}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Stellar Horizon returned ${res.status}`);
  return (await res.json()) as T;
}

async function verifyNativePayment(
  txHash: string,
  expectedAmount: number,
  treasuryAccount: string | null,
): Promise<{ ledger: number; amount: number }> {
  const transaction = await fetchHorizonJson<HorizonTransaction>(`/transactions/${txHash}`);
  if (!transaction.successful) throw new Error('Stellar transaction was not successful.');

  const operations = await fetchHorizonJson<{ _embedded?: { records?: HorizonOperation[] } }>(
    `/transactions/${txHash}/operations`,
  );
  const payment = operations._embedded?.records?.find((operation) => {
    const amount = Number(operation.amount);
    const isNativePayment = operation.type === 'payment' && operation.asset_type === 'native';
    const reachesTreasury = !treasuryAccount || operation.to === treasuryAccount;
    return isNativePayment && reachesTreasury && Number.isFinite(amount) && amount >= expectedAmount;
  });

  if (!payment?.amount) {
    throw new Error(treasuryAccount
      ? 'Transaction does not contain enough XLM paid to the configured treasury account.'
      : 'Transaction does not contain enough native XLM payment value.');
  }

  return { ledger: transaction.ledger, amount: Number(payment.amount) };
}

async function persistOrder(input: {
  orderId: string;
  activationSecret: string;
  communityId: string;
  txHash: string;
  amountXlm: number;
}): Promise<PersistOrderResult> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { status: 'not_configured' };

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
      community_id: input.communityId,
      provider: 'stellar',
      provider_environment: providerEnvironment(),
      provider_reference: input.txHash,
      activation_secret_hash: await hashActivationSecret(input.activationSecret),
      amount_expected: input.amountXlm,
      amount_received: input.amountXlm,
      currency: 'XLM',
      status: 'PAYMENT_CONFIRMED',
      confirmed_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[stellar-verify-payment] Supabase insert failed:', res.status, detail);
    if (res.status === 409 || /duplicate key|23505|payment_orders_provider_reference_unique/i.test(detail)) {
      return { status: 'duplicate', detail };
    }
    return { status: 'failed', detail };
  }
  return { status: 'persisted' };
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

  let body: VerifyStellarRequest;
  try {
    body = (await req.json()) as VerifyStellarRequest;
  } catch {
    return bad('Body must be valid JSON');
  }

  const txHash = body.txHash?.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(txHash)) return bad('Enter a valid 64-character Stellar transaction hash.');

  // Resolve communityId and amountXlm from the signed intent (preferred) or legacy fields (testnet only).
  let communityId: string;
  let amountXlm: number;

  if (body.intentToken) {
    const claim = await verifyIntentToken(body.intentToken);
    if (!claim) return bad('Payment intent token is invalid or expired.');
    communityId = claim.communityId;
    amountXlm = claim.amountXlm;
  } else if (stellarNetwork() !== 'mainnet') {
    if (!body.communityId) return bad('communityId is required');
    if (!Number.isFinite(body.amountXlm) || (body.amountXlm ?? 0) <= 0) return bad('amountXlm must be greater than zero.');
    communityId = body.communityId;
    amountXlm = body.amountXlm!;
  } else {
    return bad('intentToken is required for production Stellar payments.');
  }

  let treasuryAccount: string | null;
  try {
    treasuryAccount = configuredTreasuryAccount();
  } catch (err) {
    return json({
      error: 'stellar_verifier_not_configured',
      message: err instanceof Error ? err.message : 'Stellar treasury verification is not configured.',
    }, { status: 503 });
  }

  try {
    const proof = await verifyNativePayment(txHash, amountXlm, treasuryAccount);
    const orderId = generateOrderId();
    const activationSecret = generateActivationSecret();
    const persistResult = await persistOrder({
      orderId,
      activationSecret,
      communityId,
      txHash,
      amountXlm: proof.amount,
    });

    if (persistResult.status === 'duplicate') {
      return json({
        error: 'stellar_payment_reused',
        message: 'This Stellar transaction hash is already attached to a Baraza payment order.',
      }, { status: 409 });
    }

    if (persistResult.status === 'failed') {
      return json({
        error: 'stellar_order_persist_failed',
        message: 'Stellar payment was verified, but the payment order could not be recorded.',
      }, { status: 502 });
    }

    const persisted = persistResult.status === 'persisted';

    return json({
      orderId: persisted ? orderId : `ord_local_stellar_${Date.now().toString(36)}`,
      activationSecret: persisted ? activationSecret : null,
      status: 'PAYMENT_CONFIRMED',
      rail: 'stellar',
      txHash,
      ledger: proof.ledger,
      amountXlm: proof.amount,
      persisted,
      horizonUrl: horizonUrl(),
    });
  } catch (err) {
    return json({
      error: 'stellar_verification_failed',
      message: err instanceof Error ? err.message : 'Could not verify Stellar payment.',
    }, { status: 422 });
  }
}
