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
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { withRpcFallback } from '@/lib/rpc';
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

function toCache<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseBarazaContractResult {
  // Read
  fetchTreasuryBalance: (communityId: string) => Promise<number>;
  fetchVoteState: (proposalId: string) => Promise<VoteState | null>;
  // Write
  castVote: (proposalId: string, communityId: string, support: boolean) => Promise<boolean>;
  joinCommunity: (communityId: string, feeLamports: number) => Promise<boolean>;
  createCommunity: (name: string, feeLamports: number) => Promise<string | null>;
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

      try {
        const balance = await withRpcFallback(async (conn) => {
          // In production this would use an Anchor program account PDA
          // For now, returns a simulated balance based on community mock data
          const pk = new PublicKey(SystemProgram.programId);
          return conn.getBalance(pk);
        });
        const result = balance ?? 0;
        toCache(cacheKey, result);
        return result;
      } catch {
        return 0;
      }
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
          title: `${action} is not wired yet`,
          description: 'Real Baraza program instructions, persistence, and reconciliation are required before this can complete.',
          variant: 'destructive',
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
    async (proposalId: string, communityId: string, support: boolean): Promise<boolean> => {
      const txId = `vote:${proposalId}:${publicKey?.toBase58()}`;
      void support; void communityId;
      return blockUnwiredWrite(txId, 'Vote casting');
    },
    [blockUnwiredWrite, publicKey]
  );

  const joinCommunity = useCallback(
    async (communityId: string, feeLamports: number): Promise<boolean> => {
      const txId = `join:${communityId}:${publicKey?.toBase58()}`;
      void feeLamports;
      return blockUnwiredWrite(txId, 'Community joining');
    },
    [blockUnwiredWrite, publicKey]
  );

  const createCommunity = useCallback(
    async (name: string, feeLamports: number): Promise<string | null> => {
      const txId = `create:${name}:${publicKey?.toBase58()}`;
      void feeLamports;
      const success = await blockUnwiredWrite(txId, 'Community creation');
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
