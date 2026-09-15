/**
 * Baraza Data Hooks
 *
 * Reactive hooks that subscribe to the data store.
 * Components re-render only when the store emits a change.
 */

import { useEffect, useMemo, useReducer, useState, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { dataStore } from '@/lib/dataStore';
import { proposalBucket } from '@/lib/proposalStatus';
import { createBarazaClient, toSlug, communityPda, proposalPda, type VoteSupportArg } from '@/lib/programs';
import type { BarazaChainClient } from '@/lib/programs';
import {
  getCommunityChainMapping,
  getDecisionChainMapping,
  saveCommunityChainMapping,
  saveDecisionChainMapping,
} from '@/lib/chainMappings';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { BarazaStellarClient } from '@/lib/programs/stellarClient';
import { useAccount } from '@/contexts/AccountContext';
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
  const stellarWallet = useStellarWallet();
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
    /** Account id sent to the server as the proposer. Defaults to `proposedBy`. */
    proposer?: string;
    /** The group's quorum percentage, sent as basis points. */
    quorumPct?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      // With a database behind the app the server is the only place a proposal
      // is created; a failure is an error, never a silent local write.
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
      } else if (stellarWallet.address && stellarWallet.signTransaction) {
        // Only attempt this for communities actually registered on Stellar's
        // community_registry contract — required for governance's require_member
        // check to find a real, matching membership record on that chain.
        const communityMapping = getCommunityChainMapping(data.communityId);
        if (communityMapping?.chain === 'stellar') {
          try {
            const stellarClient = new BarazaStellarClient({
              publicKey: stellarWallet.address,
              signTransaction: stellarWallet.signTransaction,
            });
            const { txHash, proposalId } = await stellarClient.createProposal(
              communityMapping.slug,
              data.title,
              data.description,
            );
            const localDecision = await dataStore.createDecision(data);
            if (localDecision) {
              saveDecisionChainMapping({
                localId: localDecision.id,
                communityLocalId: data.communityId,
                chain: 'stellar',
                proposalAddress: stellarClient.governanceContractId,
                proposalId: Number(proposalId),
                createTxSignature: txHash,
              });
            }
            return localDecision;
          } catch (chainErr) {
            console.warn('[baraza] createProposal on-chain (stellar) failed (local fallback):', chainErr);
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
  }, [client, stellarWallet.address, stellarWallet.signTransaction]);

  return { create, isLoading, error };
}

/**
 * The result of submitting a vote.
 *
 * `confirmed` — the server accepted the ballot (and the chain leg, when there
 *   was one, did not throw).
 * `recorded`  — the server accepted the ballot but the on-chain anchor failed.
 *   The vote counts; the chain record is behind.
 * `failed`    — nothing was recorded anywhere. The UI must roll back.
 */
export type VoteOutcome = {
  ok: boolean;
  stage: 'confirmed' | 'recorded' | 'failed';
  reason?: string;
};

export function useCastVote() {
  const client = useBarazaChain();
  const stellarWallet = useStellarWallet();
  const account = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const vote = useCallback(async (
    decisionId: string,
    walletKey: string,
    voteType: 'for' | 'against',
    /** On-chain member account for the voter (Phase 2: from membership program) */
    voterMemberKey?: string,
  ): Promise<VoteOutcome> => {
    setIsLoading(true);
    try {
      let chainFailed = false;

      // Attempt on-chain vote when both member key and cached proposal key are available
      if (client && voterMemberKey) {
        const decisionMapping = getDecisionChainMapping(decisionId);
        if (decisionMapping) {
          const support: VoteSupportArg = voteType;
          try {
            await client.castVote(
              new PublicKey(decisionMapping.proposalAddress),
              new PublicKey(voterMemberKey),
              support,
            );
          } catch (chainErr) {
            console.warn('[baraza] castVote on-chain failed:', chainErr);
            chainFailed = true;
          }
        }
      } else if (stellarWallet.address && stellarWallet.signTransaction) {
        const decisionMapping = getDecisionChainMapping(decisionId);
        // The deployed governance contract's vote() is binary (support: bool).
        if (decisionMapping?.chain === 'stellar') {
          try {
            const stellarClient = new BarazaStellarClient({
              publicKey: stellarWallet.address,
              signTransaction: stellarWallet.signTransaction,
            });
            await stellarClient.castVote(String(decisionMapping.proposalId), voteType === 'for');
          } catch (chainErr) {
            console.warn('[baraza] castVote on-chain (stellar) failed:', chainErr);
            chainFailed = true;
          }
        }
      }

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
      return chainFailed
        ? {
            ok: true,
            stage: 'recorded',
            reason: 'Your vote is recorded on Baraza. Writing it to the group record is still pending.',
          }
        : { ok: true, stage: 'confirmed' };
    } finally {
      setIsLoading(false);
    }
  }, [account.getAccessToken, client, stellarWallet.address, stellarWallet.signTransaction]);

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
