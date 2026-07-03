import { CHAINS, type Chain } from '@/lib/chain';
import {
  CHAIN_TESTNET_NAMES,
  PLACEHOLDER_CONTRACT_ADDRESS,
  TESTNET_REQUIRED,
} from '@/lib/chains/constants';

export type ChainCapability =
  | 'governance'
  | 'membership'
  | 'bounty'
  | 'treasury'
  | 'payments'
  | 'identity'
  | 'token-minting'
  | 'notifications'
  | 'indexing'
  | 'storage';

export interface ChainContractAddresses {
  governance?: string;
  membership?: string;
  bounty?: string;
  treasury?: string;
  communityToken?: string;
  goodDollar?: string;
  goodDollarIdentity?: string;
}

export interface BarazaChainConfig {
  id: Chain;
  label: string;
  testnetName: string;
  testnetRequired: boolean;
  chainId?: number;
  rpcEnvVar?: string;
  defaultRpcUrl?: string;
  explorerUrl: string;
  suggestedWallet: string;
  nativeCurrency: string;
  capabilities: ChainCapability[];
  contracts: ChainContractAddresses;
  status: 'live' | 'testnet-ready' | 'partial' | 'coming-soon';
}

export const BARAZA_CHAIN_CONFIGS: Record<Chain, BarazaChainConfig> = {
  solana: {
    id: 'solana',
    label: CHAINS.solana.label,
    testnetName: CHAIN_TESTNET_NAMES.solana,
    testnetRequired: TESTNET_REQUIRED,
    rpcEnvVar: 'VITE_RPC_ENDPOINT',
    defaultRpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: CHAINS.solana.testnet.explorerUrl,
    suggestedWallet: CHAINS.solana.suggestedWallet,
    nativeCurrency: 'SOL',
    capabilities: ['governance', 'membership', 'bounty', 'treasury', 'token-minting'],
    contracts: {
      governance: import.meta.env.VITE_GOVERNANCE_PROGRAM_ID ?? PLACEHOLDER_CONTRACT_ADDRESS,
      membership: import.meta.env.VITE_MEMBERSHIP_PROGRAM_ID ?? PLACEHOLDER_CONTRACT_ADDRESS,
      treasury: import.meta.env.VITE_TREASURY_VAULT_PROGRAM_ID ?? PLACEHOLDER_CONTRACT_ADDRESS,
    },
    status: 'partial',
  },
  mpesa: {
    id: 'mpesa',
    label: CHAINS.mpesa.label,
    testnetName: CHAIN_TESTNET_NAMES.mpesa,
    testnetRequired: TESTNET_REQUIRED,
    explorerUrl: CHAINS.mpesa.testnet.explorerUrl,
    suggestedWallet: CHAINS.mpesa.suggestedWallet,
    nativeCurrency: 'KES',
    capabilities: ['payments', 'membership'],
    contracts: {},
    status: 'testnet-ready',
  },
  stellar: {
    id: 'stellar',
    label: CHAINS.stellar.label,
    testnetName: CHAIN_TESTNET_NAMES.stellar,
    testnetRequired: TESTNET_REQUIRED,
    rpcEnvVar: 'VITE_STELLAR_HORIZON_URL',
    defaultRpcUrl: 'https://horizon-testnet.stellar.org',
    explorerUrl: CHAINS.stellar.testnet.explorerUrl,
    suggestedWallet: CHAINS.stellar.suggestedWallet,
    nativeCurrency: 'XLM',
    capabilities: ['payments', 'treasury'],
    contracts: {
      treasury: import.meta.env.VITE_STELLAR_TREASURY_ACCOUNT ?? PLACEHOLDER_CONTRACT_ADDRESS,
    },
    status: 'testnet-ready',
  },
  celo: {
    id: 'celo',
    label: CHAINS.celo.label,
    testnetName: CHAIN_TESTNET_NAMES.celo,
    testnetRequired: TESTNET_REQUIRED,
    chainId: CHAINS.celo.testnet.chainId,
    rpcEnvVar: 'VITE_CELO_RPC_URL',
    defaultRpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorerUrl: CHAINS.celo.testnet.explorerUrl,
    suggestedWallet: CHAINS.celo.suggestedWallet,
    nativeCurrency: 'CELO',
    capabilities: ['bounty', 'identity', 'payments'],
    contracts: {
      goodDollar: import.meta.env.VITE_GOODDOLLAR_TOKEN_ADDRESS ?? PLACEHOLDER_CONTRACT_ADDRESS,
      goodDollarIdentity: import.meta.env.VITE_GOODDOLLAR_IDENTITY_ADDRESS ?? PLACEHOLDER_CONTRACT_ADDRESS,
    },
    status: 'coming-soon',
  },
  ethereum: evmConfig('ethereum', 'VITE_ETH_RPC_URL'),
  base: baseConfig(),
  arbitrum: evmConfig('arbitrum', 'VITE_ARBITRUM_RPC_URL'),
  optimism: evmConfig('optimism', 'VITE_OPTIMISM_RPC_URL'),
  polygon: evmConfig('polygon', 'VITE_POLYGON_RPC_URL'),
  bnb: evmConfig('bnb', 'VITE_BNB_RPC_URL', 'coming-soon'),
  xdc: evmConfig('xdc', 'VITE_XDC_RPC_URL', 'coming-soon'),
};

