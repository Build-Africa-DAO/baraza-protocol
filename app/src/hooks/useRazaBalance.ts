/**
 * useRazaBalance — returns a member's RAZA voting weight for a given community.
 *
 * RAZA is the governance weight stored in MemberAccount.voting_weight on-chain
 * and mirrored in the Supabase `memberships.voting_weight` column. Default is
 * 1 for every active member; elevated for governance roles (roadmap).
 *
 * Resolution order:
 *   1. Supabase memberships table (public SELECT, fastest)
 *   2. localStorage MembershipRecord.razaBalance (optimistic, offline-first)
 *   3. 0 (not a member / no data)
 *
 * On-chain MemberAccount read is intentionally deferred until programs are
 * deployed to devnet; the Supabase mirror is the source of truth until then.
 */

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/communities';
import { getActiveMembership } from '@/lib/memberships';

export interface RazaBalance {
  /** Current RAZA voting weight for this community. 0 = not a member. */
  balance: number;
  loading: boolean;
  /** Where the balance came from. */
  source: 'supabase' | 'local' | 'none';
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { balance: number; source: RazaBalance['source']; ts: number }>();

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

export function useRazaBalance(
  communityId: string | undefined,
  walletAddress: string | undefined,
): RazaBalance {
  const [state, setState] = useState<RazaBalance>({ balance: 0, loading: false, source: 'none' });

  useEffect(() => {
    if (!communityId || !walletAddress) {
      setState({ balance: 0, loading: false, source: 'none' });
      return;
    }

    const cacheKey = `${communityId}:${walletAddress}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setState({ balance: cached.balance, loading: false, source: cached.source });
      return;
    }

    // Optimistic local read while Supabase fetches
    const local = getActiveMembership(communityId, walletAddress);
    if (local) {
      setState({ balance: local.razaBalance, loading: true, source: 'local' });
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
        const fallback = local?.razaBalance ?? 0;
        const src: RazaBalance['source'] = fallback > 0 ? 'local' : 'none';
        cache.set(cacheKey, { balance: fallback, source: src, ts: Date.now() });
        setState({ balance: fallback, loading: false, source: src });
      }
    }).catch(() => {
      if (cancelled) return;
      const fallback = local?.razaBalance ?? 0;
      setState({ balance: fallback, loading: false, source: fallback > 0 ? 'local' : 'none' });
    });

    return () => { cancelled = true; };
  }, [communityId, walletAddress]);

  return state;
}

/**
 * Total RAZA balance across all communities for a wallet.
 * Sums voting_weight from all active/pending memberships.
 */
export async function fetchTotalRazaBalance(walletAddress: string): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;

  const { data, error } = await client
    .from('memberships')
    .select('voting_weight')
    .eq('wallet_address', walletAddress)
    .in('status', ['ACTIVE', 'PENDING']);

  if (error || !data) return 0;
  return (data as Array<{ voting_weight?: number | null }>)
    .reduce((sum, row) => sum + (row.voting_weight ?? 1), 0);
}
