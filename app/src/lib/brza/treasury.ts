import { getBrzaBalance } from '@/lib/adapters/stellar';
import { BRZA_PHASES, CURRENT_PHASE, formatBrza, formatLocal, type BrzaPhase } from '@/lib/brza/constants';

export interface CommunityTreasuryRecord {
  communityId: string;
  stellarAddress: string;
  localCurrency: string;
}

// In production this is hydrated from Supabase communities rows
const _registry = new Map<string, CommunityTreasuryRecord>();

export function registerTreasury(record: CommunityTreasuryRecord): void {
  _registry.set(record.communityId, record);
}

export function getTreasuryAddress(communityId: string): string | undefined {
  return _registry.get(communityId)?.stellarAddress;
}

export async function fetchTreasuryBalance(
  communityTreasuryAddress: string,
  localCurrency = 'KES',
  phase: BrzaPhase = CURRENT_PHASE,
): Promise<{ brza: string; local: string; raw: number; error?: string }> {
  const result = await getBrzaBalance(communityTreasuryAddress);
  if (result.error) return { brza: '0 BRZA', local: `${localCurrency} 0`, raw: 0, error: result.error };
  const raw = parseFloat(result.balance);
  const priceUsd = BRZA_PHASES[phase].priceUsd || BRZA_PHASES.phase0.priceUsd;
  return {
    brza: formatBrza(raw),
    local: formatLocal(raw * priceUsd, localCurrency),
    raw,
  };
}

export async function fetchTreasuryByCommunityId(
  communityId: string,
  phase: BrzaPhase = CURRENT_PHASE,
): Promise<{ brza: string; local: string; raw: number; error?: string }> {
  const record = _registry.get(communityId);
  if (!record) {
    return { brza: '0 BRZA', local: 'KES 0', raw: 0, error: 'No treasury registered for this community' };
  }
  return fetchTreasuryBalance(record.stellarAddress, record.localCurrency, phase);
}
