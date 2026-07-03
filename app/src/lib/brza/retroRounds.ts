/**
 * Retroactive BRZA rounds — Tier 1, per-community, weekly.
 *
 * Model rationale (see CLAUDE.md and the RetroPGF design note 2026-06-19):
 *   - Per-event reward calibration is brittle; retro rounds are self-tuning
 *     because the pool is fixed and voters allocate within it.
 *   - Cap-table separation: badges stay status-only. Retro votes are the
 *     bridge between gamification (voter weight comes from streaks + badges)
 *     and the cap-table (BRZA actually flows).
 *   - No losers at the chama scale: every active voter receives a baseline
 *     allocation before the multiplier from peer votes is applied.
 *
 * This module is pure logic — types, pool sizing, voter weighting, allocation.
 * No DB, no SDK, no HTTP. The persistence layer (migration 019) and admin
 * surface consume these functions.
 */

import { BRZA_EMISSION } from './constants';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export type RetroRoundStatus = 'open' | 'voting' | 'allocated' | 'settled';

export interface RetroRound {
  readonly id: string;
  readonly communityId: string;
  /** Period start (ISO 8601). Contributions inside this window are voteable. */
  readonly periodStart: string;
  /** Period end (ISO 8601, exclusive). */
  readonly periodEnd: string;
  /** BRZA pool size allocated to this round (whole BRZA, not atomic units). */
  readonly poolBrza: number;
  /** When the voting window closes. */
  readonly votingClosesAt: string;
  readonly status: RetroRoundStatus;
}

export interface RetroVote {
  readonly roundId: string;
  readonly voterWallet: string;
  /**
   * Recipient wallet → weight (integers 0-100). The sum of values across
   * recipients must equal 100. Voters cannot allocate to themselves; the
   * allocation algorithm filters self-votes silently rather than erroring.
   */
  readonly allocations: Readonly<Record<string, number>>;
}

export interface VoterProfile {
  readonly wallet: string;
  /** True when the wallet holds an active membership in the community. */
  readonly isActiveMember: boolean;
  /** Consecutive months with confirmed dues payment (0+). Capped at 12. */
  readonly duesStreakMonths: number;
  /**
   * Vote-streak multiplier (1.0 - 1.5) — the value emitted by the per-community
   * proposal-skip streak in `app/src/lib/voteStreak.ts`. 1.0 is the floor; the
   * cap is `VOTE_STREAK_CONSTANTS.MULTIPLIER_CAP` (1.5).
   *
   * Passed in directly rather than recomputed here so the retro module stays
   * decoupled from the voting schema. Default 1.0 when unspecified.
   */
  readonly voteStreakMultiplier?: number;
  /** True if the wallet has earned the Veteran badge (90+ days active). */
  readonly hasVeteranBadge?: boolean;
  /** True if the wallet has earned the Quorum-keeper badge (5+ votes). */
  readonly hasQuorumKeeperBadge?: boolean;
}

