import { getBrzaBalance } from '@/lib/adapters/stellar';
import {
  BRZA_TVL_TARGETS,
  CURRENT_PHASE,
  formatLocal,
  getBrzaPriceUsd,
  isBrzaPriceConfigured,
  type BrzaPhase,
} from '@/lib/brza/constants';

export type TvlPhase = 'building' | 'stellar_pool_ready' | 'solana_pool_ready' | 'launch_ready';

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
  // Targets ship unset (0) pending counsel review — an unconfigured target
  // is treated as not-yet-reached so the tracker stays in 'building'.
  const reached = (target: number) => target > 0 && usd >= target;
  if (reached(BRZA_TVL_TARGETS.launch))      return 'launch_ready';
  if (reached(BRZA_TVL_TARGETS.solanaPool))  return 'solana_pool_ready';
  if (reached(BRZA_TVL_TARGETS.stellarPool)) return 'stellar_pool_ready';
  return 'building';
}

export function getNextTarget(usd: number) {
  const targets = [
    { label: 'Expand Stellar treasury coverage', usd: BRZA_TVL_TARGETS.stellarPool },
    { label: 'Prepare multi-chain treasury readiness', usd: BRZA_TVL_TARGETS.solanaPool },
    { label: 'Complete the next protocol milestone', usd: BRZA_TVL_TARGETS.launch },
  ];
  const nextIdx = targets.findIndex(t => usd < t.usd);
  const next = nextIdx === -1 ? targets[targets.length - 1] : targets[nextIdx];
  const prevUsd = nextIdx > 0 ? targets[nextIdx - 1].usd : 0;
  const range = next.usd - prevUsd;
  return {
    label: next.label,
    usd: next.usd,
    remaining: Math.max(0, next.usd - usd),
    // Guard for unconfigured (placeholder) targets — no range means no progress bar.
    pct: range > 0 ? Math.max(0, Math.min(100, Math.round(((usd - prevUsd) / range) * 100))) : 0,
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
  // Phase prices ship unset pending counsel review — value the pool at 0
  // rather than throwing so the TVL surface stays functional.
  const priceUsd = isBrzaPriceConfigured(brzaPhase) ? getBrzaPriceUsd(brzaPhase) : 0;
  const totalUsd = totalBrza * priceUsd;
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
