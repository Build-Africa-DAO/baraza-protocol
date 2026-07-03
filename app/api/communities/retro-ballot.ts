import { createClient } from '@supabase/supabase-js';
import { validateBallot, type RetroVote } from '../../src/lib/brza/retroRounds.js';
import { getWalletProof, verifyWalletProof } from '../_lib/wallet-proof.js';

export const config = { runtime: 'nodejs' };

/**
 * Member-facing ballot submission for the active retro round.
 *
 * GET   ?communityId=...  → returns the active round (status in 'open'|'voting'),
 *                            the recipient roster (active community members), and
 *                            the caller's existing ballot if they've already
 *                            voted.
 * POST  → submits or replaces a ballot for the active round.
 *         Body: { communityId, voterWallet, allocations }
 *
 * Auth: the voter's wallet is passed in `X-Voter-Wallet`. Unsigned today (same
 * convention as the rest of the repo); upgrade to signed proof when the
 * payment-intent signature pattern is generalised.
 *
 * Voter weight: today we insert with the column default (1.0) and let
 * settlement decide whether to trust or recompute. When the voter-profile
 * producer lands, this route will compute weight at submission time and pin
 * it onto the row — that's the correct anti-streak-gaming behaviour.
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
      'Access-Control-Allow-Methods': 'POST, GET',
      'Access-Control-Allow-Headers': 'Content-Type, X-Voter-Wallet, X-Wallet-Address, X-Wallet-Message, X-Wallet-Signature',
    },
  });
}

interface RecipientRow {
  wallet: string;
  joinedAt: string;
}

interface BallotGetResponse {
  round: {
    id: string;
    status: 'open' | 'voting' | 'allocated' | 'settled';
    pool_brza: number;
    period_start: string;
    period_end: string;
    voting_closes_at: string;
  } | null;
  recipients: RecipientRow[];
  existingBallot: Record<string, number> | null;
  status?: string;
}

export async function GET(req: Request): Promise<Response> {
  const voterWallet = req.headers.get('x-voter-wallet');
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
    const payload: BallotGetResponse = {
      round: null,
      recipients: [],
      existingBallot: null,
      status:
        'Supabase not configured. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to read live data.',
    };
    return new Response(JSON.stringify(payload), { headers: corsHeaders() });
  }

  const { data: round } = await supabase
    .from('retro_rounds')
    .select('id, status, pool_brza, period_start, period_end, voting_closes_at')
    .eq('community_id', communityId)
    .in('status', ['open', 'voting'])
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: members } = await supabase
    .from('memberships')
    .select('user_id_hash, joined_at, wallet_address')
    .eq('community_id', communityId)
    .eq('status', 'active');

  const recipients: RecipientRow[] = (members ?? []).map((m) => ({
    wallet: (m as { wallet_address?: string; user_id_hash: string }).wallet_address ??
      (m as { user_id_hash: string }).user_id_hash,
    joinedAt: (m as { joined_at: string }).joined_at,
  }));

  let existingBallot: Record<string, number> | null = null;
  if (round && voterWallet) {
    const { data: existing } = await supabase
      .from('retro_votes')
      .select('allocations')
      .eq('round_id', round.id)
      .eq('voter_wallet', voterWallet)
      .maybeSingle();
    if (existing) {
      existingBallot = (existing as { allocations: Record<string, number> }).allocations;
    }
  }

  return new Response(
    JSON.stringify({ round: round ?? null, recipients, existingBallot } satisfies BallotGetResponse),
    { headers: corsHeaders() },
  );
}

interface PostBody {
  communityId?: string;
  allocations?: Record<string, number>;
}

export async function POST(req: Request): Promise<Response> {
  const voterWallet = req.headers.get('x-voter-wallet');
  if (!voterWallet) {
    return new Response(JSON.stringify({ error: 'voter wallet required' }), {
      status: 401,
      headers: corsHeaders(),
    });
  }
  if (!verifyWalletProof(getWalletProof(req, voterWallet), voterWallet, 'retro-vote')) {
    return new Response(JSON.stringify({ error: 'wallet_proof_required' }), {
      status: 401,
      headers: corsHeaders(),
    });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (!body.communityId || !body.allocations) {
    return new Response(JSON.stringify({ error: 'communityId and allocations required' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: 'supabase_unavailable', message: 'Cannot persist ballot.' }),
      { status: 503, headers: corsHeaders() },
    );
  }

  // 1. Active round?
  const { data: round, error: roundErr } = await supabase
    .from('retro_rounds')
    .select('id, status, voting_closes_at')
    .eq('community_id', body.communityId)
    .in('status', ['open', 'voting'])
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundErr) {
    return new Response(JSON.stringify({ error: roundErr.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
  if (!round) {
    return new Response(
      JSON.stringify({ error: 'no_active_round', message: 'No round is currently accepting votes.' }),
      { status: 409, headers: corsHeaders() },
    );
  }
  const roundRow = round as { id: string; status: string; voting_closes_at: string };
  if (new Date(roundRow.voting_closes_at).getTime() < Date.now()) {
    return new Response(
      JSON.stringify({ error: 'voting_closed', message: 'Voting has closed.' }),
      { status: 409, headers: corsHeaders() },
    );
  }

  // 2. Voter is an active member?
  const { data: membership } = await supabase
    .from('memberships')
    .select('id, status')
    .eq('community_id', body.communityId)
    .eq('wallet_address', voterWallet)
    .eq('status', 'active')
    .maybeSingle();
  if (!membership) {
    return new Response(
      JSON.stringify({ error: 'not_active_member', message: 'Voter is not an active member.' }),
      { status: 403, headers: corsHeaders() },
    );
  }

  // 3. Ballot shape valid?
  const ballot: RetroVote = {
    roundId: roundRow.id,
    voterWallet,
    allocations: body.allocations,
  };
  const validation = validateBallot(ballot);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: 'invalid_ballot', messages: validation.errors }),
      { status: 422, headers: corsHeaders() },
    );
  }

  // 4. Upsert. The (round_id, voter_wallet) unique constraint guarantees
  // one-ballot-per-voter; we overwrite an existing ballot rather than reject.
  const { data: upserted, error: upsertErr } = await supabase
    .from('retro_votes')
    .upsert(
      {
        round_id: roundRow.id,
        voter_wallet: voterWallet,
        allocations: body.allocations,
      },
      { onConflict: 'round_id,voter_wallet' },
    )
    .select()
    .single();

  if (upsertErr) {
    return new Response(JSON.stringify({ error: upsertErr.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  // 5. Advance round from 'open' → 'voting' on first ballot. Cheap optimistic
  // update; UI uses status to swap copy between "be the first to vote" and
  // "vote count: N".
  if (roundRow.status === 'open') {
    await supabase
      .from('retro_rounds')
      .update({ status: 'voting' })
      .eq('id', roundRow.id)
      .eq('status', 'open');
  }

  return new Response(JSON.stringify({ ballot: upserted }), { headers: corsHeaders() });
}


export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return OPTIONS();
  if (req.method === 'GET') return GET(req);
  if (req.method === 'POST') return POST(req);
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: corsHeaders() });
}
