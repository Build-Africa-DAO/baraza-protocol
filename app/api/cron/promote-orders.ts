/**
 * Status promoter — moves payment orders one step along the happy path on
 * every cron tick. In production this is replaced by real mint + indexer
 * wait logic; for the MVP demo it simulates time passing.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
 * when scheduled via `vercel.json`. Manual calls in dev should set the same
 * header (or skip auth in dev mode).
 *
 * Schedule (see vercel.json):
 *   every 1 minute → each order advances one step → ~5 min to RECONCILED.
 *
 * Each tick processes promotions in REVERSE order so an order moves at most
 * one stage per tick (otherwise PAYMENT_CONFIRMED would fast-forward to
 * RECONCILED in a single tick).
 */

export const config = { runtime: 'edge' };

const PROMOTIONS: Array<{ from: string; to: string }> = [
  // Reverse order matters — see file header.
  { from: 'INDEXER_CONFIRMED', to: 'RECONCILED' },
  { from: 'MINT_CONFIRMED',    to: 'INDEXER_CONFIRMED' },
  { from: 'MINT_SUBMITTED',    to: 'MINT_CONFIRMED' },
  { from: 'MINT_QUEUED',       to: 'MINT_SUBMITTED' },
  { from: 'PAYMENT_CONFIRMED', to: 'MINT_QUEUED' },
];

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
}

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // Allow unauthenticated calls when no secret is configured (dev / preview
  // without the secret set). Production should always set CRON_SECRET.
  if (!cronSecret) return process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'production';
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${cronSecret}`;
}

function paymentOrderFilter(from: string): string {
  return new URLSearchParams({
    status: `eq.${from}`,
    provider_environment: 'eq.sandbox',
  }).toString();
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

  const results: Record<string, { promoted: number }> = {};
  for (const { from, to } of PROMOTIONS) {
    const promoted = await patchOrders(from, to);
    results[`${from}->${to}`] = { promoted };
  }

  const totalPromoted = Object.values(results).reduce((sum, r) => sum + r.promoted, 0);

  return json({
    ok: true,
    totalPromoted,
    breakdown: results,
    tickAt: new Date().toISOString(),
  }, { status: 200 });
}
