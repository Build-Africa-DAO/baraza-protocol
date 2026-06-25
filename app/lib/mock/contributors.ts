import type { Contributor } from "./types";

/**
 * Top contributors by participation. Reputation is earned by showing up —
 * proposing, voting, delivering bounties — and is explicitly NOT money or a
 * token. These reference the SAME members used on the proposal page.
 */
export const CONTRIBUTORS: Contributor[] = [
  {
    memberId: "u-you",
    communityId: "c-tujenge",
    role: "Founding member",
    reputation: 320,
    decisions: 34,
  },
  {
    memberId: "u-amina",
    communityId: "c-tujenge",
    role: "Welfare lead",
    reputation: 285,
    decisions: 31,
  },
  {
    memberId: "u-joseph",
    communityId: "c-tujenge",
    role: "Auditor",
    reputation: 240,
    decisions: 28,
  },
];

export const getContributors = (communityId: string): Contributor[] =>
  CONTRIBUTORS.filter((c) => c.communityId === communityId).sort(
    (a, b) => b.reputation - a.reputation,
  );
