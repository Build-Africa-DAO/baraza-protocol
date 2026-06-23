import { describe, expect, it, vi } from 'vitest';
import type { Bounty } from '@/lib/bounties';
import type { Community, Decision } from '@/lib/constants';
import { reviewBounty, reviewCommunity, reviewProposal } from '@/lib/securityReview';

const baseCommunity: Community = {
  id: '1',
  name: 'Milele Chama',
  type: 'savings',
  description: 'Monthly welfare contributions for members with visible treasury rules and member voting.',
  membershipFee: 500,
  memberCount: 40,
  fundBalance: 100000,
  activeDecisions: 1,
  createdAt: '2026-01-01',
  image: 'MC',
  quorumPct: 51,
  approvalThresholdPct: 66,
  votingPeriodDays: 7,
};

const baseBounty: Bounty = {
  id: 'b-1',
  communityId: '1',
  title: 'Member records cleanup',
  category: 'Operations',
  rewardKes: 12000,
  deadline: '2026-06-10',
  submissions: 0,
  status: 'open',
  postedBy: 'Milele Chama',
  summary: 'Clean the member records sheet and prepare a reconciliation note for treasurers.',
  skills: ['Sheets', 'Records'],
};

const baseProposal: Decision = {
  id: '1',
  communityId: '1',
  title: 'Buy emergency welfare supplies',
  description: 'Approve a modest purchase of emergency welfare supplies for members after committee review.',
  fundingAmount: 10000,
  proposedBy: 'Amina',
  votesFor: 12,
  votesAgainst: 2,
  totalMembers: 40,
  status: 'active',
  createdAt: '2026-05-01',
  endsAt: '2026-06-01',
};

describe('securityReview', () => {
  it('clears a community with strong governance settings', () => {
    const review = reviewCommunity(baseCommunity);
    expect(review.level).toBe('pass');
    expect(review.score).toBe(100);
  });

  it('flags weak quorum as a community risk', () => {
    const review = reviewCommunity({ ...baseCommunity, quorumPct: 25 });
    expect(review.level).toBe('risk');
    expect(review.checks.find((check) => check.id === 'quorum')?.passed).toBe(false);
  });

  it('flags approved bounties as closed for new work', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T12:00:00+03:00'));
    const review = reviewBounty({ ...baseBounty, status: 'paid' });
    expect(review.level).toBe('risk');
    expect(review.nextSteps.join(' ')).toContain('reopens');
    vi.useRealTimers();
  });

  it('flags large proposal treasury releases', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T12:00:00+03:00'));
    const review = reviewProposal({ ...baseProposal, fundingAmount: 75000 }, baseCommunity);
    expect(review.level).toBe('risk');
    expect(review.checks.find((check) => check.id === 'treasury-impact')?.passed).toBe(false);
    vi.useRealTimers();
  });
});
