/**
 * Chain selection: Solana vs Stellar.
 *
 * Distinct from `lib/network.ts`, which selects the Solana cluster
 * (mainnet/devnet/testnet). This module is about which blockchain the
 * user is browsing — Solana now, Stellar in Phase 2.
 */

export type Chain = 'solana' | 'stellar' | 'base' | 'ethereum';

export interface ChainMeta {
  id: Chain;
  label: string;
  short: string;
  badgeBg: string;
  badgeText: string;
  enabled: boolean;
  comingSoon?: string;
}

// Solana is the only currently-enabled chain. Others are placeholders to
// communicate the multi-chain roadmap; selecting them is blocked in
// ChainSelector and DB writes are rejected by the CHECK constraint in
// supabase/migrations/001_communities_governance_columns.sql.
//
// To actually enable Stellar (Phase 2): widen the DB CHECK + wire Soroban.
// To enable Base / Ethereum: integrate wagmi/RainbowKit alongside the
// Solana wallet adapter and add EVM-side program logic.
export const CHAINS: Record<Chain, ChainMeta> = {
  solana: {
    id: 'solana',
    label: 'Solana',
    short: 'SOL',
    badgeBg: '#14F195',
    badgeText: '#0B132B',
    enabled: true,
  },
  stellar: {
    id: 'stellar',
    label: 'Stellar',
    short: 'XLM',
    badgeBg: '#0066FF',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: 'Phase 2',
  },
  base: {
    id: 'base',
    label: 'Base',
    short: 'BASE',
    badgeBg: '#0052FF',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: 'Soon',
  },
  ethereum: {
    id: 'ethereum',
    label: 'Ethereum',
    short: 'ETH',
    badgeBg: '#627EEA',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: 'Soon',
  },
};

export const CHAIN_LIST: ChainMeta[] = [CHAINS.solana, CHAINS.stellar, CHAINS.base, CHAINS.ethereum];

const STORAGE_KEY = 'baraza:chain';
const DEFAULT_CHAIN: Chain = 'solana';

export function readStoredChain(): Chain {
  if (typeof window === 'undefined') return DEFAULT_CHAIN;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'solana' || raw === 'stellar') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_CHAIN;
}

export function writeStoredChain(chain: Chain): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, chain);
  } catch {
    /* ignore */
  }
}
