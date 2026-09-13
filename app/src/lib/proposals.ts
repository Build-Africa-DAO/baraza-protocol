import { apiFetch, type ApiError } from '@/lib/api';
import { getSupabaseClient } from '@/lib/communities';
import type { ProposalLifecycleStage } from '@/lib/constants';
import type { Decision } from '@/lib/dataStore';

/**
 * Votes come from the `proposals` table, which RLS makes publicly readable and
 * whose tallies a database trigger keeps correct. The client never counts
 * `votes` rows (that table is closed) and never invents a proposal.
 *
 * Creating a proposal goes through `POST /api/governance/proposals`; the
 * server snapshots the member count and sets the voting window.
 */

export interface ProposalRow {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  kind: string | null;
  status: string;
  chain?: string | null;
  created_by: string | null;
  starts_at: string | null;
  ends_at: string | null;
  for_votes: number | null;
  against_votes: number | null;
  abstain_votes: number | null;
  snapshot_member_count: number | null;
  quorum_threshold_bps: number | null;
  funding_amount_minor: number | null;
  tie_extended: boolean | null;
  execution_status: string | null;
  created_at: string;
}

export const PROPOSAL_COLUMNS =
  'id,community_id,title,description,kind,status,chain,created_by,starts_at,ends_at,for_votes,against_votes,abstain_votes,snapshot_member_count,quorum_threshold_bps,funding_amount_minor,tie_extended,execution_status,created_at';

/** Server `proposals.status` → the stage the UI renders. */
export function stageFromProposalStatus(status: string): ProposalLifecycleStage {
  switch (status) {
    case 'active':
      return 'active';
    case 'tied_extended':
      return 'tied_extended';
    case 'passed':
      return 'succeeded';
    case 'queued':
      return 'queued';
    case 'executed':
      return 'executed';
    case 'failed':
      return 'defeated';
    case 'tied':
      return 'tied';
    case 'cancelled':
    case 'canceled':
      return 'canceled';
    default:
      return 'pending';
  }
}

function legacyStatus(stage: ProposalLifecycleStage): Decision['status'] {
  if (stage === 'active' || stage === 'tied_extended' || stage === 'pending') return 'active';
  if (stage === 'succeeded' || stage === 'queued' || stage === 'executed') return 'completed';
  return 'failed';
}

export function decisionFromProposalRow(row: ProposalRow): Decision {
  const stage = stageFromProposalStatus(row.status);
  return {
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    description: row.description ?? '',
    fundingAmount: (Number(row.funding_amount_minor) || 0) / 100,
    proposedBy: row.created_by ?? '',
    votesFor: Number(row.for_votes) || 0,
    votesAgainst: Number(row.against_votes) || 0,
    totalMembers: Number(row.snapshot_member_count) || 0,
    status: legacyStatus(stage),
    lifecycleStage: stage,
    createdAt: row.created_at,
    endsAt: row.ends_at ?? row.created_at,
    // Individual ballots are private on the server; my own choice is kept in `lib/myVotes`.
    voters: {},
  };
}

export async function listProposals(communityId: string): Promise<Decision[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('proposals')
    .select(PROPOSAL_COLUMNS)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ProposalRow[]).map(decisionFromProposalRow);
}

export async function getProposal(id: string): Promise<Decision | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('proposals').select(PROPOSAL_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? decisionFromProposalRow(data as unknown as ProposalRow) : null;
}

export interface CreateProposalInput {
  communityId: string;
  proposer: string;
  title: string;
  description: string;
  fundingAmountMinor: number;
  votingPeriodDays: number;
  /** The group's quorum percentage (1–100); sent as basis points. */
  quorumPct?: number;
}

export interface CreateProposalResult {
  ok: true;
  decision: Decision;
}

export async function createProposal(input: CreateProposalInput): Promise<CreateProposalResult | { ok: false; error: ApiError }> {
  const result = await apiFetch<{
    ok?: boolean;
    proposalId?: string;
    status?: string;
    snapshotMemberCount?: number;
    startsAt?: string;
    endsAt?: string;
  }>('/api/governance/proposals', {
    method: 'POST',
    body: {
      communityId: input.communityId,
      proposer: input.proposer,
      title: input.title,
      description: input.description,
      kind: input.fundingAmountMinor > 0 ? 'treasury' : 'general',
      fundingAmountMinor: input.fundingAmountMinor,
      votingPeriodDays: input.votingPeriodDays,
      ...(input.quorumPct ? { quorumThresholdBps: Math.round(input.quorumPct * 100) } : {}),
    },
  });
  if (!result.ok) return { ok: false, error: result.error };
  const now = new Date().toISOString();
  const data = result.data ?? {};
  if (!data.proposalId) {
    return {
      ok: false,
      error: { kind: 'unknown', status: result.status, code: 'no_proposal_id', message: 'Baraza did not return the new proposal.', body: data },
    };
  }
  return {
    ok: true,
    decision: {
      id: data.proposalId,
      communityId: input.communityId,
      title: input.title,
      description: input.description,
      fundingAmount: input.fundingAmountMinor / 100,
      proposedBy: input.proposer,
      votesFor: 0,
      votesAgainst: 0,
      totalMembers: data.snapshotMemberCount ?? 0,
      status: 'active',
      lifecycleStage: stageFromProposalStatus(data.status ?? 'active'),
      createdAt: data.startsAt ?? now,
      endsAt: data.endsAt ?? new Date(Date.now() + input.votingPeriodDays * 86_400_000).toISOString(),
      voters: {},
    },
  };
}
