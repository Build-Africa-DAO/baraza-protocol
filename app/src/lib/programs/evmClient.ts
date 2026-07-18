/**
 * Baraza EVM read client.
 *
 * Uses raw JSON-RPC calls (no wagmi/viem required) to read on-chain state from
 * the deployed EVM contracts. Write operations are intentionally not wired here
 * until wagmi is added to the app. Add `wagmi` + `viem` to package.json to
 * unlock the full wallet-signing flow.
 *
 * Architecture mirrors the Solana client pattern in client.ts:
 *   - createBarazaEvmReadClient(chainId) -> BarazaEvmClient
 *   - All methods return null on failure rather than throwing
 */

import { getEvmAddresses } from './evmAddresses';
import { isEvmMainnetChainId } from '@/lib/platformGates';

// Minimal ABI fragments.

// ERC-721 balanceOf(address) -> uint256
const BALANCE_OF_SELECTOR = '0x70a08231';
// ERC-721 totalSupply() -> uint256
const TOTAL_SUPPLY_SELECTOR = '0x18160ddd';
// Governor proposalCount() -> uint256
const PROPOSAL_COUNT_SELECTOR = '0xda35c664';
// Token name() -> string
const NAME_SELECTOR = '0x06fdde03';

// JSON-RPC helpers.

async function ethCall(
  rpcUrl: string,
  to: string,
  data: string,
): Promise<string | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
        id: 1,
      }),
    });
    const json = await res.json();
    if (json.error || !json.result || json.result === '0x') return null;
    return json.result as string;
  } catch {
    return null;
  }
}

/** Decode a uint256 hex result to a JS number (safe for values < 2^53). */
function decodeUint256(hex: string): number {
  if (!hex || hex === '0x') return 0;
  return parseInt(hex, 16);
}

/** Pad an Ethereum address to 32 bytes for use as an eth_call param. */
function padAddress(address: string): string {
  return '000000000000000000000000' + address.replace('0x', '').toLowerCase();
}

// RPC URL helpers.

const PUBLIC_RPC: Record<number, string> = {
  1: 'https://ethereum.publicnode.com',
  10: 'https://mainnet.optimism.io',
  137: 'https://polygon-rpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  42220: 'https://forno.celo.org',
  8453: 'https://mainnet.base.org',
  84532: 'https://sepolia.base.org',
  11155111: 'https://rpc.sepolia.org',
  11155420: 'https://sepolia.optimism.io',
  421614: 'https://sepolia-rollup.arbitrum.io/rpc',
  80002: 'https://rpc-amoy.polygon.technology',
  97: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
  44787: 'https://alfajores-forno.celo-testnet.org',
};

export function getPublicRpc(chainId: number): string {
  if (isEvmMainnetChainId(chainId)) {
    throw new Error('EVM mainnet access is disabled by the platform mainnet allowlist.');
  }
  const rpcUrl = PUBLIC_RPC[chainId];
  if (!rpcUrl) throw new Error(`Unsupported EVM chain ID: ${chainId}.`);
  return rpcUrl;
}

// Client.

export interface EvmCommunityInfo {
  tokenName: string | null;
  memberCount: number;
  proposalCount: number;
  treasuryBalanceWei: string | null;
}

export class BarazaEvmClient {
  private rpcUrl: string;
  private chainId: number;

  constructor(rpcUrl: string, chainId: number) {
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
  }

  /** Fetch high-level community info from the deployed contracts. */
  async fetchCommunityInfo(): Promise<EvmCommunityInfo> {
    const addrs = getEvmAddresses(this.chainId);
    if (!addrs) {
      return { tokenName: null, memberCount: 0, proposalCount: 0, treasuryBalanceWei: null };
    }

    const [nameRaw, supplyRaw, proposalCountRaw, balanceRaw] = await Promise.all([
      ethCall(this.rpcUrl, addrs.Token, NAME_SELECTOR),
      ethCall(this.rpcUrl, addrs.Token, TOTAL_SUPPLY_SELECTOR),
      ethCall(this.rpcUrl, addrs.Governor, PROPOSAL_COUNT_SELECTOR),
      this.fetchTreasuryBalance(addrs.Treasury),
    ]);

    // Decode ABI-encoded string (offset + length + bytes)
    let tokenName: string | null = null;
    if (nameRaw && nameRaw.length > 130) {
      try {
        const offset = parseInt(nameRaw.slice(2, 66), 16) * 2;
        const len = parseInt(nameRaw.slice(2 + offset, 66 + offset), 16);
        const bytes = nameRaw.slice(66 + offset, 66 + offset + len * 2);
        tokenName = decodeURIComponent(
          bytes.match(/.{2}/g)!.map((b) => '%' + b).join(''),
        );
      } catch {
        tokenName = null;
      }
    }

    return {
      tokenName,
      memberCount: supplyRaw ? decodeUint256(supplyRaw) : 0,
      proposalCount: proposalCountRaw ? decodeUint256(proposalCountRaw) : 0,
      treasuryBalanceWei: balanceRaw,
    };
  }

  /** Fetch ETH balance of the treasury contract in wei (as hex string). */
  async fetchTreasuryBalance(treasuryAddress: string): Promise<string | null> {
    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [treasuryAddress, 'latest'],
          id: 1,
        }),
      });
      const json = await res.json();
      return json.result ?? null;
    } catch {
      return null;
    }
  }

  /** Returns how many governance tokens a given address holds. */
  async fetchMemberTokenBalance(walletAddress: string): Promise<number> {
    const addrs = getEvmAddresses(this.chainId);
    if (!addrs) return 0;
    const data = BALANCE_OF_SELECTOR + padAddress(walletAddress);
    const raw = await ethCall(this.rpcUrl, addrs.Token, data);
    return raw ? decodeUint256(raw) : 0;
  }

  get addresses() {
    return getEvmAddresses(this.chainId);
  }
}

/** Factory: mirrors createBarazaReadClient() in the Solana client. */
export function createBarazaEvmReadClient(chainId: number): BarazaEvmClient {
  const rpcUrl = getPublicRpc(chainId);
  return new BarazaEvmClient(rpcUrl, chainId);
}
