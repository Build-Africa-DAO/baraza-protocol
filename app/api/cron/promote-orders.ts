/**
 * Status promoter — moves payment orders one step along the happy path on
 * every cron tick.
 *
 * The MINT_QUEUED → MINT_SUBMITTED transition is the only step that
 * actually does real Stellar work: it submits a BRZA payment from the
 * distributor to the recipient's wallet, captures the tx hash as
 * `mint_signature`, and advances status. Other transitions are still
 * status walks until the on-chain indexer wait logic lands (downstream).
 *
 * Key-gated: if BRZA_DISTRIBUTOR_SECRET or BRZA_ISSUER_PUBLIC_KEY is
 * unset, the mint step no-ops and orders stay at MINT_QUEUED. The rest
 * of the chain still progresses.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
 * when scheduled via `vercel.json`. Manual calls in dev should set the same
 * header (or skip auth in dev mode).
 *
 * Each tick processes promotions in REVERSE order so an order moves at most
 * one stage per tick (otherwise PAYMENT_CONFIRMED would fast-forward to
 * RECONCILED in a single tick).
 */

import { mintBrzaPayment, type StellarNetworkName } from './_lib/stellar-mint';

// nodejs runtime — Stellar SDK isn't edge-compatible (Buffer + Node fetch).
export const config = { runtime: 'nodejs' };

const PROMOTIONS: Array<{ from: string; to: string }> = [
  // Reverse order matters — see file header.
  // MINT_QUEUED → MINT_SUBMITTED is NOT here; handled by mintQueuedOrders()
  // which writes mint_signature alongside the status PATCH.
  { from: 'INDEXER_CONFIRMED', to: 'RECONCILED' },
  { from: 'MINT_CONFIRMED',    to: 'INDEXER_CONFIRMED' },
  { from: 'MINT_SUBMITTED',    to: 'MINT_CONFIRMED' },
  { from: 'PAYMENT_CONFIRMED', to: 'MINT_QUEUED' },
];

interface MintQueuedOrder {
  order_id: string;
  wallet_address: string;
  brza_allocated: number | null;
}

const HORIZON_FALLBACKS: Record<StellarNetworkName, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
};

function resolveNetwork(): StellarNetworkName {
  const raw = process.env.STELLAR_NETWORK ?? process.env.VITE_STELLAR_NETWORK;
  return raw === 'mainnet' ? 'mainnet' : 'testnet';
}

function resolveHorizonUrl(network: StellarNetworkName): string {
  const configured = process.env.STELLAR_HORIZON_URL ?? process.env.VITE_STELLAR_HORIZON_URL;
  if (configured?.trim()) return configured.replace(/\/$/, '');
  return HORIZON_FALLBACKS[network];
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
}

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${cronSecret}`;
}

function paymentOrderFilter(from: string): string {
  const env =
    process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
      ? 'production'
      : 'sandbox';
  return new URLSearchParams({
    status: `eq.${from}`,
    provider_environment: `eq.${env}`,
  }).toString();
}

interface MintTickResult {
  attempted: number;
  minted: number;
  retriable_failed: number;
  terminal_failed: number;
  skipped_no_allocation: number;
  /** Set when the key guard fired and no orders were attempted. */
  skipped_reason?: 'distributor_secret_unset' | 'issuer_pk_unset' | 'supabase_unset';
}

async function fetchMintQueue(): Promise<MintQueuedOrder[]> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return [];

  const params = new URLSearchParams({
    status: 'eq.MINT_QUEUED',
    provider_environment:
      process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
        ? 'eq.production'
        : 'eq.sandbox',
    select: 'order_id,wallet_address,brza_allocated',
    // Bound the work per tick. Stellar SDK's single-op tx submission is the
    // bottleneck here; batching into massPay() is a follow-up.
    limit: '25',
  }).toString();

  const res = await fetch(`${url}/rest/v1/payment_orders?${params}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
    },
  });
  if (!res.ok) {
    console.warn('[promote-orders] fetchMintQueue failed', res.status);
    return [];
  }
  return (await res.json().catch(() => [])) as MintQueuedOrder[];
}

