import { DEFAULT_GOVERNANCE, type ProposalLifecycleStage } from '@/lib/constants';
import { STAGE_META, inferStage } from '@/lib/proposalStatus';

/**
 * Plain-language helpers for votes (§13.14–13.16). One place decides whether
 * a vote is still open and how its time and rules are worded, so Group Home,
 * Votes and One Vote never disagree — and never say "closes today" about a
 * vote that closed last month.
 */

export interface VoteLike {
  status: string;
  lifecycleStage?: ProposalLifecycleStage;
  endsAt: string;
  votesFor: number;
  votesAgainst: number;
  totalMembers: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** True while the stage accepts ballots and the deadline has not passed. */
export function isVotingOpen(vote: VoteLike, now: number = Date.now()): boolean {
  const stage = vote.lifecycleStage ?? inferStage(vote.status);
  if (!STAGE_META[stage].votable) return false;
  const end = new Date(vote.endsAt).getTime();
  return !Number.isFinite(end) || end > now;
}

/** "3 days left", "Closes today", or "Closed". Never a countdown to the past. */
export function voteTimeLabel(vote: VoteLike, now: number = Date.now()): string {
  if (!isVotingOpen(vote, now)) return 'Closed';
  const end = new Date(vote.endsAt).getTime();
  if (!Number.isFinite(end)) return 'Open';
  const msLeft = end - now;
  if (msLeft <= DAY_MS) return 'Closes today';
  const days = Math.floor(msLeft / DAY_MS);
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** Share of members who voted, 0–100, rounded. */
export function participationPct(vote: VoteLike): number {
  if (vote.totalMembers <= 0) return 0;
  return Math.round(((vote.votesFor + vote.votesAgainst) / vote.totalMembers) * 100);
}

/** Share of ballots that said yes, 0–100, rounded. 0 when nobody voted. */
export function supportPct(vote: VoteLike): number {
  const total = vote.votesFor + vote.votesAgainst;
  return total > 0 ? Math.round((vote.votesFor / total) * 100) : 0;
}

const SHARE_WORDS: Record<number, string> = {
  100: 'everyone',
  75: 'three quarters of members',
  67: 'two thirds of members',
  66: 'two thirds of members',
  60: 'six in ten members',
  51: 'more than half of members',
  50: 'half of members',
  40: 'four in ten members',
  34: 'a third of members',
  33: 'a third of members',
};

const YES_WORDS: Record<number, string> = {
  100: 'everyone who votes',
  75: 'three quarters of those who vote',
  67: 'two thirds of those who vote',
  66: 'two thirds of those who vote',
  60: 'six in ten of those who vote',
  51: 'more than half of those who vote',
  50: 'half of those who vote',
};

/** Common thresholds become words; anything else stays a number so it is not misread. */
function shareWords(pct: number): string {
  return SHARE_WORDS[pct] ?? `${pct}% of members`;
}

function yesWords(pct: number): string {
  return YES_WORDS[pct] ?? `${pct}% of those who vote`;
}

/**
 * "Half of members must vote and two thirds of those who vote must agree.
 * Voting lasts 7 days." Sentence case, no percent signs unless the number is
 * odd enough that words would mislead.
 */
export function rulesSentence(input: {
  quorumPct?: number | null;
  approvalThresholdPct?: number | null;
  votingPeriodDays?: number | null;
}): string {
  const quorum = input.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct;
  const threshold = input.approvalThresholdPct ?? DEFAULT_GOVERNANCE.approvalThresholdPct;
  const days = input.votingPeriodDays;
  const first = `${capitalize(shareWords(quorum))} must vote and ${yesWords(threshold)} must agree.`;
  if (!days) return first;
  return `${first} Voting lasts ${days} ${days === 1 ? 'day' : 'days'}.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
