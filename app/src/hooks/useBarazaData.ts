/**
 * Baraza Data Hooks
 *
 * Reactive hooks that subscribe to the data store.
 * Components re-render only when the store emits a change.
 */

import { type DependencyList, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { dataStore } from '@/lib/dataStore';
import { createBarazaClient, toSlug, communityPda, proposalPda, type VoteSupportArg } from '@/lib/programs';
import type { BarazaChainClient } from '@/lib/programs';
import {
  getDecisionChainMapping,
  saveCommunityChainMapping,
  saveDecisionChainMapping,
} from '@/lib/chainMappings';

// ---------- Low-level subscription ----------

function useStoreSnapshot<T>(selector: () => T, deps: DependencyList = []): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const [snapshot, setSnapshot] = useState(selector);

  useEffect(() => {
    setSnapshot(selectorRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => dataStore.subscribe(() => setSnapshot(selectorRef.current())), []);

  return snapshot;
}

// ---------- Chain client ----------

function nextProposalId(): number {
  const key = 'baraza_proposal_seq';
  const val = parseInt(localStorage.getItem(key) ?? '0') + 1;
  localStorage.setItem(key, String(val));
  return val;
}

export function useBarazaChain(): BarazaChainClient | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  return useMemo(
    () => (wallet ? createBarazaClient(wallet, connection) : null),
    [wallet, connection],
  );
}

// ---------- Communities ----------

export function useCommunities() {
  const communities = useStoreSnapshot(() => dataStore.getAllCommunities());
  return communities;
}

export function useCommunity(id: string) {
  const community = useStoreSnapshot(() => dataStore.getCommunity(id), [id]);
  return community;
}

// ---------- Decisions ----------

export function useDecisions(communityId: string) {
  const all = useStoreSnapshot(() => dataStore.getDecisionsForCommunity(communityId), [communityId]);
  const active = all.filter((d) => d.status === 'active');
  const past = all.filter((d) => d.status === 'completed');
  return { all, active, past };
}

export function useDecision(id: string) {
  return useStoreSnapshot(() => dataStore.getDecision(id), [id]);
}

// ---------- Activities ----------

export function useActivities(communityId: string) {
  return useStoreSnapshot(() => dataStore.getActivities(communityId), [communityId]);
}

// ---------- Membership ----------

export function useMembership(communityId: string, walletKey: string | null) {
  const isMember = useStoreSnapshot(
    () => (walletKey ? dataStore.isMember(communityId, walletKey) : false),
    [communityId, walletKey],
  );
  return isMember;
}

// ---------- Members ----------

export function useMembers(communityId: string) {
  return useStoreSnapshot(() => dataStore.getMembersForCommunity(communityId), [communityId]);
}

export function useMember(communityId: string, memberId: string) {
  return useStoreSnapshot(() => dataStore.getMember(communityId, memberId), [communityId, memberId]);
}

// ---------- Voting ----------

export function useVoteStatus(decisionId: string, walletKey: string | null) {
  return useStoreSnapshot(
    () => (walletKey ? dataStore.hasVoted(decisionId, walletKey) : null),
    [decisionId, walletKey],
  );
}

// ---------- Mutations ----------

export function useCreateCommunity() {
  const client = useBarazaChain();
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
      // Attempt on-chain registration (non-blocking: failure falls through to local)
      let chainResult: { slug: string; communityKey: PublicKey; signature: string } | null = null;
      if (client) {
        const slug = toSlug(data.name);
        try {
          const signature = await client.createCommunity(slug, data.name, '');
          const [communityKey] = communityPda(slug);
          chainResult = { slug, communityKey, signature };
        } catch (chainErr) {
          console.warn('[baraza] createCommunity on-chain failed (local fallback):', chainErr);
        }
      }
      const community = await dataStore.createCommunity(data);
      if (chainResult) {
        saveCommunityChainMapping({
          localId: community.id,
          chain: 'solana',
          slug: chainResult.slug,
          communityAddress: chainResult.communityKey.toBase58(),
          createTxSignature: chainResult.signature,
        });
      }
      return community;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create community');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { create, isLoading, error };
}

export function useJoinCommunity() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async (communityId: string, walletKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Join requires the membership + payment_attestation programs (Phase 2).
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
  const client = useBarazaChain();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: {
    communityId: string;
    title: string;
    description: string;
    fundingAmount: number;
    proposedBy: string;
    durationDays: number;
    /** On-chain member account for the creator (Phase 2: from membership program) */
    creatorMemberKey?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      // Attempt on-chain proposal creation when member account is available
      if (client && data.creatorMemberKey) {
        const community = dataStore.getCommunity(data.communityId);
        if (community) {
          const slug = toSlug(community.name);
          const [communityKey] = communityPda(slug);
          const proposalId = nextProposalId();
          const kind = data.fundingAmount > 0 ? 'treasuryRelease' : 'text';
          try {
            const creatorMember = new PublicKey(data.creatorMemberKey);
            await client.ensureGovConfig(communityKey);
            const sig = await client.createProposal(
              communityKey,
              proposalId,
              kind,
              '',
              creatorMember,
            );
            const [proposalKey] = proposalPda(communityKey, proposalId);
            const localDecision = await dataStore.createDecision(data);
            if (localDecision) {
              saveDecisionChainMapping({
                localId: localDecision.id,
                communityLocalId: data.communityId,
                chain: 'solana',
                proposalAddress: proposalKey.toBase58(),
                proposalId,
                createTxSignature: sig,
              });
            }
            return localDecision;
          } catch (chainErr) {
            console.warn('[baraza] createProposal on-chain failed (local fallback):', chainErr);
          }
        }
      }
      const decision = await dataStore.createDecision(data);
      return decision;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create decision');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { create, isLoading, error };
}

export function useCastVote() {
  const client = useBarazaChain();
  const [isLoading, setIsLoading] = useState(false);

  const vote = useCallback(async (
    decisionId: string,
    walletKey: string,
    voteType: 'for' | 'against',
    /** On-chain member account for the voter (Phase 2: from membership program) */
    voterMemberKey?: string,
  ) => {
    setIsLoading(true);
    try {
      // Attempt on-chain vote when both member key and cached proposal key are available
      if (client && voterMemberKey) {
        const decisionMapping = getDecisionChainMapping(decisionId);
        if (decisionMapping) {
          const support: VoteSupportArg = voteType === 'for' ? 'for' : 'against';
          try {
            await client.castVote(
              new PublicKey(decisionMapping.proposalAddress),
              new PublicKey(voterMemberKey),
              support,
            );
          } catch (chainErr) {
            console.warn('[baraza] castVote on-chain failed (local fallback):', chainErr);
          }
        }
      }
      const ok = await dataStore.castVote(decisionId, walletKey, voteType);
      return ok;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { vote, isLoading };
}
