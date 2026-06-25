/**
 * Mock data types — DESIGN-ONLY mode.
 *
 * These mirror the eventual Supabase row shapes (see
 * supabase/migrations/0001_init_coordination_plane.sql) so that swapping the
 * mock modules for real queries later is a data-source change, not a rewrite.
 *
 * COORDINATION-PLANE ONLY: money is display-only text; there is no balance,
 * ledger, or settlement field, and a vote carries no weight — one row, one vote.
 */

export type Choice = "for" | "against" | "abstain";
export type CommunityType = "dao" | "chama" | "sacco" | "cooperative";
export type ProposalStatus = "draft" | "open" | "passed" | "rejected" | "closed";

export type Member = {
  id: string;
  name: string;
  initials: string;
  color: string; // avatar background
};

export type Vote = {
  voterId: string;
  choice: Choice;
  comment: string | null;
  atLabel: string; // friendly relative time, e.g. "2 days ago"
};

export type Proposal = {
  id: string;
  communityId: string;
  authorId: string;
  title: string;
  body: string;
  status: ProposalStatus;
  closesLabel: string | null; // open only, e.g. "Closes in 7 days"
  createdLabel: string;
  votes: Vote[];
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  type: CommunityType;
  fundDisplay: string; // DISPLAY-ONLY — a figure the SACCO reports, never moved
  meetingCycle: string | null;
};

/**
 * Community-level aggregate counts. In the real backend these are COUNT()
 * queries, not stored columns — kept separate from the Community row so the
 * row shape stays faithful to the table.
 */
export type CommunityStats = {
  communityId: string;
  memberCount: number;
  decisionsToDate: number; // resolved proposals over the community's lifetime
};

export type BountyStatus = "open" | "in_review" | "awarded" | "closed";

/**
 * A bounty is coordination work, not a payout this app controls. rewardDisplay
 * is DISPLAY-ONLY text and settlement happens off-platform via a partner —
 * there is no escrow, transfer, or balance field here.
 */
export type Bounty = {
  id: string;
  communityId: string;
  title: string;
  summary: string;
  rewardDisplay: string; // DISPLAY-ONLY, e.g. "KES 10,000"
  status: BountyStatus;
  postedById: string;
  awardedToId: string | null;
  applicants: number;
  createdLabel: string;
};

/**
 * Contributor reputation = participation (proposals authored, votes cast,
 * bounties delivered). It is NOT money and NOT a token — there is no balance
 * or transferable amount. role is a human label members recognise.
 */
export type Contributor = {
  memberId: string;
  communityId: string;
  role: string;
  reputation: number; // participation points, non-monetary
  decisions: number; // governance decisions this person took part in
};
