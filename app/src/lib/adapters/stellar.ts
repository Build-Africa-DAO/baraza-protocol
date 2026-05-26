import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';

export const stellarAdapter: ChainAdapter = {
  chain: 'stellar',
  treasury: {
    async pay(): Promise<ChainActionResult> {
      return {
        ok: false,
        chain: 'stellar',
        error: 'Stellar treasury payouts require treasury signer custody and payout approval endpoints.',
      };
    },
  },
};
