import { describe, expect, it } from 'vitest';
import { filterProposalsToReview, getProposalDeadline } from '@/lib/memberActions';
import type { Decision } from '@/lib/dataStore';

function decision(overrides: Partial<Decision>): Decision {
  return {
    id: 'decision-1',
    communityId: 'community-1',
    title: 'Review shared budget',
    description: 'Approve the monthly community budget.',
    fundingAmount: 1000,
    proposedBy: 'Member',
    votesFor: 0,
    votesAgainst: 0,
    totalMembers: 10,
    status: 'active',
    createdAt: '2026-07-01',
    endsAt: '2026-07-05',
    voters: {},
    ...overrides,
  };
}

describe('member action proposals', () => {
  const now = new Date('2026-07-02T12:00:00Z').getTime();

  it('returns only open proposals the member has not voted on', () => {
    const result = filterProposalsToReview([
      decision({ id: 'open' }),
      decision({ id: 'voted', voters: { member: 'for' } }),
      decision({ id: 'closed', endsAt: '2026-07-01' }),
      decision({ id: 'complete', status: 'completed' }),
    ], 'member', now);

    expect(result.map((item) => item.id)).toEqual(['open']);
  });

  it('marks proposals urgent when three or fewer days remain', () => {
    expect(getProposalDeadline('2026-07-03', now)).toEqual({ label: '1 day left', urgent: true });
    expect(getProposalDeadline('2026-07-10', now)).toEqual({ label: '8 days left', urgent: false });
  });
});