function baseConfig(): BarazaChainConfig {
  const meta = CHAINS.base;
  // Baraza has not deployed its own Manager on Base yet — placeholder until a
  // Baraza deployment lands. Do not fill in another protocol's addresses.
  // Provide a real deployment via VITE_BASE_MANAGER_ADDRESS.
  const managerAddr = import.meta.env.VITE_BASE_MANAGER_ADDRESS?.trim()
    ?? PLACEHOLDER_CONTRACT_ADDRESS;
  const governorAddr = import.meta.env.VITE_BASE_GOVERNOR_ADDRESS?.trim() ?? PLACEHOLDER_CONTRACT_ADDRESS;
  const tokenAddr = import.meta.env.VITE_BASE_TOKEN_ADDRESS?.trim() ?? PLACEHOLDER_CONTRACT_ADDRESS;
  const treasuryAddr = import.meta.env.VITE_BASE_TREASURY_ADDRESS?.trim() ?? PLACEHOLDER_CONTRACT_ADDRESS;
  const isConfigured = managerAddr !== PLACEHOLDER_CONTRACT_ADDRESS;
  return {
    id: 'base',
    label: meta.label,
    testnetName: CHAIN_TESTNET_NAMES.base,
    testnetRequired: TESTNET_REQUIRED,
    chainId: meta.testnet.chainId,
    rpcEnvVar: 'VITE_BASE_RPC_URL',
    defaultRpcUrl: undefined,
    explorerUrl: meta.testnet.explorerUrl,
    suggestedWallet: meta.suggestedWallet,
    nativeCurrency: meta.testnet.nativeSymbol,
    capabilities: ['governance', 'membership', 'treasury'],
    contracts: {
      governance: governorAddr,
      membership: tokenAddr,
      treasury: treasuryAddr,
    },
    status: isConfigured ? 'testnet-ready' : 'partial',
  };
}

function evmConfig(
  chain: Exclude<Chain, 'solana' | 'mpesa' | 'stellar' | 'celo'>,
  rpcEnvVar: string,
  status: BarazaChainConfig['status'] = 'partial',
): BarazaChainConfig {
  const meta = CHAINS[chain];
  return {
    id: chain,
    label: meta.label,
    testnetName: CHAIN_TESTNET_NAMES[chain],
    testnetRequired: TESTNET_REQUIRED,
    chainId: meta.testnet.chainId,
    rpcEnvVar,
    defaultRpcUrl: undefined,
    explorerUrl: meta.testnet.explorerUrl,
    suggestedWallet: meta.suggestedWallet,
    nativeCurrency: meta.testnet.nativeSymbol,
    capabilities: ['governance', 'membership'],
    contracts: {
      governance: PLACEHOLDER_CONTRACT_ADDRESS,
      membership: PLACEHOLDER_CONTRACT_ADDRESS,
      treasury: PLACEHOLDER_CONTRACT_ADDRESS,
    },
    status,
  };
}

export function getChainConfig(chain: Chain): BarazaChainConfig {
  return BARAZA_CHAIN_CONFIGS[chain];
}
