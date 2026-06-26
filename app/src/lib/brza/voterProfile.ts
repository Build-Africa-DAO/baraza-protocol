/**
 * Voter-profile producer — joins memberships, dues payments, votes, and
 * proposals to build a `VoterProfile` for each wallet voting in a retro
 * round. Replaces the weight=1.0-everywhere stub in retro-settle.ts.
 *
 * Server-only (uses the Supabase service-role client). Imported by:
 *   - api/communities/retro-settle.ts (at settlement time)
 *   - any future surface that wants to preview voter weight before vote close
 *
 * The composer touches four signals:
 *   - isActiveMember          ← memberships.status='active' in this community
 *   - duesStreakMonths        ← payment_orders → computeStreak (global)
 *   - voteStreakMultiplier    ← votes + proposals → computeVoteMultiplier
 *                                (per-community, since the vote-streak model
 *                                 is per-community)
 *   - hasVeteranBadge         ← earliest joined_at across all memberships
 *                                (≥90 days) → derived locally to avoid a round
 *                                trip through `/api/badges`
 *   - hasQuorumKeeperBadge    ← total vote count across all communities (≥5)
 *
 * Defensive defaults: any missing source returns the neutral value (active=false,
 * streak=0, multiplier=1.0, badges=false) so a partial outage cannot crash
 * settlement. The math module clamps and caps; a bad value falls through cleanly.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { computeStreak, STREAK_QUALIFYING_STATUSES } from '../duesStreak';
import { computeVoteMultiplier } from '../voteStreak';
import type { VoterProfile } from './retroRounds';

const VETERAN_BADGE_DAYS = 90;
const QUORUM_KEEPER_VOTE_THRESHOLD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

interface MembershipRow {
  wallet_address: string | null;
  community_id: string | null;
  status: string | null;
  joined_at: string | null;
}

interface PaymentRow {
  wallet_address: string | null;
  community_id: string | null;
  status: string | null;
  confirmed_at: string | null;
}

interface VoteRow {
  voter_wallet: string | null;
  community_id: string | null;
  proposal_id: string | null;
  cast_at: string | null;
}

interface ProposalRow {
  id: string | null;
  community_id: string | null;
  ends_at: string | null;
}

/**
 * Build voter profiles for a settlement run. One DB round-trip per signal,
 * then joined in memory — preferred over N queries per voter (which would
 * thrash the connection pool at chama-scale).
 */
export async function buildVoterProfiles(
  supabase: SupabaseClient,
  communityId: string,
  voterWallets: ReadonlyArray<string>,
): Promise<Map<string, VoterProfile>> {
  const profiles = new Map<string, VoterProfile>();
  if (voterWallets.length === 0) return profiles;

  const wallets = [...voterWallets];

  // Run the four signal queries in parallel.
  const [
    { data: communityMembers },
    { data: allMemberships },
    { data: payments },
    { data: votes },
    { data: proposals },
  ] = await Promise.all([
    supabase
      .from('memberships')
      .select('wallet_address, community_id, status, joined_at')
      .eq('community_id', communityId)
      .in('wallet_address', wallets),
    supabase
      .from('memberships')
      .select('wallet_address, community_id, status, joined_at')
      .in('wallet_address', wallets),
    supabase
      .from('payment_orders')
      .select('wallet_address, community_id, status, confirmed_at')
      .in('wallet_address', wallets)
      .in('status', [...STREAK_QUALIFYING_STATUSES])
      .not('confirmed_at', 'is', null),
    supabase
      .from('votes')
      .select('voter_wallet, community_id, proposal_id, cast_at')
      .eq('community_id', communityId)
      .in('voter_wallet', wallets),
    supabase
      .from('proposals')
      .select('id, community_id, ends_at')
      .eq('community_id', communityId)
      .not('ends_at', 'is', null),
  ]);

  const communityMembersTyped = (communityMembers ?? []) as MembershipRow[];
  const allMembershipsTyped = (allMemberships ?? []) as MembershipRow[];
  const paymentsTyped = (payments ?? []) as PaymentRow[];
  const votesTyped = (votes ?? []) as VoteRow[];
  const proposalsTyped = (proposals ?? []) as ProposalRow[];

  // Index signals by wallet so the per-voter loop is O(1) lookup.
  const activeInThisCommunity = new Set<string>(
    communityMembersTyped
      .filter((m) => m.status === 'active' && m.wallet_address)
      .map((m) => m.wallet_address as string),
  );

  const allMembershipsByWallet = new Map<string, MembershipRow[]>();
  for (const m of allMembershipsTyped) {
    if (!m.wallet_address) continue;
    const list = allMembershipsByWallet.get(m.wallet_address) ?? [];
    list.push(m);
    allMembershipsByWallet.set(m.wallet_address, list);
  }

  const paymentsByWallet = new Map<string, PaymentRow[]>();
  for (const p of paymentsTyped) {
    if (!p.wallet_address) continue;
    const list = paymentsByWallet.get(p.wallet_address) ?? [];
    list.push(p);
    paymentsByWallet.set(p.wallet_address, list);
  }

  const votesByWallet = new Map<string, VoteRow[]>();
  for (const v of votesTyped) {
    if (!v.voter_wallet) continue;
    const list = votesByWallet.get(v.voter_wallet) ?? [];
    list.push(v);
    votesByWallet.set(v.voter_wallet, list);
  }

  const proposalRecords = proposalsTyped
    .filter((p) => p.id && p.ends_at)
    .map((p) => ({ proposalId: p.id as string, endedAt: p.ends_at as string }));

  const now = Date.now();

  for (const wallet of wallets) {
    const isActiveMember = activeInThisCommunity.has(wallet);

    // Dues streak — global, across all communities this wallet has paid in.
    const walletPayments = paymentsByWallet.get(wallet) ?? [];
    const streakResult = computeStreak(
      walletPayments
        .filter((p) => p.confirmed_at && p.community_id)
        .map((p) => ({
          confirmedAt: p.confirmed_at as string,
          communityId: p.community_id as string,
        })),
    );

    // Vote-streak multiplier — per-community, since the existing model is
    // per-community proposal-skip.
    const walletVotes = votesByWallet.get(wallet) ?? [];
    const voteStreakMultiplier = computeVoteMultiplier(
      walletVotes
        .filter((v) => v.cast_at && v.proposal_id)
        .map((v) => ({
          castAt: v.cast_at as string,
          proposalId: v.proposal_id as string,
        })),
      proposalRecords,
    );

    // Veteran badge — earliest joined_at across any community ≥90 days ago.
    const walletMemberships = allMembershipsByWallet.get(wallet) ?? [];
    const joinedAts = walletMemberships
      .map((m) => m.joined_at)
      .filter((j): j is string => typeof j === 'string')
      .map((j) => new Date(j).getTime())
      .filter((t) => Number.isFinite(t));
    const earliestJoinedAt = joinedAts.length > 0 ? Math.min(...joinedAts) : null;
    const ageDays =
      earliestJoinedAt !== null ? (now - earliestJoinedAt) / DAY_MS : 0;
    const hasVeteranBadge = ageDays >= VETERAN_BADGE_DAYS;

    // Quorum-keeper badge — ≥5 votes across all communities.
    const totalVotes = walletVotes.length;
    const hasQuorumKeeperBadge = totalVotes >= QUORUM_KEEPER_VOTE_THRESHOLD;

    profiles.set(wallet, {
      wallet,
      isActiveMember,
      duesStreakMonths: streakResult.consecutiveMonthsPaid,
      voteStreakMultiplier,
      hasVeteranBadge,
      hasQuorumKeeperBadge,
    });
  }

  return profiles;
}
