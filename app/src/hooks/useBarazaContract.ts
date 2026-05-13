/**
 * Baraza on-chain contract interface.
 * Separates read (query) and write (transaction) logic cleanly.
 *
 * Architecture:
 *  - Read methods: use withRpcFallback + cached results
 *  - Write methods: require connected wallet + toast feedback
 */
import { useCallback, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnChainCommunity {
  id: string;
  name: string;
  treasuryBalance: number; // in lamports
  memberCount: number;
  admin: string;
}

export interface VoteState {
  communityId: string;
  proposalId: string;
  votesFor: number;
  votesAgainst: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────
//
// Reads are not yet wired to the on-chain program, so there is nothing to
// cache. The map and helpers below will return once fetchTreasuryBalance and
// fetchVoteState read real account state.

const CACHE_TTL_MS = 30_000; // 30 s
const cache = new Map<string, { data: unknown; ts: number }>();

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseBarazaContractResult {
  // Read
  fetchTreasuryBalance: (communityId: string) => Promise<number>;
  fetchVoteState: (proposalId: string) => Promise<VoteState | null>;
  // Write
  castVote: (proposalId: string, communityId: string, support: boolean) => Promise<boolean>;
  /** feeKSh is the membership fee in KSh. KSh→lamports conversion happens on the program/backend side. */
  joinCommunity: (communityId: string, feeKSh: number) => Promise<boolean>;
  /** feeKSh is the monthly dues in KSh. KSh→lamports conversion happens on the program/backend side. */
  createCommunity: (name: string, feeKSh: number) => Promise<string | null>;
  // State
  isPending: boolean;
}

export function useBarazaContract(): UseBarazaContractResult {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  // Prevent duplicate in-flight transactions
  const pendingTxRef = useRef<Set<string>>(new Set());

  // ── Reads ──────────────────────────────────────────────────────────────────

  const fetchTreasuryBalance = useCallback(
    async (communityId: string): Promise<number> => {
      const cacheKey = `treasury:${communityId}`;
      const cached = fromCache<number>(cacheKey);
      if (cached !== null) return cached;

      // TODO: derive the community treasury PDA and call conn.getBalance(pda)
      // once the Baraza Anchor program is deployed.
      void communityId;
      return 0;
    },
    []
  );

  const fetchVoteState = useCallback(
    async (proposalId: string): Promise<VoteState | null> => {
      const cacheKey = `vote:${proposalId}`;
      const cached = fromCache<VoteState>(cacheKey);
      if (cached !== null) return cached;

      // In production: fetch from Anchor program account
      return null;
    },
    []
  );

  // ── Writes ─────────────────────────────────────────────────────────────────

  const blockUnwiredWrite = useCallback(
    async (txId: string, action: string): Promise<boolean> => {
      if (!connected || !publicKey) {
        toast({ title: 'Connect your wallet first', variant: 'destructive' });
        return false;
      }
      if (pendingTxRef.current.has(txId)) {
        toast({ title: 'Transaction already pending', description: 'Please wait.' });
        return false;
      }

      pendingTxRef.current.add(txId);
      setIsPending(true);

      try {
        toast({
          title: `${action} — coming soon`,
          description: 'This action goes live once the on-chain program ships. Thanks for trying it early.',
        });
        return false;
      } finally {
        pendingTxRef.current.delete(txId);
        setIsPending(false);
      }
    },
    [connected, publicKey, toast]
  );

  const castVote = useCallback(
    async (proposalId: string, _communityId: string, _support: boolean): Promise<boolean> => {
      const txId = `vote:${proposalId}:${publicKey?.toBase58()}`;
      return blockUnwiredWrite(txId, 'Vote casting');
    },
    [blockUnwiredWrite, publicKey]
  );

  const joinCommunity = useCallback(
    async (communityId: string, _feeKSh: number): Promise<boolean> => {
      const txId = `join:${communityId}:${publicKey?.toBase58()}`;
      return blockUnwiredWrite(txId, 'Joining a DAO');
    },
    [blockUnwiredWrite, publicKey]
  );

  const createCommunity = useCallback(
    async (name: string, _feeKSh: number): Promise<string | null> => {
      const txId = `create:${name}:${publicKey?.toBase58()}`;
      const success = await blockUnwiredWrite(txId, 'Creating a DAO');
      return success ? `community-${Date.now()}` : null;
    },
    [blockUnwiredWrite, publicKey]
  );

  return {
    fetchTreasuryBalance,
    fetchVoteState,
    castVote,
    joinCommunity,
    createCommunity,
    isPending,
  };
}