export interface RetroAllocation {
  readonly recipientWallet: string;
  readonly brzaAllocated: number;
  /** Share of weighted votes (0-1) this recipient earned. */
  readonly voteShare: number;
  /** Baseline component (uniform per active voter) vs vote-driven multiplier. */
  readonly baselineBrza: number;
  readonly multiplierBrza: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Pool sizing
// ──────────────────────────────────────────────────────────────────────────

/**
 * The fraction of the monthly emission cap dedicated to the retro flow.
 * Currently aligned to the declared `governanceRewardPct` share of the
 * monthly emission cap (`BRZA_EMISSION.monthlyCapTokens`, unset pending
 * counsel review — retro pools are 0 until it is configured at launch).
 *
 * Per-community share is a function of active membership weight; per-round
 * (weekly) pool = monthly share / 4.33.
 */
const WEEKS_PER_MONTH = 4.33;
const RETRO_MONTHLY_SHARE_OF_CAP = BRZA_EMISSION.governanceRewardPct;

/**
 * Compute the BRZA pool for a single community's weekly retro round.
 *
 * - `communityActiveMembers` — count of wallets with active membership.
 * - `totalActiveMembersAcrossProtocol` — denominator across all communities.
 *
 * Returns a whole-BRZA amount (floored). Returns 0 when the community has no
 * active members or when the protocol-wide denominator is 0.
 */
export function computeWeeklyRetroPool(
  communityActiveMembers: number,
  totalActiveMembersAcrossProtocol: number,
): number {
  if (communityActiveMembers <= 0) return 0;
  if (totalActiveMembersAcrossProtocol <= 0) return 0;

  const monthlyCap = BRZA_EMISSION.monthlyCapTokens;
  const protocolWideMonthly = monthlyCap * RETRO_MONTHLY_SHARE_OF_CAP;
  const communityMonthly =
    protocolWideMonthly * (communityActiveMembers / totalActiveMembersAcrossProtocol);

  return Math.floor(communityMonthly / WEEKS_PER_MONTH);
}

// ──────────────────────────────────────────────────────────────────────────
// Voter weight
// ──────────────────────────────────────────────────────────────────────────

const DUES_STREAK_CAP_MONTHS = 12;
const DUES_STREAK_MULTIPLIER = 0.08; // up to ~1.96x at 12mo
const VOTE_MULTIPLIER_FLOOR = 1.0;
const VOTE_MULTIPLIER_CAP = 1.5; // matches VOTE_STREAK_CONSTANTS.MULTIPLIER_CAP
const VETERAN_BADGE_BONUS = 0.15;
const QUORUM_KEEPER_BONUS = 0.15;
const VOTER_WEIGHT_CAP = 3.0;

/**
 * Compute a voter's weight in a retro round.
 *
 * weight = activeMember
 *   × (1 + duesStreak × 0.08)                // capped at 12mo
 *   × voteStreakMultiplier                   // 1.0 floor, 1.5 cap
 *   × (1 + veteranBadge × 0.15)
 *   × (1 + quorumKeeperBadge × 0.15)
 *
 * Capped at 3.0. Returns 0 when the wallet is not an active member. The
 * voteStreakMultiplier is passed in directly from `computeVoteMultiplier`
 * in voteStreak.ts; values outside [1.0, 1.5] are clamped.
 */
export function computeVoterWeight(profile: VoterProfile): number {
  if (!profile.isActiveMember) return 0;

  const duesStreak = Math.min(profile.duesStreakMonths, DUES_STREAK_CAP_MONTHS);
  const voteMultiplier = Math.min(
    Math.max(profile.voteStreakMultiplier ?? VOTE_MULTIPLIER_FLOOR, VOTE_MULTIPLIER_FLOOR),
    VOTE_MULTIPLIER_CAP,
  );

  let weight = 1;
  weight *= 1 + duesStreak * DUES_STREAK_MULTIPLIER;
  weight *= voteMultiplier;
  if (profile.hasVeteranBadge) weight *= 1 + VETERAN_BADGE_BONUS;
  if (profile.hasQuorumKeeperBadge) weight *= 1 + QUORUM_KEEPER_BONUS;

  return Math.min(weight, VOTER_WEIGHT_CAP);
}

// ──────────────────────────────────────────────────────────────────────────
// Allocation
// ──────────────────────────────────────────────────────────────────────────

/**
 * Share of the round pool reserved as a baseline distribution to every active
 * voter, regardless of peer-vote outcome. Chama-scale dignity: nobody who
 * showed up walks away empty-handed.
 */
const BASELINE_POOL_SHARE = 0.30;

/** Allocate a retro round's BRZA pool given votes and voter profiles.
 *
 * Algorithm:
 *   1. Filter self-votes silently.
 *   2. Normalize each voter's allocations to 100 (defensive — UI enforces this).
 *   3. Voter weight derived from {@link computeVoterWeight}.
 *   4. Split pool: 30% baseline distributed equally to every active voter who
 *      cast a non-empty ballot; 70% multiplier distributed proportional to
 *      weighted vote share.
 *   5. Floor: recipients receiving < 1 BRZA are zeroed and their share is
 *      redistributed proportionally among the remaining recipients.
 *
 * Returns an allocation per recipient, sorted by descending BRZA.
 *
 * Validates that every voter referenced in `votes` has a matching profile in
 * `voterProfiles`; voters without a profile are skipped (no weight).
 */
export function allocateRetroRound(
  round: Pick<RetroRound, 'poolBrza'>,
  votes: readonly RetroVote[],
  voterProfiles: ReadonlyMap<string, VoterProfile>,
): RetroAllocation[] {
  if (round.poolBrza <= 0 || votes.length === 0) return [];

  const baselinePool = Math.floor(round.poolBrza * BASELINE_POOL_SHARE);
  const multiplierPool = round.poolBrza - baselinePool;

  // Active voters (for baseline + multiplier weighting)
  const activeBallots = votes.filter((v) => {
    const profile = voterProfiles.get(v.voterWallet);
    return profile && computeVoterWeight(profile) > 0;
  });

  if (activeBallots.length === 0) return [];

  // Per-recipient weighted vote tally
  const weightedTally = new Map<string, number>();
  let totalWeightedVotes = 0;

  for (const ballot of activeBallots) {
    const profile = voterProfiles.get(ballot.voterWallet);
    if (!profile) continue;
    const voterWeight = computeVoterWeight(profile);
    if (voterWeight <= 0) continue;

    // Filter self-votes and normalize the rest to 100
    const filtered: Record<string, number> = {};
    let sum = 0;
    for (const [recipient, weight] of Object.entries(ballot.allocations)) {
      if (recipient === ballot.voterWallet) continue;
      if (weight <= 0) continue;
      filtered[recipient] = weight;
      sum += weight;
    }
    if (sum <= 0) continue;

    for (const [recipient, weight] of Object.entries(filtered)) {
      const normalized = (weight / sum) * 100;
      const contribution = voterWeight * normalized;
      weightedTally.set(recipient, (weightedTally.get(recipient) ?? 0) + contribution);
      totalWeightedVotes += contribution;
    }
  }

  if (totalWeightedVotes <= 0) return [];

  // Baseline split: equal share to every active voter wallet (not recipient).
  // This means an active voter who got 0 peer votes still walks away with
  // a baseline share — even if the voter is not on anyone's ballot.
  const baselineRecipients = new Set<string>();
  for (const ballot of activeBallots) {
    const profile = voterProfiles.get(ballot.voterWallet);
    if (profile && computeVoterWeight(profile) > 0) {
      baselineRecipients.add(ballot.voterWallet);
    }
  }
  // Recipients who received votes but did NOT vote themselves still earn from
  // the multiplier pool — they just don't get baseline.
  const baselinePerVoter =
    baselineRecipients.size > 0 ? Math.floor(baselinePool / baselineRecipients.size) : 0;

  // Multiplier split
  const allocations = new Map<string, RetroAllocation>();
  for (const [recipient, weighted] of weightedTally) {
    const voteShare = weighted / totalWeightedVotes;
    const multiplierBrza = Math.floor(multiplierPool * voteShare);
    const baselineBrza = baselineRecipients.has(recipient) ? baselinePerVoter : 0;
    allocations.set(recipient, {
      recipientWallet: recipient,
      brzaAllocated: baselineBrza + multiplierBrza,
      voteShare,
      baselineBrza,
      multiplierBrza,
    });
  }
  // Baseline-only recipients (voters who got no peer votes)
  for (const voter of baselineRecipients) {
    if (allocations.has(voter)) continue;
    allocations.set(voter, {
      recipientWallet: voter,
      brzaAllocated: baselinePerVoter,
      voteShare: 0,
      baselineBrza: baselinePerVoter,
      multiplierBrza: 0,
    });
  }

  // Drop sub-1-BRZA dust; redistribute removed share among survivors.
  const survivors = Array.from(allocations.values()).filter((a) => a.brzaAllocated >= 1);
  const removedShare = Array.from(allocations.values())
    .filter((a) => a.brzaAllocated < 1)
    .reduce((sum, a) => sum + a.brzaAllocated, 0);

  if (removedShare > 0 && survivors.length > 0) {
    const bonusPerSurvivor = Math.floor(removedShare / survivors.length);
    if (bonusPerSurvivor > 0) {
      for (const s of survivors) {
        (s as { brzaAllocated: number }).brzaAllocated += bonusPerSurvivor;
        (s as { multiplierBrza: number }).multiplierBrza += bonusPerSurvivor;
      }
    }
  }

  return survivors.sort((a, b) => b.brzaAllocated - a.brzaAllocated);
}

// ──────────────────────────────────────────────────────────────────────────
// Ballot validation
// ──────────────────────────────────────────────────────────────────────────

export interface BallotValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validate a single ballot before it's accepted into the round.
 *
 * Rules:
 *   - Allocations must sum to exactly 100.
 *   - Each weight must be an integer in [0, 100].
 *   - Voter cannot allocate to themselves.
 *   - At least one non-zero allocation.
 */
export function validateBallot(ballot: RetroVote): BallotValidationResult {
  const errors: string[] = [];
  const entries = Object.entries(ballot.allocations);

  if (entries.length === 0) {
    errors.push('Ballot has no allocations.');
    return { valid: false, errors };
  }

  let sum = 0;
  let nonZero = 0;
  for (const [recipient, weight] of entries) {
    if (!Number.isInteger(weight)) {
      errors.push(`Allocation for ${recipient} is not an integer.`);
    }
    if (weight < 0 || weight > 100) {
      errors.push(`Allocation for ${recipient} is outside [0, 100].`);
    }
    if (recipient === ballot.voterWallet && weight > 0) {
      errors.push('Voter cannot allocate to themselves.');
    }
    sum += weight;
    if (weight > 0) nonZero += 1;
  }
  if (sum !== 100) {
    errors.push(`Allocations must sum to 100 (got ${sum}).`);
  }
  if (nonZero === 0) {
    errors.push('Ballot must contain at least one non-zero allocation.');
  }
  return { valid: errors.length === 0, errors };
}
