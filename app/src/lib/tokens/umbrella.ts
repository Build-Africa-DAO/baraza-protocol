import type { GrantEligibility } from '@/types';
import { UMBRELLA_TREASURY_FLOOR_KES } from '@/lib/chains/constants';

export interface UmbrellaGrantInputs {
  communityId: string;
  memberCount: number;
  votesCast: number;
  transactions: number;
  tvlKes: number;
  passedProposals: number;
  activeDays: number;
  communityTreasuryKes: number;
}

export const DEFAULT_GRANT_REQUIREMENTS = {
  memberCount: 25,
  votesCast: 50,
  transactions: 20,
  tvlKes: 50_000,
  passedProposals: 3,
  activeDays: 30,
  treasuryFloorKes: UMBRELLA_TREASURY_FLOOR_KES,
};

export function checkGrantEligibility(
  input: UmbrellaGrantInputs,
  requirements = DEFAULT_GRANT_REQUIREMENTS,
): GrantEligibility {
  const checks = {
    minimumMemberCount: input.memberCount >= requirements.memberCount,
    minimumVotesCast: input.votesCast >= requirements.votesCast,
    minimumTransactions: input.transactions >= requirements.transactions,
    minimumTvl: input.tvlKes >= requirements.tvlKes,
    minimumPassedProposals: input.passedProposals >= requirements.passedProposals,
    minimumActiveDuration: input.activeDays >= requirements.activeDays,
    treasuryAboveFloor: input.communityTreasuryKes >= requirements.treasuryFloorKes,
  };

  const notes = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);

  return {
    communityId: input.communityId,
    checkedAt: new Date().toISOString(),
    eligible: Object.values(checks).every(Boolean),
    treasuryFloorKes: requirements.treasuryFloorKes,
    notes,
    ...checks,
  };
}

export function isUmbrellaTreasuryPaused(totalTreasuryKes: number): boolean {
  return totalTreasuryKes < UMBRELLA_TREASURY_FLOOR_KES;
}

export function planGrantDistribution(input: {
  grantPoolKes: number;
  eligibleCommunityIds: string[];
}): Array<{ communityId: string; amountKes: number }> {
  if (input.grantPoolKes <= 0 || input.eligibleCommunityIds.length === 0) return [];
  const amountKes = Math.floor(input.grantPoolKes / input.eligibleCommunityIds.length);
  return input.eligibleCommunityIds.map((communityId) => ({ communityId, amountKes }));
}
