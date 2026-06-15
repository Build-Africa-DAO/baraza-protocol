/**
 * useBrzaBalance — returns a member's BRZA voting weight for a given community.
 *
 * BRZA is the governance weight stored in MemberAccount.voting_weight on-chain
 * and mirrored in the Supabase `memberships.voting_weight` column. Default is
 * 1 for every active member; elevated for governance roles (roadmap).
 *
 * Resolution order:
 *   1. Supabase memberships table (public SELECT, fastest)
 *   2. localStorage MembershipRecord.brzaBalance (optimistic, offline-first)
 *   3. 0 (not a member / no data)
 *
 * On-chain MemberAccount read is intentionally deferred until programs are
 * deployed to devnet; the Supabase mirror is the source of truth until then.
 */

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/communities';
import { getActiveMembership } from '@/lib/memberships';

export interface BrzaBalance {
  /** Current BRZA voting weight for this community. 0 = not a member. */
  balance: number;
  loading: boolean;
  /** Where the balance came from. */
  source: 'supabase' | 'local' | 'none';
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { balance: number; source: BrzaBalance['source']; ts: number }>();

// Opportunistic eviction: drop entries older than the TTL whenever we touch
// the cache. Without this, entries stay forever — the existing TTL check
// only stops stale reads, it never frees the Map slot.
function sweepExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts >= CACHE_TTL_MS) cache.delete(key);
  }
}

async function fetchFromSupabase(communityId: string, walletAddress: string): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('memberships')
    .select('voting_weight')
    .eq('community_id', communityId)
    .eq('wallet_address', walletAddress)
    .in('status', ['ACTIVE', 'PENDING'])
    .maybeSingle();

  if (error || !data) return null;
  return (data as { voting_weight?: number | null }).voting_weight ?? 1;
}

export function useBrzaBalance(
  communityId: string | undefined,
  walletAddress: string | undefined,
): BrzaBalance {
  const [state, setState] = useState<BrzaBalance>({ balance: 0, loading: false, source: 'none' });

  useEffect(() => {
    if (!communityId || !walletAddress) {
      setState({ balance: 0, loading: false, source: 'none' });
      return;
    }

    const cacheKey = `${communityId}:${walletAddress}`;
    sweepExpiredCache();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setState({ balance: cached.balance, loading: false, source: cached.source });
      return;
    }

    // Optimistic local read while Supabase fetches
    const local = getActiveMembership(communityId, walletAddress);
    if (local) {
      setState({ balance: local.brzaBalance, loading: true, source: 'local' });
    } else {
      setState((s) => ({ ...s, loading: true }));
    }

    let cancelled = false;
    fetchFromSupabase(communityId, walletAddress).then((weight) => {
      if (cancelled) return;
      if (weight !== null) {
        cache.set(cacheKey, { balance: weight, source: 'supabase', ts: Date.now() });
        setState({ balance: weight, loading: false, source: 'supabase' });
      } else {
        // Supabase has no row yet (member just paid, write still propagating,
        // or simply not a member). Do NOT cache the fallback — caching it
        // would pin a stale 0 for up to CACHE_TTL_MS after the membership
        // row finally lands. Next remount re-fetches from Supabase.
        const fallback = local?.brzaBalance ?? 0;
        const src: BrzaBalance['source'] = fallback > 0 ? 'local' : 'none';
        setState({ balance: fallback, loading: false, source: src });
      }
    }).catch(() => {
      if (cancelled) return;
      const fallback = local?.brzaBalance ?? 0;
      setState({ balance: fallback, loading: false, source: fallback > 0 ? 'local' : 'none' });
    });

    return () => { cancelled = true; };
  }, [communityId, walletAddress]);

  return state;
}

