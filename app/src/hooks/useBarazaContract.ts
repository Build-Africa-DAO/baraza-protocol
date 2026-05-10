/**
 * Baraza on-chain contract interface.
 * Separates read (query) and write (transaction) logic cleanly.
 *
 * Architecture:
 *  - Read methods: use withRpcFallback + cached results
 *  - Write methods: require connected wallet + toast feedback
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
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

  const sendWithFeedback = useCallback(
    async (
      txId: string,
      buildTx: () => Promise<Transaction | null>
    ): Promise<boolean> => {
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
        const tx = await buildTx();
        if (!tx) return false;

        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');

        toast({ title: 'Transaction confirmed ✓', description: `Signature: ${sig.slice(0, 12)}…` });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (!msg.toLowerCase().includes('user rejected')) {
          toast({ title: 'Transaction failed', description: msg, variant: 'destructive' });
        }
        return false;
      } finally {
        pendingTxRef.current.delete(txId);
        setIsPending(false);
      }
    },
    [connected, publicKey, connection, sendTransaction, toast]
  );

  const castVote = useCallback(
    async (proposalId: string, communityId: string, support: boolean): Promise<boolean> => {
      const txId = `vote:${proposalId}:${publicKey?.toBase58()}`;
      return sendWithFeedback(txId, async () => {
        // In production: build Anchor instruction for castVote
        // Returning a no-op transaction as placeholder until Anchor IDL is wired
        const tx = new Transaction();
        tx.feePayer = publicKey!;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        // TODO: add program instruction
        void support; void communityId;
        return tx;
      });
    },
    [sendWithFeedback, publicKey, connection]
  );

  const joinCommunity = useCallback(
    async (communityId: string, feeLamports: number): Promise<boolean> => {
      const txId = `join:${communityId}:${publicKey?.toBase58()}`;
      return sendWithFeedback(txId, async () => {
        const tx = new Transaction();
        tx.feePayer = publicKey!;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        // TODO: add program instruction for joining + SOL transfer for fee
        void feeLamports;
        return tx;
      });
    },
    [sendWithFeedback, publicKey, connection]
  );

  const createCommunity = useCallback(
    async (name: string, feeLamports: number): Promise<string | null> => {
      const txId = `create:${name}:${publicKey?.toBase58()}`;
      const success = await sendWithFeedback(txId, async () => {
        const tx = new Transaction();
        tx.feePayer = publicKey!;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        // TODO: add Anchor program instruction
        void feeLamports;
        return tx;
      });
      return success ? `community-${Date.now()}` : null;
    },
    [sendWithFeedback, publicKey, connection]
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
