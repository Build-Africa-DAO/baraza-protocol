export const config = { runtime: 'edge' };

interface PayoutRow {
  payout_id: string;
  community_id: string;
  amount: number;
  currency: string;
  status: string;
  reviewer: string | null;
  transaction_reference: string | null;
  created_at: string;
  approved_at: string | null;
  // Present on the underlying table for internal bookkeeping only — never
  // surfaced on the receipt. Listed here so buildPayoutReceipt() can be
  // tested against rows that carry them, proving they get filtered out.
  member_wallet_address?: string | null;
  member_id_hash?: string | null;
}

export interface PayoutReceipt {
  payoutId: string;
  communityId: string;
  amount: number;
  currency: string;
  status: string;
  reviewer: string;
  transactionReference: string;
  createdAt: string;
  approvedAt: string | null;
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

const ALLOWED_STATUSES = new Set(['pending', 'approved', 'rejected', 'completed', 'failed']);

/**
 * Builds a durable, admin-facing payout receipt containing only the fields
 * required for verification — amount, status, reviewer, and transaction
 * reference. Deliberately excludes member wallet addresses, id hashes, or
 * any other private member data that may exist on the raw payout row.
 *
 * Payouts that haven't been reviewed or settled yet (the "missing" state)
 * get safe placeholder values rather than null/undefined so downstream
 * renderers (CSV, mobile, desktop) never show a blank cell.
 */
export function buildPayoutReceipt(row: PayoutRow): PayoutReceipt {
  return {
    payoutId: row.payout_id,
    communityId: row.community_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reviewer: row.reviewer ?? 'unassigned',
    transactionReference: row.transaction_reference ?? 'pending',
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? null,
  };
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Renders a sanitized receipt as a two-row CSV (headers + values). Plain
 * text response — no client-side JS required, so it downloads/opens
 * identically on mobile and desktop browsers.
 */
export function toCsv(receipt: PayoutReceipt): string {
  const headers = [
    'Payout ID',
    'Community ID',
    'Amount',
    'Currency',
    'Status',
    'Reviewer',
    'Transaction Reference',
    'Created At',
    'Approved At',
  ];
  const values = [
    receipt.payoutId,
    receipt.communityId,
    String(receipt.amount),
    receipt.currency,
    receipt.status,
    receipt.reviewer,
    receipt.transactionReference,
    receipt.createdAt,
    receipt.approvedAt ?? '',
  ];
  return [headers.map(csvEscape).join(','), values.map(csvEscape).join(',')].join('\n');
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
  const payoutId = requestUrl.searchParams.get('payoutId') ?? '';
  const format = (requestUrl.searchParams.get('format') ?? 'json').toLowerCase();
  if (!payoutId) return bad('payoutId is required');
  if (format !== 'json' && format !== 'csv') return bad('format must be json or csv');

  const res = await fetch(
    `${url}/rest/v1/payouts?payout_id=eq.${encodeURIComponent(payoutId)}&select=payout_id,community_id,amount,currency,status,reviewer,transaction_reference,created_at,approved_at`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  if (!res.ok) return json({ error: 'upstream_error' }, { status: 502 });

  const rows = (await res.json().catch(() => [])) as PayoutRow[];
  const payout = rows[0];
  if (!payout) return json({ error: 'not_found' }, { status: 404 });
  if (!ALLOWED_STATUSES.has(payout.status)) {
    return json({ error: 'unknown_status', message: `Unrecognized payout status: ${payout.status}` }, { status: 500 });
  }

  const receipt = buildPayoutReceipt(payout);

  if (format === 'csv') {
    return new Response(toCsv(receipt), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="payout-receipt-${receipt.payoutId}.csv"`,
        'access-control-allow-origin': '*',
      },
    });
  }

  return json(receipt);
}
