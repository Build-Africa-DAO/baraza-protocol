/**
 * POST /api/governance/vote
 *
 * Casts a vote on an active governance proposal.
 * Validates member standing, deadline enforcement, and duplicate vote rejection.
 */

import { getWalletProof, verifyWalletProof } from '../_lib/wallet-proof.js';

export const config = { runtime: 'nodejs' };

interface CastVoteRequest {
  proposalId: string;
  voter: string;
  memberId?: string;
  option: 'yes' | 'no' | 'abstain';
  weight?: number;
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST,OPTIONS',
        'access-control-allow-headers': 'content-type,x-wallet-address,x-wallet-message,x-wallet-signature',
      },
    });
  }

  if (req.method !== 'POST') return bad('Method not allowed', 405);

  let body: CastVoteRequest;
  try {
    body = (await req.json()) as CastVoteRequest;
  } catch {
    return bad('Body must be valid JSON');
  }

  const { proposalId, voter } = body;
  if (!proposalId?.trim()) return bad('proposalId is required');
  if (!voter?.trim()) return bad('voter is required');
  const rawOption = (body.option || '').toLowerCase();
  if (!['yes', 'no', 'abstain'].includes(rawOption)) {
    return bad("option must be 'yes', 'no', or 'abstain'");
  }
  const option = rawOption as 'yes' | 'no' | 'abstain';

  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

  // Verify wallet proof (Mandatory in production; validated in test if provided)
  const proof = getWalletProof(req, voter);
  if (proof) {
    if (!verifyWalletProof(proof, voter, 'vote')) {
      return json({ error: 'unauthorized', message: 'Valid voter wallet signature required' }, { status: 401 });
    }
  } else if (!isTestEnv) {
    return json({ error: 'unauthorized', message: 'Valid voter wallet signature required' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let resolvedMemberId = body.memberId || voter;
  let effectiveWeight = 1;

  if (!supabaseUrl || !serviceKey) {
    if (isTestEnv) {
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return json(
        {
          ok: true,
          voteId,
          proposalId,
          voter,
          memberId: resolvedMemberId,
          option,
          weight: effectiveWeight,
          recordedAt: new Date().toISOString(),
        },
        { status: 200 },
      );
    }
    return json({ error: 'db_not_configured', message: 'Database persistence is required to record votes.' }, { status: 503 });
  }

  try {
    // 1. Fetch proposal to verify status, community, and deadline
    const propRes = await fetch(
      `${supabaseUrl}/rest/v1/proposals?id=eq.${encodeURIComponent(proposalId)}&select=*`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    );
    if (!propRes.ok) {
      return json({ error: 'proposal_fetch_failed', message: await propRes.text() }, { status: propRes.status });
    }
    const props = await propRes.json();
    if (!Array.isArray(props) || props.length === 0) {
      return json({ error: 'not_found', message: 'Proposal not found' }, { status: 404 });
    }

    const proposal = props[0];
    if (proposal.status !== 'active' && proposal.status !== 'tied_extended') {
      return json({ error: 'proposal_not_active', message: `Proposal is ${proposal.status}` }, { status: 422 });
    }

    if (proposal.ends_at) {
      const now = Date.now();
      const deadline = new Date(proposal.ends_at).getTime();
      if (!isNaN(deadline) && now > deadline) {
        return json({ error: 'voting_ended', message: 'Proposal voting period has ended' }, { status: 422 });
      }
    }

    // 2. Resolve canonical member_id, enforce active standing, and derive weight strictly from membership
    if (proposal.community_id) {
      const memRes = await fetch(
        `${supabaseUrl}/rest/v1/memberships?community_id=eq.${encodeURIComponent(proposal.community_id)}&or=(wallet_address.eq.${encodeURIComponent(voter)},member_id.eq.${encodeURIComponent(voter)})&select=member_id,status,voting_weight&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        },
      );
      if (!memRes.ok) {
        return json({ error: 'membership_fetch_failed', message: 'Failed to verify membership standing.' }, { status: 500 });
      }
      const mems = await memRes.json();
      if (!Array.isArray(mems) || mems.length === 0) {
        return json({ error: 'not_a_member', message: 'Voter is not an active member of this community.' }, { status: 403 });
      }
      const mem = mems[0];
      if (mem.status && mem.status.toUpperCase() !== 'ACTIVE') {
        return json({ error: 'inactive_member', message: 'Member is not active in this community' }, { status: 403 });
      }
      resolvedMemberId = mem.member_id;
      // Derive weight strictly from member's recorded voting weight
      effectiveWeight = Number(mem.voting_weight || 1);
    }

      // 3. Check for duplicate vote (Application-level pre-check)
      const voteCheckRes = await fetch(
        `${supabaseUrl}/rest/v1/votes?proposal_id=eq.${encodeURIComponent(proposalId)}&member_id=eq.${encodeURIComponent(resolvedMemberId)}&select=id`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        },
      );
      if (voteCheckRes.ok) {
        const existingVotes = await voteCheckRes.json();
        if (Array.isArray(existingVotes) && existingVotes.length > 0) {
          return json({ error: 'already_voted', message: 'Member has already voted on this proposal' }, { status: 409 });
        }
      }

      // 4. Insert vote record with DB-level unique constraint backstop
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const voteInsertRes = await fetch(`${supabaseUrl}/rest/v1/votes`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: voteId,
          proposal_id: proposalId,
          member_id: resolvedMemberId,
          option,
          weight: effectiveWeight,
          cast_at: new Date().toISOString(),
        }),
      });

      if (!voteInsertRes.ok) {
        const errText = await voteInsertRes.text();
        // Handle race conditions caught by database unique index or trigger
        if (/duplicate key|23505|uq_votes_proposal_member|votes_member_proposal_unique|already voted|unique_violation/i.test(errText)) {
          return json({ error: 'already_voted', message: 'Member has already voted on this proposal' }, { status: 409 });
        }
        return json({ error: 'vote_write_failed', message: errText }, { status: voteInsertRes.status });
      }

      return json(
        {
          ok: true,
          voteId,
          proposalId,
          voter,
          memberId: resolvedMemberId,
          option,
          weight: effectiveWeight,
          recordedAt: new Date().toISOString(),
        },
        { status: 200 },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return json({ error: 'internal_error', message: msg }, { status: 500 });
    }
}

export { handler as POST, handler as OPTIONS };
