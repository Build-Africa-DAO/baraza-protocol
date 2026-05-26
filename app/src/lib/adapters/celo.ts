import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';
import { checkGoodDollarIdentity } from '@/lib/gooddollar/identity';

export const celoAdapter: ChainAdapter = {
  chain: 'celo',
  bounty: {
    async reward(): Promise<ChainActionResult> {
      return {
        ok: false,
        chain: 'celo',
        error: 'Celo G$ bounty rewards need GoodDollar token and signer configuration.',
      };
    },
  },
  identity: {
    async check({ accountAddress }) {
      return checkGoodDollarIdentity(accountAddress);
    },
  },
};
