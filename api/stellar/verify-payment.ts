export const config = { runtime: 'edge' };

interface VerifyStellarRequest {
  communityId: string;
  txHash: string;
  amountXlm: number;
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

async function fetchHorizonJson<T>(path: string): Promise<T> {
  const res = await fetch(`${horizonUrl()}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Stellar Horizon returned ${res.status}`);
  return (await res.json()) as T;
}

async function verifyNativePayment(txHash: string, expectedAmount: number): Promise<{ ledger: number; amount: number }> {
  const transaction = await fetchHorizonJson<HorizonTransaction>(`/transactions/${txHash}`);
  if (!transaction.successful) throw new Error('Stellar transaction was not successful.');

  const operations = await fetchHorizonJson<{ _embedded?: { records?: HorizonOperation[] } }>(
    `/transactions/${txHash}/operations`,
  );
  const treasuryAccount = process.env.STELLAR_TREASURY_ACCOUNT?.trim();
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
}): Promise<boolean> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return false;

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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  let body: VerifyStellarRequest;
  try {
    body = (await req.json()) as VerifyStellarRequest;
  } catch {
    return bad('Body must be valid JSON');
  }

  const txHash = body.txHash?.trim().toLowerCase();
  if (!body.communityId) return bad('communityId is required');
  if (!/^[a-f0-9]{64}$/.test(txHash)) return bad('Enter a valid 64-character Stellar transaction hash.');
  if (!Number.isFinite(body.amountXlm) || body.amountXlm <= 0) return bad('amountXlm must be greater than zero.');

  try {
    const proof = await verifyNativePayment(txHash, body.amountXlm);
    const orderId = generateOrderId();
    const activationSecret = generateActivationSecret();
    const persisted = await persistOrder({
      orderId,
      activationSecret,
      communityId: body.communityId,
      txHash,
      amountXlm: proof.amount,
    });

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
