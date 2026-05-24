/**
 * Chain selection.
 *
 * Distinct from `lib/network.ts`, which selects the Solana cluster
 * (mainnet/devnet/testnet). This module is about which blockchain the
 * user is browsing. Solana handles membership credentials and governance.
 * Stellar is enabled as the payment/settlement rail. EVM chains stay disabled
 * until app clients, addresses, and transaction flows are wired in.
 */

export type Chain =
  | 'solana'
  | 'stellar'
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'bnb'
  | 'celo';

export interface ChainMeta {
  id: Chain;
  label: string;
  short: string;
  badgeBg: string;
  badgeText: string;
  enabled: boolean;
  comingSoon?: string;
}

const INTEGRATION_PENDING = 'Integration pending';

// EVM contracts may exist, but selecting them is blocked until app clients,
// addresses, and transaction flows are wired in. ChainSelector blocks disabled
// chains, and DB writes are rejected by the CHECK constraint in
// supabase/migrations/001_communities_governance_columns.sql.
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
    enabled: true,
  },
  ethereum: {
    id: 'ethereum',
    label: 'Ethereum',
    short: 'ETH',
    badgeBg: '#627EEA',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
  base: {
    id: 'base',
    label: 'Base',
    short: 'BASE',
    badgeBg: '#0052FF',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
  arbitrum: {
    id: 'arbitrum',
    label: 'Arbitrum',
    short: 'ARB',
    badgeBg: '#28A0F0',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
  optimism: {
    id: 'optimism',
    label: 'Optimism',
    short: 'OP',
    badgeBg: '#FF0420',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
  polygon: {
    id: 'polygon',
    label: 'Polygon',
    short: 'POL',
    badgeBg: '#8247E5',
    badgeText: '#FFFFFF',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
  bnb: {
    id: 'bnb',
    label: 'BNB Chain',
    short: 'BNB',
    badgeBg: '#F3BA2F',
    badgeText: '#0B132B',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
  celo: {
    // Mobile-first L1, designed for emerging markets. It is the strongest EVM
    // fit for Baraza's chama / SACCO users once EVM app support is wired.
    id: 'celo',
    label: 'Celo',
    short: 'CELO',
    badgeBg: '#35D07F',
    badgeText: '#0B132B',
    enabled: false,
    comingSoon: INTEGRATION_PENDING,
  },
};

export const CHAIN_LIST: ChainMeta[] = [
  CHAINS.solana,
  CHAINS.stellar,
  CHAINS.ethereum,
  CHAINS.base,
  CHAINS.arbitrum,
  CHAINS.optimism,
  CHAINS.polygon,
  CHAINS.bnb,
  CHAINS.celo,
];

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
