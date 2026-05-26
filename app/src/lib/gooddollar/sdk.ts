import { BARAZA_CHAIN_CONFIGS } from '@/lib/chains/config';

export interface GoodDollarConfig {
  tokenAddress: string;
  identityAddress: string;
  rpcUrl: string;
  enabled: boolean;
}

export function getGoodDollarConfig(): GoodDollarConfig {
  const celo = BARAZA_CHAIN_CONFIGS.celo;
  const tokenAddress = import.meta.env.VITE_GOODDOLLAR_TOKEN_ADDRESS ?? '';
  const identityAddress = import.meta.env.VITE_GOODDOLLAR_IDENTITY_ADDRESS ?? '';
  const rpcUrl = import.meta.env.VITE_CELO_RPC_URL ?? celo.defaultRpcUrl ?? '';

  return {
    tokenAddress,
    identityAddress,
    rpcUrl,
    enabled: Boolean(tokenAddress && identityAddress && rpcUrl),
  };
}

export function assertGoodDollarReady(): GoodDollarConfig {
  const config = getGoodDollarConfig();
  if (!config.enabled) {
    throw new Error('GoodDollar testnet config is missing. Add Celo RPC, G$ token, and identity contract addresses.');
  }
  return config;
}
