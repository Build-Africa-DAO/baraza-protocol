import type { Chain } from '@/lib/chain';

export const TESTNET_REQUIRED = true;

export const UMBRELLA_TREASURY_FLOOR_KES = 100_000;

export const GOODDOLLAR_TOKEN_SYMBOL = 'G$';

export const PLACEHOLDER_CONTRACT_ADDRESS = 'TBD_TESTNET_ADDRESS';

export const CHAIN_ACTIONS = {
  governanceVote: 'governance.vote',
  treasuryPay: 'treasury.pay',
  bountyReward: 'bounty.reward',
  membershipVerify: 'membership.verify',
  identityCheck: 'identity.check',
  dataQuery: 'data.query',
  storageSave: 'storage.save',
} as const;

export const CHAIN_TESTNET_NAMES: Record<Chain, string> = {
  solana: 'Solana Devnet',
  stellar: 'Stellar Testnet',
  ethereum: 'Sepolia',
  base: 'Base Sepolia',
  arbitrum: 'Arbitrum Sepolia',
  optimism: 'OP Sepolia',
  polygon: 'Polygon Amoy',
  bnb: 'BNB Smart Chain Testnet',
  celo: 'Celo Alfajores',
};

export const PLANNED_EXTERNAL_CHAINS = [
  'xdc',
  'near',
  'algorand',
  'hedera',
  'tron',
  'aptos',
  'sui',
  'flow',
  'chainlink',
] as const;
