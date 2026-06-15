import type { Bounty } from '@/lib/bounties';
import { DEFAULT_GOVERNANCE, type Community, type Decision } from '@/lib/constants';

export type SecurityReviewLevel = 'pass' | 'watch' | 'risk';
export type SecurityReviewSeverity = 'info' | 'warning' | 'critical';

export interface SecurityReviewCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  severity: SecurityReviewSeverity;
}

export interface SecurityReview {
  subject: string;
  score: number;
  level: SecurityReviewLevel;
  summary: string;
  checks: SecurityReviewCheck[];
  nextSteps: string[];
}

const today = () => new Date();

function isFutureDate(value: string): boolean {
  const date = new Date(`${value}T23:59:59`);
  return Number.isFinite(date.getTime()) && date.getTime() >= today().getTime();
}

function createReview(subject: string, checks: SecurityReviewCheck[], nextSteps: string[]): SecurityReview {
  const criticalFailures = checks.filter((check) => !check.passed && check.severity === 'critical').length;
  const warningFailures = checks.filter((check) => !check.passed && check.severity === 'warning').length;
  const weightedTotal = checks.reduce((sum, check) => sum + (check.severity === 'critical' ? 2 : 1), 0);
  const weightedPassed = checks.reduce((sum, check) => {
    if (!check.passed) return sum;
    return sum + (check.severity === 'critical' ? 2 : 1);
  }, 0);
  const score = weightedTotal > 0 ? Math.round((weightedPassed / weightedTotal) * 100) : 100;
  const level: SecurityReviewLevel = criticalFailures > 0 ? 'risk' : warningFailures > 0 ? 'watch' : 'pass';
  const summary = level === 'pass'
    ? 'Akili found the core safety checks in place.'
    : level === 'watch'
      ? 'Akili found items members should review before acting.'
      : 'Akili found a risk that should be fixed before money or votes move.';

  return { subject, score, level, summary, checks, nextSteps };
}

export function getSecurityReviewLabel(level: SecurityReviewLevel): string {
  if (level === 'pass') return 'Akili cleared';
  if (level === 'watch') return 'Akili review';
  return 'Akili risk flag';
}

export function reviewBounty(bounty: Bounty): SecurityReview {
  const checks: SecurityReviewCheck[] = [
    {
      id: 'reward',
      label: 'Reward is funded in KES',
      passed: Number.isFinite(bounty.rewardKes) && bounty.rewardKes > 0,
      detail: 'A bounty should show a clear KES reward before members send work.',
      severity: 'critical',
    },
    {
      id: 'deadline',
      label: 'Deadline is still open',
      passed: isFutureDate(bounty.deadline),
      detail: 'Closed deadlines should be reopened by the owner before new updates are accepted.',
      severity: 'critical',
    },
    {
      id: 'brief',
      label: 'Brief is clear enough',
      passed: bounty.summary.trim().length >= 40,
      detail: 'Members need a useful scope, expected output, and review basis.',
      severity: 'warning',
    },
    {
      id: 'skills',
      label: 'Skills are tagged',
      passed: bounty.skills.length > 0,
      detail: 'Skill tags help the right member or contributor find the task.',
      severity: 'warning',
    },
    {
      id: 'status',
      label: 'Lifecycle matches action',
      passed: bounty.status === 'open' || bounty.status === 'in_progress' || bounty.status === 'in_review',
      detail: 'Approved bounties should stay closed unless the owner reopens them for review.',
      severity: 'critical',
    },
  ];

  const nextSteps = checks
    .filter((check) => !check.passed)
    .map((check) => check.detail)
    .slice(0, 3);

  return createReview(bounty.title, checks, nextSteps.length ? nextSteps : ['Keep payout approval and work review visible to members.']);
}

