import type { Bounty } from "./types";

/**
 * Mock bounties for the community. rewardDisplay is DISPLAY-ONLY text; this app
 * never holds, moves, or settles the reward — settlement is handled by a
 * partner off-platform. Covers all four states so the bounty board (page 3)
 * can reuse this same fixture for its kanban columns.
 */
export const BOUNTIES: Bounty[] = [
  {
    id: "b-kiswahili",
    communityId: "c-tujenge",
    title: "Translate the savings guide into Kiswahili",
    summary:
      "Turn the 12-page member savings guide into clear Kiswahili so first-time savers can follow it without help.",
    rewardDisplay: "KES 10,000",
    status: "open",
    postedById: "u-amina",
    awardedToId: null,
    applicants: 4,
    createdLabel: "Posted 3 days ago",
  },
  {
    id: "b-bursary-form",
    communityId: "c-tujenge",
    title: "Design the 2026 bursary application form",
    summary:
      "A one-page form the welfare committee can print and hand out — fields for the rubric we agreed, plain language.",
    rewardDisplay: "KES 6,000",
    status: "open",
    postedById: "u-joseph",
    awardedToId: null,
    applicants: 2,
    createdLabel: "Posted 5 days ago",
  },
  {
    id: "b-directory-photos",
    communityId: "c-tujenge",
    title: "Photograph market stalls for the member directory",
    summary:
      "Visit the Saturday market and take one clean photo of each member's stall for the printed directory.",
    rewardDisplay: "KES 4,500",
    status: "open",
    postedById: "u-you",
    awardedToId: null,
    applicants: 1,
    createdLabel: "Posted 1 day ago",
  },
  {
    id: "b-audit-q4",
    communityId: "c-tujenge",
    title: "Audit Q4 2025 contribution records",
    summary:
      "Cross-check the quarter's M-Pesa contribution log against the member ledger and flag any gaps for the committee.",
    rewardDisplay: "KES 18,000",
    status: "in_review",
    postedById: "u-you",
    awardedToId: null,
    applicants: 3,
    createdLabel: "Posted 2 weeks ago",
  },
  {
    id: "b-venue-roster",
    communityId: "c-tujenge",
    title: "Build the Saturday meeting venue roster",
    summary:
      "A rotating schedule of host venues for the first-Saturday meetings through 2026, balanced across neighbourhoods.",
    rewardDisplay: "KES 5,000",
    status: "awarded",
    postedById: "u-joseph",
    awardedToId: "u-amina",
    applicants: 5,
    createdLabel: "Posted 3 weeks ago",
  },
  {
    id: "b-id-cards",
    communityId: "c-tujenge",
    title: "Print and laminate member ID cards",
    summary:
      "Produce 48 laminated member cards from the approved template and deliver them to the welfare desk.",
    rewardDisplay: "KES 8,000",
    status: "closed",
    postedById: "u-amina",
    awardedToId: "u-joseph",
    applicants: 2,
    createdLabel: "Posted last month",
  },
];

export const getBounties = (communityId: string): Bounty[] =>
  BOUNTIES.filter((b) => b.communityId === communityId);

export const getOpenBounties = (communityId: string): Bounty[] =>
  getBounties(communityId).filter((b) => b.status === "open");
