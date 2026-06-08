import type { Chain } from '@/lib/chain';
import type { Bounty, ChainActionResult, RewardToken, VoteOption } from '@/types';
import { celoAdapter } from '@/lib/adapters/celo';
import { evmAdapter } from '@/lib/adapters/evm';
import { solanaAdapter } from '@/lib/adapters/solana';
import { stellarAdapter } from '@/lib/adapters/stellar';
import * as stellarFns from '@/lib/adapters/stellar';
import * as kotani from '@/lib/adapters/kotani';
import * as minisend from '@/lib/adapters/minisend';
import { convertToBrza } from '@/lib/brza/constants';
import { getOnRampQuote, executeOnRamp } from '@/lib/brza/onramp';
import { getOffRampQuote, executeOffRamp } from '@/lib/brza/offramp';
import { getPoolStats, getBrzaUsdcPoolId } from '@/lib/brza/liquidity';

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
  const a = adapters[chain];
  if (!a) throw new Error(`${chain} adapter is not available yet.`);
  return a;
}

export { solanaAdapter } from '@/lib/adapters/solana';
export { stellarAdapter } from '@/lib/adapters/stellar';
export { celoAdapter } from '@/lib/adapters/celo';
export { evmAdapter } from '@/lib/adapters/evm';

// BRZA adapter — single entry point for all BRZA/Stellar/payment operations
export const adapter = {
  treasury: {
    create:          stellarFns.createCommunityTreasury,
    getBalance:      stellarFns.getBrzaBalance,
    pay:             stellarFns.sendBrza,
    massDistribute:  stellarFns.massPay,
  },
  brza: {
    getBalance:  stellarFns.getBrzaBalance,
    transfer:    stellarFns.sendBrza,
    trustline:   stellarFns.createBrzaTrustline,
  },
  payments: {
    mpesaIn:     kotani.mpesaToBrza,
    mpesaOut:    kotani.brzaToMpesa,
    usdcOut:     minisend.usdcToMpesa,
    checkStatus: kotani.checkStatus,
  },
  stablecoin: {
    getOnRampQuote,
    executeOnRamp,
    getOffRampQuote,
    executeOffRamp,
    getSwapQuote: stellarFns.getSwapQuote,
    swap:         stellarFns.swapExactSend,
    getPoolStats,
    getPoolId:    getBrzaUsdcPoolId,
    getAllBalances: stellarFns.getAllBalances,
  },
};

export async function processMembershipPayment(params: {
  phone?: string;
  amount: number;
  currency: string;
  communityTreasuryAddress: string;
  communityCode: string;
}): Promise<{ success: boolean; pending?: boolean; brzaAllocated: number; reference?: string; error?: string }> {
  const { brzaAmount } = convertToBrza(params.amount, params.currency);

  if (!params.phone) {
    return { success: false, brzaAllocated: 0, error: 'A phone number is required to verify the M-Pesa payment.' };
  }

  const result = await kotani.mpesaToBrza({
    phone: params.phone,
    kesAmount: params.amount,
    destinationAddress: params.communityTreasuryAddress,
    communityCode: params.communityCode,
  });

  if (result.status === 'failed') {
    return { success: false, brzaAllocated: 0, error: result.error };
  }

  if (result.status !== 'completed') {
    return { success: false, pending: true, brzaAllocated: 0, reference: result.reference };
  }

  return { success: true, brzaAllocated: brzaAmount, reference: result.reference };
}
