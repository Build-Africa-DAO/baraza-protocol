import { getChainAdapter } from '@/lib/adapters';
import type { AccountCountry } from '@/lib/accountLocale';

const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

export interface AccountBalanceEstimate {
  formatted: string;
  nativeAmount: number;
}

function formatLocalAmount(value: number, country: AccountCountry): string {
  if (country.code === 'KE') return `KSh ${Math.round(value).toLocaleString('en-KE')}`;
  return new Intl.NumberFormat(country.locale, {
    style: 'currency',
    currency: country.currency,
    maximumFractionDigits: country.currency === 'USD' || country.currency === 'GBP' ? 2 : 0,
  }).format(value);
}

export async function fetchAccountBalanceEstimate(
  accountAddress: string,
  country: AccountCountry,
): Promise<AccountBalanceEstimate> {
  const balanceAdapter = getChainAdapter('solana').balance;
  if (!balanceAdapter) throw new Error('Account balance service is unavailable.');

  const nativeAmount = await balanceAdapter.getNative(accountAddress);
  if (nativeAmount === 0) return { formatted: formatLocalAmount(0, country), nativeAmount };

  const response = await fetch(PRICE_URL, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('The balance price quote is unavailable.');
  const data = await response.json() as { solana?: { usd?: number } };
  const usdPrice = data.solana?.usd;
  if (!Number.isFinite(usdPrice)) throw new Error('The balance price quote is unavailable.');

  return {
    formatted: formatLocalAmount((nativeAmount * (usdPrice as number)) / country.usdPerUnit, country),
    nativeAmount,
  };
}
