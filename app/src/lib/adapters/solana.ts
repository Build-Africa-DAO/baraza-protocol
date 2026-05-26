import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';

function preview(action: string): ChainActionResult {
  return {
    ok: false,
    chain: 'solana',
    error: `${action} is ready at the adapter boundary but requires Solana devnet program deployment before signing.`,
  };
}

export const solanaAdapter: ChainAdapter = {
  chain: 'solana',
  governance: {
    async vote() {
      return preview('Solana governance vote');
    },
  },
  membership: {
    async verify() {
      return false;
    },
  },
  bounty: {
    async reward() {
      return preview('Solana bounty reward');
    },
  },
  treasury: {
    async pay() {
      return preview('Solana treasury payment');
    },
  },
};
