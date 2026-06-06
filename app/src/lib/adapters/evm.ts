import type { Chain } from '@/lib/chain';
import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';
import {
  baseGovernanceAddresses,
  castBaseGovernorVote,
  getBaseTokenBalance,
} from '@/lib/evm/base-governance';

const EVM_CHAINS = new Set<Chain>(['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb']);

/**
 * Baraza EVM chain adapter.
 *
 * Base chain wires real on-chain governance reads/writes when
 * VITE_BASE_GOVERNOR_ADDRESS and VITE_BASE_TOKEN_ADDRESS are configured.
 * All other EVM chains remain capability stubs pending testnet deployment.
 *
 * Note on Base governance.vote():
 *   proposalId must be the on-chain Governor bytes32 proposal hash
 *   (0x-prefixed hex string) — not the Baraza Supabase UUID.
 */
export function evmAdapter(chain: Chain): ChainAdapter {
  if (!EVM_CHAINS.has(chain)) throw new Error(`${chain} is not an EVM adapter rail.`);

  if (chain === 'base' && baseGovernanceAddresses()) {
    return baseAdapter();
  }

  const stub = (action: string): ChainActionResult => ({
    ok: false,
    chain,
    error: `${action} requires wagmi signing and verified testnet contract addresses.`,
  });

  return {
    chain,
    governance: {
      async vote() { return stub('EVM governance vote'); },
    },
    membership: {
      async verify() { return false; },
    },
  };
}

function baseAdapter(): ChainAdapter {
  return {
    chain: 'base',
    governance: {
      async vote({ proposalId, option, memberAddress }) {
        // proposalId must be the on-chain Governor bytes32 (0x-prefixed hex)
        if (!proposalId.startsWith('0x') || proposalId.length !== 66) {
          return { ok: false, chain: 'base', error: 'proposalId must be the on-chain Governor bytes32 proposal hash.' };
        }

        void memberAddress;

        const hash = await castBaseGovernorVote(proposalId as `0x${string}`, option);
        if (!hash) {
          return {
            ok: false,
            chain: 'base',
            error: 'Vote transaction failed. Check that your wallet is connected to Base and the proposal is active.',
          };
        }
        return { ok: true, chain: 'base', txHash: hash };
      },
    },
    membership: {
      async verify({ accountAddress }) {
        try {
          const balance = await getBaseTokenBalance(accountAddress as `0x${string}`);
          return balance > 0n;
        } catch {
          return false;
        }
      },
    },
  };
}
