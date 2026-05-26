import type { Chain } from '@/lib/chain';
import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';

const EVM_CHAINS = new Set<Chain>(['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb']);

export function evmAdapter(chain: Chain): ChainAdapter {
  if (!EVM_CHAINS.has(chain)) throw new Error(`${chain} is not an EVM adapter rail.`);
  const result = (action: string): ChainActionResult => ({
    ok: false,
    chain,
    error: `${action} requires wagmi signing and verified testnet contract addresses.`,
  });

  return {
    chain,
    governance: {
      async vote() {
        return result('EVM governance vote');
      },
    },
    membership: {
      async verify() {
        return false;
      },
    },
  };
}
