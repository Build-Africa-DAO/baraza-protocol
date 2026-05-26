/**
 * Chain selection.
 *
 * Distinct from `lib/network.ts`, which selects the Solana cluster
 * (mainnet/devnet/testnet). This module is about which blockchain the
 * user is browsing. Solana handles membership credentials and governance.
 * Stellar is enabled as the payment/settlement rail. Base, Arbitrum,
 * Optimism, and Celo are enabled as EVM target rails for community setup, but
 * contract execution still remains gated by the governance-contract roadmap.
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
  accountLabel: string;
  suggestedWallet: string;
  walletExamples: string;
  accountCta: string;
  badgeBg: string;
  badgeText: string;
  enabled: boolean;
  comingSoon?: string;
}

const INTEGRATION_PENDING = 'Integration pending';
const GOVERNANCE_REVIEW = 'Governance review';

// Ethereum, Polygon, and BNB stay blocked until a concrete app/client path is
// selected. Base, Arbitrum, Optimism, and Celo are selectable for planning and
// persistence, with real execution gated by contract review.
export const CHAINS: Record<Chain, ChainMeta> = {
  solana: {
    id: 'solana',
    label: 'Solana',
    short: 'SOL',
    accountLabel: 'Solana account',
    suggestedWallet: 'Phantom',
    walletExamples: 'Phantom, Solflare, or Backpack',
    accountCta: 'Connect your Solana account',
    badgeBg: '#14F195',
    badgeText: '#0B132B',
    enabled: true,
  },
  stellar: {
    id: 'stellar',
    label: 'Stellar',
    short: 'XLM',
    accountLabel: 'Stellar account',
    suggestedWallet: 'Freighter',
    walletExamples: 'Freighter, Lobstr, or Albedo',
    accountCta: 'Connect your Stellar account',
    badgeBg: '#0066FF',
    badgeText: '#FFFFFF',
    enabled: true,
  },
  ethereum: {
    id: 'ethereum',
    label: 'Ethereum',
    short: 'ETH',
    accountLabel: 'Ethereum account',
    suggestedWallet: 'MetaMask',
    walletExamples: 'MetaMask, Coinbase Wallet, Rabby, or WalletConnect',
    accountCta: 'Connect your Ethereum account',
    badgeBg: '#627EEA',
    badgeText: '#FFFFFF',
    enabled: true,
    comingSoon: GOVERNANCE_REVIEW,
  },
  base: {
    id: 'base',
    label: 'Base',
    short: 'BASE',
    accountLabel: 'Base account',
    suggestedWallet: 'Coinbase Wallet',
    walletExamples: 'MetaMask, Coinbase Wallet, Rabby, or WalletConnect',
    accountCta: 'Connect your Base account',
    badgeBg: '#0052FF',
    badgeText: '#FFFFFF',
    enabled: true,
    comingSoon: GOVERNANCE_REVIEW,
  },
  arbitrum: {
    id: 'arbitrum',
    label: 'Arbitrum',
    short: 'ARB',
    accountLabel: 'Arbitrum account',
    suggestedWallet: 'Rabby',
    walletExamples: 'MetaMask, Coinbase Wallet, Rabby, or WalletConnect',
    accountCta: 'Connect your Arbitrum account',
    badgeBg: '#28A0F0',
    badgeText: '#FFFFFF',
    enabled: true,
    comingSoon: GOVERNANCE_REVIEW,
  },
  optimism: {
    id: 'optimism',
    label: 'Optimism',
    short: 'OP',
    accountLabel: 'Optimism account',
    suggestedWallet: 'MetaMask',
    walletExamples: 'MetaMask, Coinbase Wallet, Rabby, or WalletConnect',
    accountCta: 'Connect your Optimism account',
    badgeBg: '#FF0420',
    badgeText: '#FFFFFF',
    enabled: true,
    comingSoon: GOVERNANCE_REVIEW,
  },
  polygon: {
    id: 'polygon',
    label: 'Polygon',
    short: 'POL',
    accountLabel: 'Polygon account',
    suggestedWallet: 'MetaMask',
    walletExamples: 'MetaMask, Coinbase Wallet, Rabby, or WalletConnect',
    accountCta: 'Connect your Polygon account',
    badgeBg: '#8247E5',
    badgeText: '#FFFFFF',
    enabled: true,
    comingSoon: GOVERNANCE_REVIEW,
  },
  bnb: {
    id: 'bnb',
    label: 'BNB Chain',
    short: 'BNB',
    accountLabel: 'BNB Chain account',
    suggestedWallet: 'Trust Wallet',
    walletExamples: 'MetaMask, Trust Wallet, Binance Wallet, or WalletConnect',
    accountCta: 'Connect your BNB Chain account',
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
    accountLabel: 'Celo account',
    suggestedWallet: 'Valora',
    walletExamples: 'Valora, MetaMask, Coinbase Wallet, or WalletConnect',
    accountCta: 'Connect your Celo account',
    badgeBg: '#35D07F',
    badgeText: '#0B132B',
    enabled: true,
    comingSoon: GOVERNANCE_REVIEW,
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
    if (
      raw === 'solana' ||
      raw === 'stellar' ||
      raw === 'ethereum' ||
      raw === 'base' ||
      raw === 'arbitrum' ||
      raw === 'optimism' ||
      raw === 'polygon' ||
      raw === 'celo'
    ) return raw;
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
