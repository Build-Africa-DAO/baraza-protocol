import { createClient } from '@supabase/supabase-js';
import { computeWeeklyRetroPool } from '../../src/lib/brza/retroRounds.js';
import { getWalletProof, verifyWalletProof } from '../_lib/wallet-proof.js';

export const config = { runtime: 'nodejs' };

/**
 * Admin-only API for opening a per-community retro round.
 *
 * POST  → opens a new round for the community for the upcoming weekly period.
 *         Body: { communityId, periodStart?, periodEnd?, votingClosesAt? }
 *         Defaults to a round covering the past 7 days with voting closing in
 *         48h after period end.
 * GET   → returns the active round (status in 'open'|'voting') for a community.
 *         Query: ?communityId=...
 *
 * Both methods require an admin wallet in the `X-Admin-Wallet` header, matched
 * against the `ADMIN_WALLETS` env var. No signing — same convention as
 * /api/akili/filings.ts.
 */

function parseAdminWallets(): string[] {
  return (process.env.ADMIN_WALLETS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAuthorized(wallet: string | null): boolean {
  if (!wallet) return false;
  const allowed = parseAdminWallets();
  if (allowed.length === 0) return false;
  return allowed.includes(wallet);
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function corsHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    ...(extra ?? {}),
  };
}

export function OPTIONS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Wallet, X-Member-Wallet, X-Wallet-Address, X-Wallet-Message, X-Wallet-Signature',
    },
  });
}

export async function GET(req: Request): Promise<Response> {
  // Read is public — retro_rounds.public_read RLS policy mirrors this.
  // Members need to see the active round before deciding whether to vote
  // or open a new one.
  const url = new URL(req.url);
  const communityId = url.searchParams.get('communityId');
  if (!communityId) {
    return new Response(JSON.stringify({ error: 'communityId required' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(
      JSON.stringify({
        active: null,
        status: 'Supabase not configured. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to read live rounds.',
      }),
      { headers: corsHeaders() },
    );
  }

  const { data, error } = await supabase
    .from('retro_rounds')
    .select('*')
    .eq('community_id', communityId)
    .in('status', ['open', 'voting'])
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
  return new Response(JSON.stringify({ active: data ?? null }), { headers: corsHeaders() });
}

interface OpenRoundBody {
  communityId?: string;
  periodStart?: string;
  periodEnd?: string;
  votingClosesAt?: string;
}

export async function POST(req: Request): Promise<Response> {
  // Two-path auth:
  //   - Active member of the community (X-Member-Wallet) — any member can open
  //     a round; the one-active-per-community partial unique index is the
  //     throttle that prevents spam.
  //   - Admin wallet (X-Admin-Wallet) — fallback for ops/scripts.
  const adminWallet = req.headers.get('x-admin-wallet');
  const memberWallet = req.headers.get('x-member-wallet');
  const isAdmin = isAuthorized(adminWallet);

  if (!isAdmin && !memberWallet) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), {
      status: 401,
      headers: corsHeaders(),
    });
  }

  const proofWallet = isAdmin ? adminWallet : memberWallet;
  if (!verifyWalletProof(getWalletProof(req, proofWallet), proofWallet, 'retro-open')) {
    return new Response(JSON.stringify({ error: 'wallet_proof_required' }), {
      status: 401,
      headers: corsHeaders(),
    });
  }

  let body: OpenRoundBody;
  try {
    body = (await req.json()) as OpenRoundBody;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (!body.communityId) {
    return new Response(JSON.stringify({ error: 'communityId required' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: 'supabase_unavailable',
        message: 'Supabase not configured. Cannot persist round.',
      }),
      { status: 503, headers: corsHeaders() },
    );
  }

  // Active-member check — only required when the caller isn't an admin.
  // Admins can open a round in any community (ops path); members can only
  // open in communities they belong to.
  let openerWallet: string | null = adminWallet ?? memberWallet ?? null;
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('id, status')
      .eq('community_id', body.communityId)
      .eq('wallet_address', memberWallet)
      .eq('status', 'active')
      .maybeSingle();
    if (!membership) {
      return new Response(
        JSON.stringify({
          error: 'not_active_member',
          message: 'Only active members of this community can open a retro round.',
        }),
        { status: 403, headers: corsHeaders() },
      );
    }
    openerWallet = memberWallet;
  }

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  const periodStart = body.periodStart ?? new Date(now - sevenDaysMs).toISOString();
  const periodEnd = body.periodEnd ?? new Date(now).toISOString();
  const votingClosesAt =
    body.votingClosesAt ?? new Date(now + fortyEightHoursMs).toISOString();

  // Pull membership counts to size the pool.
  const [{ count: communityActive }, { count: totalActive }] = await Promise.all([
    supabase
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', body.communityId)
      .eq('status', 'active'),
    supabase
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  const poolBrza = computeWeeklyRetroPool(
    communityActive ?? 0,
    totalActive ?? 0,
  );

  const { data, error } = await supabase
    .from('retro_rounds')
    .insert({
      community_id: body.communityId,
      period_start: periodStart,
      period_end: periodEnd,
      voting_closes_at: votingClosesAt,
      pool_brza: poolBrza,
      status: 'open',
      opened_by: openerWallet,
    })
    .select()
    .single();

  if (error) {
    // The one-active-per-community partial unique index will fire here when
    // a round is already open or in voting. Surface a useful 409.
    if (error.code === '23505') {
      return new Response(
        JSON.stringify({
          error: 'round_already_active',
          message:
            'A round is already open or voting for this community. Settle it first.',
        }),
        { status: 409, headers: corsHeaders() },
      );
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  return new Response(JSON.stringify({ round: data }), { headers: corsHeaders() });
}


export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return OPTIONS();
  if (req.method === 'GET') return GET(req);
  if (req.method === 'POST') return POST(req);
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: corsHeaders() });
}
