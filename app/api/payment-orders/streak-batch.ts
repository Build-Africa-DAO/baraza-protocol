/**
 * /api/payment-orders/streak-batch — batched dues-streak summary.
 *
 * POST { wallets: string[] } → { results: Record<wallet, StreakResult> }
 *
 * Used by MemberDirectory so a community of N members triggers ONE round
 * trip instead of N. Streak math reuses the pure `computeStreak()` helper
 * shared with the single-wallet route.
 *
 * Wallet count is capped per request to prevent enumeration; callers that
 * need more should page.
 */

import {
  STREAK_QUALIFYING_STATUSES,
  computeStreak,
  type ConfirmedPayment,
  type StreakResult,
} from '../../src/lib/duesStreak.js';

export const config = { runtime: 'edge' };

const WALLET_ADDRESS_PATTERN = /^[A-Za-z0-9_:+-]{8,128}$/;
const MAX_WALLETS_PER_REQUEST = 100;

interface PaymentOrderRow {
  wallet_address: string;
  community_id: string;
  confirmed_at: string | null;
  status: string;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'private, max-age=30',
      ...(init?.headers ?? {}),
    },
  });
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

  let body: { wallets?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'invalid_request', message: 'JSON body required' }, { status: 400 });
  }

  if (!Array.isArray(body.wallets)) {
    return json({ error: 'invalid_request', message: 'wallets must be an array' }, { status: 400 });
  }

  const wallets = (body.wallets as unknown[])
    .filter((w): w is string => typeof w === 'string' && WALLET_ADDRESS_PATTERN.test(w))
    .slice(0, MAX_WALLETS_PER_REQUEST);

  if (wallets.length === 0) {
    return json({ results: {} });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    // Honest empty per-wallet so the UI placeholder stays — same contract
    // as wallets with no payments.
    const empty: Record<string, StreakResult> = {};
    for (const w of wallets) {
      empty[w] = { consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} };
    }
    return json({ results: empty });
  }

  // PostgREST IN filter — wallets are public addresses so URL-listing them
  // is fine. The status filter restricts to settlement-confirmed orders.
  const statusFilter = `in.(${STREAK_QUALIFYING_STATUSES.join(',')})`;
  const walletFilter = `in.(${wallets.map((w) => `"${w}"`).join(',')})`;
  const params = new URLSearchParams({
    wallet_address: walletFilter,
    status: statusFilter,
    'confirmed_at': 'not.is.null',
    select: 'wallet_address,community_id,confirmed_at,status',
    order: 'confirmed_at.desc',
    limit: '5000',
  }).toString();

  let rows: PaymentOrderRow[];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/payment_orders?${params}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return json({ error: 'upstream_error' }, { status: 502 });
    rows = (await res.json().catch(() => [])) as PaymentOrderRow[];
  } catch {
    return json({ error: 'upstream_error' }, { status: 502 });
  }

  // Partition rows by wallet, then compute streak per partition.
  const byWallet = new Map<string, ConfirmedPayment[]>();
  for (const row of rows) {
    if (!row.confirmed_at) continue;
    const list = byWallet.get(row.wallet_address) ?? [];
    list.push({ confirmedAt: row.confirmed_at, communityId: row.community_id });
    byWallet.set(row.wallet_address, list);
  }

  const results: Record<string, StreakResult> = {};
  for (const w of wallets) {
    const payments = byWallet.get(w) ?? [];
    results[w] = computeStreak(payments);
  }

  return json({ results });
}
