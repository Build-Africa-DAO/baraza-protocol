import { getBrzaBalance } from '@/lib/adapters/stellar';
import { BRZA_ASSET, formatLocal } from '@/lib/brza/constants';

export type TvlPhase = 'building' | 'stellar_pool_ready' | 'solana_pool_ready' | 'ido_ready';

export interface TvlSnapshot {
  totalBrza: number;
  totalUsd: number;
  communityCount: number;
  memberCount: number;
  phase: TvlPhase;
  nextTarget: { label: string; usd: number; remaining: number; pct: number };
  displayLocal: string;
  updatedAt: number;
}

export function getPhase(usd: number): TvlPhase {
  if (usd >= BRZA_ASSET.tvlTargets.ido) return 'ido_ready';
  if (usd >= BRZA_ASSET.tvlTargets.solanaPool) return 'solana_pool_ready';
  if (usd >= BRZA_ASSET.tvlTargets.stellarPool) return 'stellar_pool_ready';
  return 'building';
}

export function getNextTarget(usd: number) {
  const targets = [
    { label: 'Launch BRZA/XLM on Stellar DEX', usd: BRZA_ASSET.tvlTargets.stellarPool },
    { label: 'Bridge BRZA to Solana', usd: BRZA_ASSET.tvlTargets.solanaPool },
    { label: 'Open public IDO', usd: BRZA_ASSET.tvlTargets.ido },
  ];
  const nextIdx = targets.findIndex(t => usd < t.usd);
  const next = nextIdx === -1 ? targets[targets.length - 1] : targets[nextIdx];
  const prevUsd = nextIdx > 0 ? targets[nextIdx - 1].usd : 0;
  const range = next.usd - prevUsd;
  const progress = usd - prevUsd;
  return {
    label: next.label,
    usd: next.usd,
    remaining: Math.max(0, next.usd - usd),
    pct: Math.min(100, Math.round((progress / range) * 100)),
  };
}

export async function fetchPlatformTvl(
  treasuryAddresses: string[],
  communityCount: number,
  memberCount: number,
): Promise<TvlSnapshot> {
  let totalBrza = 0;
  const results = await Promise.allSettled(treasuryAddresses.map(a => getBrzaBalance(a)));
  for (const r of results) {
    if (r.status === 'fulfilled' && !r.value.error) {
      totalBrza += parseFloat(r.value.balance);
    }
  }
  const totalUsd = totalBrza * BRZA_ASSET.phase0PriceUsd;
  return {
    totalBrza,
    totalUsd,
    communityCount,
    memberCount,
    phase: getPhase(totalUsd),
    nextTarget: getNextTarget(totalUsd),
    displayLocal: formatLocal(totalUsd, 'KES'),
    updatedAt: Date.now(),
  };
}
