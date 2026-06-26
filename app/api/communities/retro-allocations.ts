import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

/**
 * Public read of a settled retro round's allocations.
 *
 * GET ?roundId=...                 → single round's allocations
 * GET ?communityId=...             → most recent settled round for the community
 *
 * Public — no auth. retro_allocations RLS allows anyone to read; this route
 * is a JSON convenience that also returns the round metadata in the same
 * payload so the UI doesn't need two fetches.
 */

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
}

export function OPTIONS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}

interface AllocationRow {
  recipient_wallet: string;
  brza_allocated: number;
  baseline_brza: number;
  multiplier_brza: number;
  vote_share: number;
  settlement_status: 'pending' | 'confirmed' | 'failed';
  settlement_tx: string | null;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const roundId = url.searchParams.get('roundId');
  const communityId = url.searchParams.get('communityId');

  if (!roundId && !communityId) {
    return new Response(
      JSON.stringify({ error: 'roundId or communityId required' }),
      { status: 400, headers: corsHeaders() },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(
      JSON.stringify({
        round: null,
        allocations: [],
        status: 'Supabase not configured.',
      }),
      { headers: corsHeaders() },
    );
  }

  // Resolve round
  let roundRow: {
    id: string;
    community_id: string;
    period_start: string;
    period_end: string;
    pool_brza: number;
    status: string;
    voting_closes_at: string;
  } | null = null;

  if (roundId) {
    const { data } = await supabase
      .from('retro_rounds')
      .select('id, community_id, period_start, period_end, pool_brza, status, voting_closes_at')
      .eq('id', roundId)
      .maybeSingle();
    roundRow = (data as typeof roundRow) ?? null;
  } else if (communityId) {
    const { data } = await supabase
      .from('retro_rounds')
      .select('id, community_id, period_start, period_end, pool_brza, status, voting_closes_at')
      .eq('community_id', communityId)
      .in('status', ['allocated', 'settled'])
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    roundRow = (data as typeof roundRow) ?? null;
  }

  if (!roundRow) {
    return new Response(JSON.stringify({ round: null, allocations: [] }), {
      headers: corsHeaders(),
    });
  }

  const { data: allocRows } = await supabase
    .from('retro_allocations')
    .select(
      'recipient_wallet, brza_allocated, baseline_brza, multiplier_brza, vote_share, settlement_status, settlement_tx',
    )
    .eq('round_id', roundRow.id)
    .order('brza_allocated', { ascending: false });

  return new Response(
    JSON.stringify({
      round: roundRow,
      allocations: (allocRows ?? []) as AllocationRow[],
    }),
    { headers: corsHeaders() },
  );
}


export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return OPTIONS();
  if (req.method === 'GET') return GET(req);
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: corsHeaders() });
}
