/**
 * Baraza EVM governance client for Base chain.
 *
 * Uses viem directly (no wagmi context required) so it works in adapter
 * callbacks that run outside of React. Write operations require a connected
 * EIP-1193 provider (window.ethereum) to be present.
 *
 * Vote support encoding (matches on-chain Governor):
 *   0 = Against  ('no')
 *   1 = For      ('yes')
 *   2 = Abstain  ('abstain')
 *
 * ProposalState enum (uint8, 9 values):
 *   0=Pending 1=Active 2=Canceled 3=Defeated 4=Succeeded
 *   5=Queued  6=Expired 7=Executed 8=Vetoed
 *
 * proposalId is bytes32 throughout — NOT a uint256.
 */

import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { GOVERNOR_ABI, TOKEN_ABI } from '@/lib/evm/abis';
import type { VoteOption } from '@/types';

// ─── Contract addresses ───────────────────────────────────────────────────────

export interface BaseGovernanceAddresses {
  governor: `0x${string}`;
  token: `0x${string}`;
  treasury: `0x${string}` | undefined;
}

export function baseGovernanceAddresses(): BaseGovernanceAddresses | null {
  const governor = import.meta.env.VITE_BASE_GOVERNOR_ADDRESS?.trim();
  const token = import.meta.env.VITE_BASE_TOKEN_ADDRESS?.trim();
  if (!governor || !token) return null;
  return {
    governor: governor as `0x${string}`,
    token: token as `0x${string}`,
    treasury: (import.meta.env.VITE_BASE_TREASURY_ADDRESS?.trim() as `0x${string}`) || undefined,
  };
}

// ─── viem clients ────────────────────────────────────────────────────────────

function publicClient() {
  const rpcUrl = import.meta.env.VITE_BASE_RPC_URL?.trim();
  const isTestnet = import.meta.env.VITE_BASE_TESTNET === 'true';
  return createPublicClient({ chain: isTestnet ? baseSepolia : base, transport: http(rpcUrl || undefined) });
}

function walletClient() {
  if (typeof window === 'undefined' || !('ethereum' in window)) return null;
  const isTestnet = import.meta.env.VITE_BASE_TESTNET === 'true';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createWalletClient({ chain: isTestnet ? baseSepolia : base, transport: custom((window as any).ethereum) });
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/** Returns NFT governance token balance (raw count) for the given address. */
export async function getBaseTokenBalance(address: `0x${string}`): Promise<bigint> {
  const addrs = baseGovernanceAddresses();
  if (!addrs) return 0n;
  const client = publicClient();
  return client.readContract({ address: addrs.token, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] });
}

/** Returns delegated vote weight at a given timestamp (0 = current). */
export async function getBaseVoteWeight(address: `0x${string}`, timestamp?: number): Promise<bigint> {
  const addrs = baseGovernanceAddresses();
  if (!addrs) return 0n;
  const client = publicClient();
  const ts = timestamp ? BigInt(timestamp) : BigInt(Math.floor(Date.now() / 1000) - 1);
  return client.readContract({ address: addrs.governor, abi: GOVERNOR_ABI, functionName: 'getVotes', args: [address, ts] });
}

/** Returns aggregate vote counts for a proposal. */
export async function getProposalVotes(proposalId: `0x${string}`): Promise<{ against: bigint; for: bigint; abstain: bigint } | null> {
  const addrs = baseGovernanceAddresses();
  if (!addrs) return null;
  const client = publicClient();
  const result = await client.readContract({
    address: addrs.governor,
    abi: GOVERNOR_ABI,
    functionName: 'proposalVotes',
    args: [proposalId],
  });
  const [againstVotes, forVotes, abstainVotes] = result as [bigint, bigint, bigint];
  return { against: againstVotes, for: forVotes, abstain: abstainVotes };
}

// ─── Proposal state mapping ───────────────────────────────────────────────────

export type BarazaProposalStatus = 'pending' | 'active' | 'cancelled' | 'failed' | 'passed' | 'queued' | 'executed';

export function ozStateToBaraza(state: number): BarazaProposalStatus {
  switch (state) {
    case 0: return 'pending';
    case 1: return 'active';
    case 2: return 'cancelled';
    case 3: return 'failed';    // Defeated
    case 4: return 'passed';    // Succeeded
    case 5: return 'queued';
    case 6: return 'failed';    // Expired
    case 7: return 'executed';
    case 8: return 'cancelled'; // Vetoed
    default: return 'pending';
  }
}

// ─── Write helper ─────────────────────────────────────────────────────────────

const SUPPORT: Record<VoteOption, number> = { yes: 1, no: 0, abstain: 2 };

/**
 * Casts a vote on the Base chain governor.
 *
 * @param proposalId - bytes32 hex proposal ID from the on-chain Governor.
 *   This is NOT the Baraza Supabase UUID — callers must resolve the on-chain
 *   proposalId before calling this function.
 * @param option - Baraza VoteOption ('yes' | 'no' | 'abstain')
 * @returns Transaction hash on success, null if wallet unavailable or tx reverts.
 */
export async function castBaseGovernorVote(
  proposalId: `0x${string}`,
  option: VoteOption,
): Promise<`0x${string}` | null> {
  const addrs = baseGovernanceAddresses();
  if (!addrs) return null;

  const wc = walletClient();
  if (!wc) return null;

  const [account] = await wc.getAddresses();
  if (!account) return null;

  try {
    const hash = await wc.writeContract({
      address: addrs.governor,
      abi: GOVERNOR_ABI,
      functionName: 'castVote',
      args: [proposalId, BigInt(SUPPORT[option])],
      account,
    });
    return hash;
  } catch {
    return null;
  }
}
