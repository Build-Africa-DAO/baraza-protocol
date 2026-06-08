import { getBrzaBalance } from '@/lib/adapters/stellar';
import { BRZA_TVL_TARGETS, CURRENT_PHASE, formatLocal, getBrzaPriceUsd, type BrzaPhase } from '@/lib/brza/constants';
import { getPoolStats } from './liquidity';

export type TvlPhase = 'building' | 'stellar_pool_ready' | 'solana_pool_ready' | 'ido_ready';

export interface TvlSnapshot {
  totalBrza: number;
  totalUsd: number;
  communityCount: number;
  memberCount: number;
  phase: TvlPhase;
  nextTarget: { label: string; usd: number; remaining: number; pct: number };
  displayLocal: string;
  breakdown: { communityTreasuries: number; liquidityPool: number };
  updatedAt: number;
}

export function getPhase(usd: number): TvlPhase {
  if (usd >= BRZA_TVL_TARGETS.ido)         return 'ido_ready';
  if (usd >= BRZA_TVL_TARGETS.solanaPool)  return 'solana_pool_ready';
  if (usd >= BRZA_TVL_TARGETS.stellarPool) return 'stellar_pool_ready';
  return 'building';
}

export function getNextTarget(usd: number) {
  const targets = [
    { label: 'Launch BRZA/XLM on Stellar DEX', usd: BRZA_TVL_TARGETS.stellarPool },
    { label: 'Bridge BRZA to Solana',           usd: BRZA_TVL_TARGETS.solanaPool },
    { label: 'Open public IDO',                 usd: BRZA_TVL_TARGETS.ido },
  ];
  const nextIdx = targets.findIndex(t => usd < t.usd);
  const next = nextIdx === -1 ? targets[targets.length - 1] : targets[nextIdx];
  const prevUsd = nextIdx > 0 ? targets[nextIdx - 1].usd : 0;
  const range = next.usd - prevUsd;
  return {
    label: next.label,
    usd: next.usd,
    remaining: Math.max(0, next.usd - usd),
    pct: Math.max(0, Math.min(100, Math.round(((usd - prevUsd) / range) * 100))),
  };
}

export async function fetchPlatformTvl(
  treasuryAddresses: string[],
  communityCount: number,
  memberCount: number,
  brzaPhase: BrzaPhase = CURRENT_PHASE,
): Promise<TvlSnapshot> {
  let totalBrza = 0;
  const results = await Promise.allSettled(treasuryAddresses.map(a => getBrzaBalance(a)));
  for (const r of results) {
    if (r.status === 'fulfilled' && !r.value.error) {
      const balance = parseFloat(r.value.balance);
      if (Number.isFinite(balance)) totalBrza += balance;
    }
  }
  const poolStats = await getPoolStats();
  const poolTvlUsd = poolStats.tvlUsdc ?? 0;

  const priceUsd = getBrzaPriceUsd(brzaPhase);
  const communityTvlUsd = totalBrza * priceUsd;
  const totalUsd = communityTvlUsd + poolTvlUsd;

  return {
    totalBrza,
    totalUsd,
    communityCount,
    memberCount,
    phase: getPhase(totalUsd),
    nextTarget: getNextTarget(totalUsd),
    displayLocal: formatLocal(totalUsd, 'KES'),
    breakdown: { communityTreasuries: communityTvlUsd, liquidityPool: poolTvlUsd },
    updatedAt: Date.now(),
  };
}
