/**
 * Baraza Data Hooks
 *
 * Reactive hooks that subscribe to the data store.
 * Components re-render only when the store emits a change.
 */

import { useEffect, useReducer, useState, useCallback } from 'react';

import { dataStore } from '@/lib/dataStore';
import { proposalBucket } from '@/lib/proposalStatus';
import { apiFetch, type ApiError } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/communities';
import { getMyVote, onMyVotesChange, recordMyVote } from '@/lib/myVotes';
import { createProposal } from '@/lib/proposals';

// ---------- Low-level subscription ----------

// Selector closes over caller scope, so it always reads current values during
// render. No dep list is required — every dataStore.notify forces a re-render
// (in-place mutations defeat reference-equality bailouts), and the selector
// runs fresh each time. Previous signature took a deps array, but it was a
// no-op kept for backwards compat; dropped now that nothing relies on it.
function useStoreSnapshot<T>(selector: () => T): T {
  const [, force] = useReducer((c: number) => c + 1, 0);
  useEffect(() => dataStore.subscribe(force), []);
  return selector();
}

// ---------- Communities ----------

/** Synthetic-store communities (dev only). The real list is `hooks/useCommunities`. */
export function useStoreCommunities() {
  const communities = useStoreSnapshot(() => dataStore.getAllCommunities());
  return communities;
}

export function useStoreCommunity(id: string) {
  const community = useStoreSnapshot(() => dataStore.getCommunity(id));
  return community;
}

// ---------- Decisions ----------

export function useDecisions(communityId: string) {
  const all = useStoreSnapshot(() => dataStore.getDecisionsForCommunity(communityId));
  const active = all.filter((d) => proposalBucket(d) === 'active');
  const past = all.filter((d) => proposalBucket(d) !== 'active');
  return { all, active, past };
}

export function useDecision(id: string) {
  return useStoreSnapshot(() => dataStore.getDecision(id));
}

// ---------- Activities ----------

export function useActivities(communityId: string) {
  return useStoreSnapshot(() => dataStore.getActivities(communityId));
}

// ---------- Membership ----------

export function useMembership(communityId: string, walletKey: string | null) {
  const isMember = useStoreSnapshot(
    () => (walletKey ? dataStore.isMember(communityId, walletKey) : false),
  );
  return isMember;
}

// ---------- Members ----------

export function useMembers(communityId: string) {
  return useStoreSnapshot(() => dataStore.getMembersForCommunity(communityId));
}

export function useMember(communityId: string, memberId: string) {
  return useStoreSnapshot(() => dataStore.getMember(communityId, memberId));
}

// ---------- Voting ----------

export function useVoteStatus(decisionId: string, walletKey: string | null) {
  const [, force] = useReducer((c: number) => c + 1, 0);
  useEffect(() => onMyVotesChange(force), []);
  const local = useStoreSnapshot(() => (walletKey ? dataStore.hasVoted(decisionId, walletKey) : null));
  return getMyVote(decisionId, walletKey) ?? local;
}

// ---------- Mutations ----------

export function useCreateDecision() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: {
    communityId: string;
    title: string;
    description: string;
    fundingAmount: number;
    proposedBy: string;
    durationDays: number;
    /** Account id sent to the server as the proposer. Defaults to `proposedBy`. */
    proposer?: string;
    /** The group's quorum percentage, sent as basis points. */
    quorumPct?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      // With a database behind the app the server is the only place a proposal
      // is created; a failure is an error, never a silent local write. Without
      // one (local development) the synthetic store takes it.
      if (isSupabaseConfigured()) {
        const created = await createProposal({
          communityId: data.communityId,
          proposer: data.proposer ?? data.proposedBy,
          title: data.title,
          description: data.description,
          fundingAmountMinor: Math.round(data.fundingAmount * 100),
          votingPeriodDays: data.durationDays,
          quorumPct: data.quorumPct,
        });
        if (!created.ok) {
          setError(created.error.message);
          return null;
        }
        return created.decision;
      }
      return await dataStore.createDecision(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create decision');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * The result of submitting a vote.
 *
 * `confirmed` — the server accepted the ballot (and the chain leg, when there
 *   was one, did not throw).
 * `recorded`  — kept for callers; the server-only path no longer produces it.
 * `failed`    — nothing was recorded anywhere. The UI must roll back.
 */
export type VoteOutcome = {
  ok: boolean;
  stage: 'confirmed' | 'recorded' | 'failed';
  reason?: string;
};

export function useCastVote() {
  const [isLoading, setIsLoading] = useState(false);

  const vote = useCallback(async (
    decisionId: string,
    walletKey: string,
    voteType: 'for' | 'against',
  ): Promise<VoteOutcome> => {
    setIsLoading(true);
    try {
      // The server is the authority on whether this ballot exists. A network
      // error or a 409/422/500 is a failure, not a reason to write locally.
      const result = await apiFetch('/api/governance/vote', {
        method: 'POST',
        body: {
          proposalId: decisionId,
          voter: walletKey,
          option: voteType === 'for' ? 'yes' : 'no',
        },
      });
      if (!result.ok) {
        if (result.error.code === 'already_voted') recordMyVote(decisionId, walletKey, voteType);
        return { ok: false, stage: 'failed', reason: voteErrorCopy(result.error) };
      }

      recordMyVote(decisionId, walletKey, voteType);
      await dataStore.castVote(decisionId, walletKey, voteType);
      return { ok: true, stage: 'confirmed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { vote, isLoading };
}

function voteErrorCopy(error: ApiError): string {
  if (error.code === 'already_voted' || error.kind === 'conflict') return 'You have already voted on this decision.';
  if (error.code === 'voting_ended') return 'Voting on this decision has closed.';
  if (error.code === 'proposal_not_active') return 'This decision is not open for voting.';
  if (error.kind === 'network') return 'We could not reach Baraza. Your vote was not recorded. Check your connection and try again.';
  if (error.kind === 'auth' || error.kind === 'forbidden') return 'Sign in again to vote. Your session has expired.';
  return error.message || 'Your vote was not recorded. Please try again.';
}
