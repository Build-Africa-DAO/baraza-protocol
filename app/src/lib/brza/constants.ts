const _stellarNetwork = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';

export const BRZA_ASSET = {
  code: 'BRZA',
  name: 'Baraza Token',
  issuerAddress: import.meta.env.VITE_BRZA_ISSUER_ADDRESS || '',
  distributorAddress: import.meta.env.VITE_BRZA_DISTRIBUTOR_ADDRESS || '',
  totalSupply: 1_000_000_000,
  decimals: 7,
  network: _stellarNetwork as 'testnet' | 'mainnet',
  horizonUrl: _stellarNetwork === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org',
  launchPriceUsd: 0.10,
  phase0PriceUsd: 0.02,
  fees: {
    treasuryTxPct: 0.02,
    swapPct: 0.005,
  },
  tvlTargets: {
    stellarPool: 50_000,
    solanaPool: 200_000,
    ido: 500_000,
  },
  allocation: {
    communityRewards: 200_000_000,
    founderA:          75_000_000,
    founderB:          75_000_000,
    operations:       150_000_000,
    publicSale:       120_000_000,
    reserve:          100_000_000,
    liquidityPool:     80_000_000,
    referral:          80_000_000,
    grants:            70_000_000,
    events:            50_000_000,
  },
} as const;

export const FIAT_RATES: Record<string, number> = {
  KES: 0.0077, UGX: 0.00027, TZS: 0.00039,
  NGN: 0.00063, GHS: 0.067, ZAR: 0.054,
  ETB: 0.0091, USD: 1.0, EUR: 1.08, GBP: 1.27,
};

export function convertToBrza(
  amount: number,
  currency: string,
  brzaPriceUsd = BRZA_ASSET.phase0PriceUsd
): { brzaAmount: number; usdValue: number } {
  const rate = FIAT_RATES[currency.toUpperCase()] ?? 1;
  const usdValue = amount * rate;
  const brzaAmount = Math.round((usdValue / brzaPriceUsd) * 1e7) / 1e7;
  return { brzaAmount, usdValue };
}

export function formatBrza(amount: number): string {
  return `${amount.toLocaleString('en-KE', { maximumFractionDigits: 2 })} BRZA`;
}

export function formatLocal(usdValue: number, currency = 'KES'): string {
  const rate = FIAT_RATES[currency.toUpperCase()] ?? 1;
  const local = usdValue / rate;
  return `${currency} ${local.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}
