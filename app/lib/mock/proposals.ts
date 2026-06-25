import type { Proposal } from "./types";

/**
 * Mock proposals + their votes. Display order is newest-first.
 * Covers three states the page must handle:
 *   - passed (read-only results + full discussion)
 *   - open, you have voted (highlighted, editable, withdrawable)
 *   - open, you have NOT voted (cast it live), proposed by someone else
 */
export const PROPOSALS: Proposal[] = [
  {
    id: "p-meetings",
    communityId: "c-tujenge",
    authorId: "u-you",
    title: "Move monthly meetings to the first Saturday of each month",
    body: "Mid-week evening meetings clash with market hours and quorum has been thin. Shifting to the first Saturday morning should lift attendance and let us close votes on time.",
    status: "passed",
    closesLabel: null,
    createdLabel: "Closed 6 days ago",
    votes: [
      {
        voterId: "u-you",
        choice: "for",
        comment: "Saturdays work far better for traders.",
        atLabel: "20 days ago",
      },
      {
        voterId: "u-amina",
        choice: "for",
        comment: "Attendance will jump — the evening slot never worked for me.",
        atLabel: "19 days ago",
      },
      {
        voterId: "u-joseph",
        choice: "abstain",
        comment: "I travel some weekends, so I am neutral on this one.",
        atLabel: "18 days ago",
      },
    ],
  },
  {
    id: "p-bursaries",
    communityId: "c-tujenge",
    authorId: "u-you",
    title: "Fund 20 secondary-school bursaries for members' children in 2026",
    body: "Allocate part of this year's surplus to a bursary round: 20 bursaries of KES 8,000 each, awarded by the welfare committee to members in good standing. Disbursement is handled by the school, not by this app.",
    status: "open",
    closesLabel: "Closes in 7 days",
    createdLabel: "Opened yesterday",
    votes: [
      {
        voterId: "u-you",
        choice: "for",
        comment: "Education first. The welfare committee should publish the scoring rubric before applications open.",
        atLabel: "1 day ago",
      },
      {
        voterId: "u-amina",
        choice: "for",
        comment: "Strongly support. Can we add two or three slots for vocational courses too?",
        atLabel: "20 hours ago",
      },
    ],
  },
  {
    id: "p-contribution",
    communityId: "c-tujenge",
    authorId: "u-amina",
    title: "Raise the minimum monthly contribution to KES 3,000",
    body: "Our KES 2,000 monthly floor has not changed since 2023. Raising it to KES 3,000 grows the loan pool faster and keeps pace with member income — loan limits and year-end dividends both scale with the pool. The M-Pesa standing-order option stays available for anyone who prefers to spread it.",
    status: "open",
    closesLabel: "Closes in 10 days",
    createdLabel: "Opened 2 days ago",
    votes: [
      {
        voterId: "u-amina",
        choice: "for",
        comment: "The pool needs this. KES 3,000 is still affordable if we keep the M-Pesa standing-order option.",
        atLabel: "2 days ago",
      },
      {
        voterId: "u-joseph",
        choice: "against",
        comment: "Agree in principle, but let us phase it: KES 2,500 now, review again in June.",
        atLabel: "1 day ago",
      },
    ],
  },
];