export function reviewProposal(proposal: Decision, community?: Community): SecurityReview {
  const treasuryImpact = community?.fundBalance
    ? proposal.fundingAmount / community.fundBalance
    : 0;
  const quorumPct = proposal.totalMembers > 0
    ? ((proposal.votesFor + proposal.votesAgainst) / proposal.totalMembers) * 100
    : 0;
  const requiredQuorum = community?.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct;

  const checks: SecurityReviewCheck[] = [
    {
      id: 'description',
      label: 'Proposal explains the decision',
      passed: proposal.title.trim().length > 0 && proposal.description.trim().length >= 50,
      detail: 'Members should see the reason, requested amount, and expected outcome.',
      severity: 'critical',
    },
    {
      id: 'treasury-impact',
      label: 'Treasury impact is reasonable',
      passed: !community || proposal.fundingAmount === 0 || treasuryImpact <= 0.3,
      detail: 'Large releases above 30% of treasury should get extra review before voting.',
      severity: 'critical',
    },
    {
      id: 'voting-window',
      label: 'Voting window is valid',
      passed: proposal.status !== 'active' || isFutureDate(proposal.endsAt.slice(0, 10)),
      detail: 'Active proposals need a future closing date so members have time to vote.',
      severity: 'critical',
    },
    {
      id: 'quorum',
      label: 'Quorum can be tracked',
      passed: proposal.totalMembers > 0 && requiredQuorum >= 50,
      detail: 'A fair vote needs member count and quorum rules before tallying.',
      severity: 'warning',
    },
    {
      id: 'participation',
      label: 'Participation is visible',
      passed: proposal.status !== 'active' || quorumPct > 0,
      detail: 'Show vote progress early so organisers can remind members before close.',
      severity: 'info',
    },
  ];

  const nextSteps = checks
    .filter((check) => !check.passed)
    .map((check) => check.detail)
    .slice(0, 3);

  return createReview(proposal.title, checks, nextSteps.length ? nextSteps : ['Keep vote receipts and treasury release records visible after the vote.']);
}

export function reviewCommunity(community: Community): SecurityReview {
  const quorum = community.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct;
  const approval = community.approvalThresholdPct ?? DEFAULT_GOVERNANCE.approvalThresholdPct;
  const votingDays = community.votingPeriodDays ?? DEFAULT_GOVERNANCE.votingPeriodDays;

  const checks: SecurityReviewCheck[] = [
    {
      id: 'membership-dues',
      label: 'Dues are clear',
      passed: Number.isFinite(community.membershipFee) && community.membershipFee >= 0 && community.membershipFee <= 100000,
      detail: 'Monthly dues should be stated in KES and stay within a believable community range.',
      severity: 'critical',
    },
    {
      id: 'group-purpose',
      label: 'Group purpose is explained',
      passed: community.description.trim().length >= 50,
      detail: 'Members need a clear purpose before contributing dues.',
      severity: 'warning',
    },
    {
      id: 'quorum',
      label: 'Quorum protects members',
      passed: quorum >= 50 && quorum <= 90,
      detail: 'Use quorum high enough to prevent small groups from moving funds alone.',
      severity: 'critical',
    },
    {
      id: 'approval',
      label: 'Approval threshold is strong',
      passed: approval >= 51 && approval <= 90,
      detail: 'Treasury releases should need a member majority or stronger approval rule.',
      severity: 'critical',
    },
    {
      id: 'voting-period',
      label: 'Voting period gives members time',
      passed: votingDays >= 3 && votingDays <= 30,
      detail: 'Most chamas need at least three days for members to read and vote.',
      severity: 'warning',
    },
    {
      id: 'treasury-visible',
      label: 'Treasury balance is visible',
      passed: Number.isFinite(community.fundBalance) && community.fundBalance >= 0,
      detail: 'Members should always see a current treasury balance.',
      severity: 'critical',
    },
  ];

  const nextSteps = checks
    .filter((check) => !check.passed)
    .map((check) => check.detail)
    .slice(0, 3);

  return createReview(community.name, checks, nextSteps.length ? nextSteps : ['Review membership, treasury, and voting settings again after any rule change.']);
}