async function markMintSubmitted(orderId: string, txHash: string): Promise<void> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  await fetch(`${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'MINT_SUBMITTED', mint_signature: txHash }),
  });
}

async function markMintFailed(orderId: string, error: string): Promise<void> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  // MINT_FAILED_FINAL is in migration 010's intent-token unique-index
  // exclusion list, so the user can retry the original signed intent.
  await fetch(`${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      status: 'MINT_FAILED_FINAL',
      // metadata column is optional; if it doesn't exist on this project,
      // the PATCH still succeeds and the error is in logs.
    }),
  });
  console.warn('[promote-orders] mint terminal failure', orderId, error);
}

async function mintQueuedOrders(): Promise<MintTickResult> {
  const distributorSecret = process.env.BRZA_DISTRIBUTOR_SECRET;
  const issuerPublicKey = process.env.BRZA_ISSUER_PUBLIC_KEY;
  if (!distributorSecret) {
    return {
      attempted: 0,
      minted: 0,
      retriable_failed: 0,
      terminal_failed: 0,
      skipped_no_allocation: 0,
      skipped_reason: 'distributor_secret_unset',
    };
  }
  if (!issuerPublicKey) {
    return {
      attempted: 0,
      minted: 0,
      retriable_failed: 0,
      terminal_failed: 0,
      skipped_no_allocation: 0,
      skipped_reason: 'issuer_pk_unset',
    };
  }

  const network = resolveNetwork();
  const horizonUrl = resolveHorizonUrl(network);
  const queue = await fetchMintQueue();

  let minted = 0;
  let retriable_failed = 0;
  let terminal_failed = 0;
  let skipped_no_allocation = 0;

  for (const order of queue) {
    if (order.brza_allocated === null || order.brza_allocated <= 0) {
      // Legacy intents without pinned rates have NULL brza_allocated. Don't
      // mint an unknown amount — leave at MINT_QUEUED for manual reconciliation.
      skipped_no_allocation += 1;
      continue;
    }

    const result = await mintBrzaPayment({
      distributorSecret,
      issuerPublicKey,
      recipient: order.wallet_address,
      amount: String(order.brza_allocated),
      memo: order.order_id, // Stellar memo ≤28 bytes; order_id is ~26 chars
      horizonUrl,
      network,
    });

    if (result.ok) {
      await markMintSubmitted(order.order_id, result.txHash);
      minted += 1;
    } else if (result.retriable) {
      // Leave at MINT_QUEUED; next tick retries.
      retriable_failed += 1;
      console.warn('[promote-orders] mint retriable failure', order.order_id, result.error);
    } else {
      await markMintFailed(order.order_id, result.error);
      terminal_failed += 1;
    }
  }

  return {
    attempted: queue.length,
    minted,
    retriable_failed,
    terminal_failed,
    skipped_no_allocation,
  };
}

async function patchOrders(from: string, to: string): Promise<number> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return 0;

  const res = await fetch(
    `${url}/rest/v1/payment_orders?${paymentOrderFilter(from)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ status: to }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[promote-orders] PATCH failed', from, '→', to, res.status, detail);
    return 0;
  }

  const data = (await res.json().catch(() => [])) as unknown[];
  return Array.isArray(data) ? data.length : 0;
}

export default async function handler(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({
      ok: false,
      reason: 'supabase_not_configured',
      note: 'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel project settings to enable the promoter.',
    }, { status: 200 });
  }

  // Mint step runs FIRST so successful mints advance to MINT_SUBMITTED
  // before the status walker processes that bucket on the same tick.
  const mintResult = await mintQueuedOrders();

  const results: Record<string, { promoted: number }> = {};
  for (const { from, to } of PROMOTIONS) {
    const promoted = await patchOrders(from, to);
    results[`${from}->${to}`] = { promoted };
  }

  const totalPromoted = Object.values(results).reduce((sum, r) => sum + r.promoted, 0);

  return json({
    ok: true,
    totalPromoted,
    mint: mintResult,
    breakdown: results,
    tickAt: new Date().toISOString(),
  }, { status: 200 });
}
