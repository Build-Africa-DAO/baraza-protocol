import type { ChainActionResult } from '@/types';
import type { ChainAdapter } from '@/lib/adapters';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const rpcEndpoint = import.meta.env.VITE_RPC_ENDPOINT?.trim() || 'https://api.mainnet-beta.solana.com';

function preview(action: string): ChainActionResult {
  return {
    ok: false,
    chain: 'solana',
    error: `${action} is ready at the adapter boundary but requires Solana devnet program deployment before signing.`,
  };
}

export const solanaAdapter: ChainAdapter = {
  chain: 'solana',
  balance: {
    async getNative(accountAddress) {
      const publicKey = new PublicKey(accountAddress);
      const lamports = await new Connection(rpcEndpoint, 'confirmed').getBalance(publicKey, 'confirmed');
      return lamports / LAMPORTS_PER_SOL;
    },
  },
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
