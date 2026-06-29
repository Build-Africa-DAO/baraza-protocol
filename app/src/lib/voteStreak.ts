/**
 * Vote-streak multiplier — pure math (Phase 5).
 *
 * Designed in obs 1757 (Seku, 2026-06-16). Consecutive votes by the same
 * member in the same community grow their voting weight from 1.0× to a
 * 1.5× cap after 6 votes. Decay is graduated, not cliff-edged: one missed
 * proposal does NOT reset the streak (Nia filing 2026-06-20 id nx47 —
 * "absence that looks like departure, read by a system that cannot see
 * the agency of what is actually happening"). Reset triggers only on two
 * consecutive missed proposals, with a half-step decay in between
 * (1.5 → 1.25 on first missed pair, 1.25 → 1.0 on next).
 *
 * Computed from the existing `votes.cast_at` column — no new schema.
 *
 * NOT YET WIRED INTO GOVERNANCE. Council ruling 2026-06-20
 * (phase-5-vote-streak synthesis id ef8b): SHIP CONDITIONAL. Three
 * structural gates must close before integration into vote casting:
 *
 *   1. Per-community enabling vote at 1.0× flat (Kofi cond — Charter §4.2(b))
 *   2. Dual-record shadow baseline written on every vote (Zara cond —
 *      every vote row stores both the weighted outcome AND a 1.0× headcount
 *      shadow, so `weighted_outcome_divergence` can fire)
 *   3. USSD voting parity (Nia cond — currently menu.ts says "USSD voting
 *      opens soon"; members who cannot vote via USSD must not be docked
 *      for the access gap)
 *
 * Plus disclosures and signers Kofi names in his filing. Seku NULL FINDING
 * stands: the specific calibration (6 / 1.5× / two-consecutive-skip reset)
 * is protocol-invented — no DAO precedent. Disclosure text must say so.
 *
 * Until those three gates close, callers treat this as a preview helper
 * only. The default `currentVotingWeight` everywhere stays 1.0.
 */

const MULTIPLIER_FLOOR = 1.0;
const MULTIPLIER_CAP = 1.5;
const VOTES_TO_REACH_CAP = 6;
const PER_VOTE_INCREMENT = (MULTIPLIER_CAP - MULTIPLIER_FLOOR) / VOTES_TO_REACH_CAP;

export const VOTE_STREAK_CONSTANTS = {
  MULTIPLIER_FLOOR,
  MULTIPLIER_CAP,
  VOTES_TO_REACH_CAP,
  PER_VOTE_INCREMENT,
} as const;

export interface VoteRecord {
  /** ISO 8601 cast_at from the votes table. */
  castAt: string;
  /** The proposal_id of the vote (used for deduplication). */
  proposalId: string;
}

export interface ProposalRecord {
  proposalId: string;
  /** ISO 8601 endsAt — when the voting window closed. */
  endedAt: string;
}

/**
 * Result of walking a member's votes. `streak` is the count of consecutive
 * voted-on proposals from newest backward. `consecutiveSkipsAtBreak` is the
 * number of missed proposals encountered in the FIRST gap interval (i.e.
 * between vote[0] and vote[1]); used to pick the multiplier tier.
 *
 * Nia filing 2026-06-20: one missed proposal is noted, two is a
 * conversation, three is a sanction. The math mirrors that: one skip
 * holds the streak; two skips trigger half-step decay; the third resets.
 */
export interface VoteStreakWalk {
  streak: number;
  /** Count of consecutive missed proposals in the most-recent skip interval. */
  consecutiveSkipsAtBreak: number;
}

/**
 * Walk the member's vote history and return the streak + the size of the
 * first skip-gap encountered. The streak is forgiving: it does NOT break
 * on the first miss. Both the count of votes that ran consecutively and
 * the size of the most recent skip gap are returned, so the multiplier
 * function can apply half-step decay (Nia cond).
 *
 * @param votes — member's votes in this community (any order)
 * @param proposalsInWindow — proposals in this community whose endedAt
 *   falls between the member's first and latest vote, used to detect skips.
 *   Sort order doesn't matter.
 */
