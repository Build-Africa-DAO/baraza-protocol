/**
 * Baraza Data Hooks
 *
 * Reactive hooks that subscribe to the data store.
 * Components re-render only when the store emits a change.
 */

import { useState, useCallback, useSyncExternalStore } from 'react';
import { dataStore } from '@/lib/dataStore';

// ---------- Low-level subscription ----------

function useStoreSnapshot<T>(selector: () => T): T {
  // useSyncExternalStore gives us tear-free reads
  return useSyncExternalStore(
    (cb) => dataStore.subscribe(cb),
    selector,
    selector,
  );
}

// ---------- Communities ----------

export function useCommunities() {
  const communities = useStoreSnapshot(() => dataStore.getAllCommunities());
  return communities;
}

export function useCommunity(id: string) {
  const community = useStoreSnapshot(() => dataStore.getCommunity(id));
  return community;
}

// ---------- Decisions ----------

export function useDecisions(communityId: string) {
  const all = useStoreSnapshot(() => dataStore.getDecisionsForCommunity(communityId));
  const active = all.filter((d) => d.status === 'active');
  const past = all.filter((d) => d.status === 'completed');
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
  const isMember = useStoreSnapshot(() =>
    walletKey ? dataStore.isMember(communityId, walletKey) : false
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
  return useStoreSnapshot(() =>
    walletKey ? dataStore.hasVoted(decisionId, walletKey) : null
  );
}

// ---------- Mutations ----------

export function useCreateCommunity() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: {
    name: string;
    type: string;
    description: string;
    membershipFee: number;
    creatorWallet: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const community = await dataStore.createCommunity(data);
      return community;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create community');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

export function useJoinCommunity() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async (communityId: string, walletKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const ok = await dataStore.joinCommunity(communityId, walletKey);
      return ok;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join community');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { join, isLoading, error };
}

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
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const decision = await dataStore.createDecision(data);
      return decision;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create decision');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

export function useCastVote() {
  const [isLoading, setIsLoading] = useState(false);

  const vote = useCallback(async (decisionId: string, walletKey: string, voteType: 'for' | 'against') => {
    setIsLoading(true);
    try {
      const ok = await dataStore.castVote(decisionId, walletKey, voteType);
      return ok;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { vote, isLoading };
}