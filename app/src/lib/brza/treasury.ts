// OLD: reads lamports from custom PDA
// NEW: reads BRZA token balance from Stellar community treasury

import { getBrzaBalance } from '@/lib/adapters/stellar';
import { formatBrza, formatLocal } from '@/lib/brza/constants';

export async function fetchTreasuryBalance(
  communityTreasuryAddress: string,
  localCurrency = 'KES'
): Promise<{ brza: string; local: string; raw: number; error?: string }> {
  const result = await getBrzaBalance(communityTreasuryAddress);
  if (result.error) return { brza: '0 BRZA', local: `${localCurrency} 0`, raw: 0, error: result.error };
  const raw = parseFloat(result.balance);
  const usdValue = raw * 0.02; // phase0 price — update post-TGE
  return {
    brza: formatBrza(raw),
    local: formatLocal(usdValue, localCurrency),
    raw,
  };
}