export function walkVoteStreak(
  votes: VoteRecord[],
  proposalsInWindow: ProposalRecord[],
): VoteStreakWalk {
  if (votes.length === 0) return { streak: 0, consecutiveSkipsAtBreak: 0 };

  // Dedup votes by proposalId (defensive — a member shouldn't have two votes
  // on the same proposal but the schema doesn't strictly prevent it).
  const byProposal = new Map<string, VoteRecord>();
  for (const v of votes) byProposal.set(v.proposalId, v);
  const sortedVotes = [...byProposal.values()].sort(
    (a, b) => new Date(b.castAt).getTime() - new Date(a.castAt).getTime(),
  );

  if (sortedVotes.length === 1) return { streak: 1, consecutiveSkipsAtBreak: 0 };

  const proposalEndMs = new Map<string, number>();
  for (const p of proposalsInWindow) {
    const t = new Date(p.endedAt).getTime();
    if (Number.isFinite(t)) proposalEndMs.set(p.proposalId, t);
  }

  // Walk from newest vote backward. Count the skips in each gap interval.
  // The streak HOLDS when the most recent gap has only 1 skip; DECAYS
  // (half-step) at 2 skips; RESETS at 3+ skips.
  let streak = 1;
  let firstGapSkipCount = 0;
  for (let i = 0; i < sortedVotes.length - 1; i++) {
    const newer = new Date(sortedVotes[i].castAt).getTime();
    const older = new Date(sortedVotes[i + 1].castAt).getTime();

    let skipsInThisGap = 0;
    for (const [pid, endedAt] of proposalEndMs) {
      if (endedAt > older && endedAt < newer && !byProposal.has(pid)) {
        skipsInThisGap += 1;
      }
    }

    if (i === 0) firstGapSkipCount = skipsInThisGap;

    // Two-or-more consecutive missed proposals breaks the streak walk.
    // One missed proposal is noted but the walk continues to the next vote.
    if (skipsInThisGap >= 2) break;
    streak += 1;
  }

  return { streak, consecutiveSkipsAtBreak: firstGapSkipCount };
}

/**
 * Back-compat alias — pre-Nia-ruling callers asked for a single number.
 * Returns the streak count from `walkVoteStreak`. New code should call
 * `walkVoteStreak` directly so the skip count is available for the
 * half-step decay tier.
 */
export function computeVoteStreak(
  votes: VoteRecord[],
  proposalsInWindow: ProposalRecord[],
): number {
  return walkVoteStreak(votes, proposalsInWindow).streak;
}

/**
 * Map a streak count to a voting-weight multiplier. Linear ramp from
 * 1.0× at streak=1 to the cap (1.5×) at streak=VOTES_TO_REACH_CAP.
 * Streak=0 returns the floor (1.0). Above-cap streaks stay capped.
 */
export function streakToMultiplier(streak: number): number {
  if (streak <= 1) return MULTIPLIER_FLOOR;
  if (streak >= VOTES_TO_REACH_CAP) return MULTIPLIER_CAP;
  return MULTIPLIER_FLOOR + (streak - 1) * PER_VOTE_INCREMENT;
}

/**
 * Half-step decay applied when a member has missed exactly ONE proposal
 * in their most recent skip-gap interval. The base multiplier is the
 * one their streak would otherwise earn; the decay halves the distance
 * from the floor, modelling "one absence noted" without resetting the
 * standing the member earned.
 */
export function applyHalfStepDecay(baseMultiplier: number): number {
  return MULTIPLIER_FLOOR + (baseMultiplier - MULTIPLIER_FLOOR) / 2;
}

/**
 * Convenience: compute the multiplier directly from votes + proposals.
 * Returns the floor (1.0) when no votes are present.
 *
 * Decay tiers (Nia filing 2026-06-20T02-13-48Z-nx47):
 *   - 0 skips in most recent gap interval → full streak multiplier
 *   - 1 skip                              → half-step decay applied to base
 *   - ≥2 skips                            → streak already broke; floor
 */
export function computeVoteMultiplier(
  votes: VoteRecord[],
  proposalsInWindow: ProposalRecord[],
): number {
  const walk = walkVoteStreak(votes, proposalsInWindow);
  const base = streakToMultiplier(walk.streak);
  if (walk.consecutiveSkipsAtBreak === 1) return applyHalfStepDecay(base);
  return base;
}

/**
 * Apply the multiplier to a base weight. Rounded to 4 decimals to avoid
 * float drift across PostgREST / Stellar boundaries.
 */
export function applyVoteMultiplier(baseWeight: number, multiplier: number): number {
  return Math.round(baseWeight * multiplier * 1e4) / 1e4;
}
