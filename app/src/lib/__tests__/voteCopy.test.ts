import { describe, expect, it } from 'vitest';
import { isVotingOpen, participationPct, rulesSentence, supportPct, voteTimeLabel } from '@/lib/voteCopy';

const NOW = new Date('2026-09-12T12:00:00Z').getTime();
const base = { status: 'active', votesFor: 32, votesAgainst: 8, totalMembers: 47 };

describe('voteTimeLabel', () => {
  it('never counts down to the past', () => {
    expect(voteTimeLabel({ ...base, endsAt: '2026-08-15T00:00:00Z' }, NOW)).toBe('Closed');
    expect(isVotingOpen({ ...base, endsAt: '2026-08-15T00:00:00Z' }, NOW)).toBe(false);
  });
  it('says closes today within the last day', () => {
    expect(voteTimeLabel({ ...base, endsAt: '2026-09-12T18:00:00Z' }, NOW)).toBe('Closes today');
  });
  it('counts remaining days', () => {
    expect(voteTimeLabel({ ...base, endsAt: '2026-09-15T12:00:00Z' }, NOW)).toBe('3 days left');
    expect(voteTimeLabel({ ...base, endsAt: '2026-09-13T13:00:00Z' }, NOW)).toBe('1 day left');
  });
  it('is closed for non-votable stages even with time left', () => {
    expect(voteTimeLabel({ ...base, status: 'completed', endsAt: '2027-01-01T00:00:00Z' }, NOW)).toBe('Closed');
  });
});

describe('tallies', () => {
  it('computes participation and support', () => {
    expect(participationPct({ ...base, endsAt: '' })).toBe(85);
    expect(supportPct({ ...base, endsAt: '' })).toBe(80);
    expect(supportPct({ ...base, votesFor: 0, votesAgainst: 0, endsAt: '' })).toBe(0);
  });
});

describe('rulesSentence', () => {
  it('turns percentages into words', () => {
    expect(rulesSentence({ quorumPct: 51, approvalThresholdPct: 66, votingPeriodDays: 7 })).toBe(
      'More than half of members must vote and two thirds of those who vote must agree. Voting lasts 7 days.',
    );
  });
  it('falls back to the default governance values', () => {
    expect(rulesSentence({})).toBe('More than half of members must vote and two thirds of those who vote must agree.');
  });
  it('keeps odd numbers as numbers', () => {
    expect(rulesSentence({ quorumPct: 23, approvalThresholdPct: 58 })).toBe(
      '23% of members must vote and 58% of those who vote must agree.',
    );
  });
});
