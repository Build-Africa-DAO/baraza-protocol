import { formatUnits, parseUnits } from 'viem';
import { assertGoodDollarReady } from '@/lib/gooddollar/sdk';

export interface GoodDollarBalance {
  account: string;
  raw: bigint;
  formatted: string;
  symbol: 'G$';
}

export async function getGoodDollarBalance(account: string): Promise<GoodDollarBalance> {
  assertGoodDollarReady();
  return {
    account,
    raw: 0n,
    formatted: formatUnits(0n, 18),
    symbol: 'G$',
  };
}

export async function transferGoodDollar(input: {
  to: string;
  amount: string;
}): Promise<{ ok: false; reason: string; parsedAmount: bigint }> {
  assertGoodDollarReady();
  return {
    ok: false,
    reason: 'G$ transfer signing is waiting for the Celo adapter wallet signer.',
    parsedAmount: parseUnits(input.amount, 18),
  };
}
