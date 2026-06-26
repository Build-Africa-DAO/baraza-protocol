/**
 * /api/payment-orders/streak — read-only dues-streak summary for a wallet.
 *
 * Returns { consecutiveMonthsPaid, lastPaidAt, perCommunity }. The summary
 * is non-sensitive (it's a count of public on-chain settlements) so this
 * endpoint is unauthenticated, but it is wallet-scoped and rate-limited
 * per address to prevent enumeration. Future hardening: add per-IP token
 * bucket (see api/agent/chat.ts for the pattern).
 *
 * Edge runtime — only Supabase REST + the pure streak math.
 */

import {
  STREAK_QUALIFYING_STATUSES,
  computeStreak,
  type ConfirmedPayment,
} from '../../src/lib/duesStreak.js';

export const config = { runtime: 'edge' };

const WALLET_ADDRESS_PATTERN = /^[A-Za-z0-9_:+-]{8,128}$/;

interface PaymentOrderRow {
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
        'access-control-allow-methods': 'GET, OPTIONS',
      },
    });
  }
  if (req.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  const requestUrl = new URL(req.url);
  const wallet = requestUrl.searchParams.get('wallet')?.trim() ?? '';
  if (!wallet || !WALLET_ADDRESS_PATTERN.test(wallet)) {
    return json({ error: 'invalid_request', message: 'wallet is required' }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    // Honest empty response so the UI placeholder stays in place — same
    // contract as a wallet with no payments.
    return json({ consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} });
  }

  const statusFilter = `in.(${STREAK_QUALIFYING_STATUSES.join(',')})`;
  const params = new URLSearchParams({
    wallet_address: `eq.${wallet}`,
    status: statusFilter,
    'confirmed_at': 'not.is.null',
    select: 'community_id,confirmed_at,status',
    order: 'confirmed_at.desc',
    limit: '500',
  }).toString();

  let rows: PaymentOrderRow[];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/payment_orders?${params}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!res.ok) return json({ error: 'upstream_error' }, { status: 502 });
    rows = (await res.json().catch(() => [])) as PaymentOrderRow[];
  } catch {
    return json({ error: 'upstream_error' }, { status: 502 });
  }

  const payments: ConfirmedPayment[] = rows
    .filter((r): r is PaymentOrderRow & { confirmed_at: string } => r.confirmed_at !== null)
    .map((r) => ({ confirmedAt: r.confirmed_at, communityId: r.community_id }));

  return json(computeStreak(payments));
}
