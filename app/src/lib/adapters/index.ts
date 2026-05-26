import type { Chain } from '@/lib/chain';
import type { Bounty, ChainActionResult, RewardToken, VoteOption } from '@/types';
import { celoAdapter } from '@/lib/adapters/celo';
import { evmAdapter } from '@/lib/adapters/evm';
import { solanaAdapter } from '@/lib/adapters/solana';
import { stellarAdapter } from '@/lib/adapters/stellar';

export interface GovernanceAdapter {
  vote(input: { proposalId: string; option: VoteOption; memberAddress: string }): Promise<ChainActionResult>;
}

export interface TreasuryAdapter {
  pay(input: { communityId: string; recipient: string; amount: string; currency: string }): Promise<ChainActionResult>;
}

export interface BountyAdapter {
  reward(input: { bounty: Bounty; recipient: string; token: RewardToken }): Promise<ChainActionResult>;
}

export interface MembershipAdapter {
  verify(input: { communityId: string; accountAddress: string; assetAddress?: string }): Promise<boolean>;
}

export interface IdentityAdapter {
  check(input: { accountAddress: string }): Promise<boolean>;
}

export interface ChainAdapter {
  chain: Chain;
  governance?: GovernanceAdapter;
  treasury?: TreasuryAdapter;
  bounty?: BountyAdapter;
  membership?: MembershipAdapter;
  identity?: IdentityAdapter;
}

const adapters: Partial<Record<Chain, ChainAdapter>> = {
  solana: solanaAdapter,
  stellar: stellarAdapter,
  celo: celoAdapter,
  ethereum: evmAdapter('ethereum'),
  base: evmAdapter('base'),
  arbitrum: evmAdapter('arbitrum'),
  optimism: evmAdapter('optimism'),
  polygon: evmAdapter('polygon'),
  bnb: evmAdapter('bnb'),
};

export function getChainAdapter(chain: Chain): ChainAdapter {
  const adapter = adapters[chain];
  if (!adapter) throw new Error(`${chain} adapter is not available yet.`);
  return adapter;
}

export { solanaAdapter } from '@/lib/adapters/solana';
export { stellarAdapter } from '@/lib/adapters/stellar';
export { celoAdapter } from '@/lib/adapters/celo';
export { evmAdapter } from '@/lib/adapters/evm';
