import type { Chain } from '@/lib/chain';

export const MAINNET_CHAINS = ['stellar'] as const satisfies readonly Chain[];

export function isMainnetChainAllowed(chain: Chain): boolean {
  return MAINNET_CHAINS.some((allowedChain) => allowedChain === chain);
}

export const EVM_MAINNET_CHAIN_IDS = [1, 10, 137, 8453, 42161, 42220] as const;

export function isEvmMainnetChainId(chainId: number): boolean {
  return EVM_MAINNET_CHAIN_IDS.some((mainnetChainId) => mainnetChainId === chainId);
}

export interface PurchasableVoteConfig {
  enabled: false;
  priceKes: null;
  complianceApprovalRequired: true;
}

// Research flagged capture and regulatory risk, so this schema remains unavailable behind the compliance gate.
export const PURCHASABLE_VOTES: PurchasableVoteConfig = {
  enabled: false,
  priceKes: null,
  complianceApprovalRequired: true,
};
