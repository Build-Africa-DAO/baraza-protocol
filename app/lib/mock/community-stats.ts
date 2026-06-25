import type { CommunityStats } from "./types";

/**
 * Aggregate counts per community. Stand-ins for COUNT() queries the dashboard
 * will run against the real backend (members, resolved decisions). Open
 * proposal / open bounty counts are derived live from the other fixtures, so
 * they are not duplicated here.
 */
export const COMMUNITY_STATS: Record<string, CommunityStats> = {
  "c-tujenge": {
    communityId: "c-tujenge",
    memberCount: 48,
    decisionsToDate: 37,
  },
};

export const getCommunityStats = (
  communityId: string,
): CommunityStats | undefined => COMMUNITY_STATS[communityId];
