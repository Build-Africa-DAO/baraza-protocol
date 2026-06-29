import { describe, expect, it } from 'vitest';
import {
  VOTE_STREAK_CONSTANTS,
  applyHalfStepDecay,
  applyVoteMultiplier,
  computeVoteMultiplier,
  computeVoteStreak,
  streakToMultiplier,
  walkVoteStreak,
  type ProposalRecord,
  type VoteRecord,
} from '@/lib/voteStreak';

function vote(daysAgo: number, proposalId: string): VoteRecord {
  return {
    castAt: new Date(Date.UTC(2026, 5, 1) - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    proposalId,
  };
}

function proposal(daysAgo: number, proposalId: string): ProposalRecord {
  return {
    proposalId,
    endedAt: new Date(Date.UTC(2026, 5, 1) - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe('computeVoteStreak — base cases', () => {
  it('returns 0 for empty votes', () => {
    expect(computeVoteStreak([], [])).toBe(0);
  });

  it('returns 1 for a single vote', () => {
    expect(computeVoteStreak([vote(0, 'p1')], [proposal(0, 'p1')])).toBe(1);
  });
});

describe('computeVoteStreak — consecutive votes', () => {
  it('returns N for N consecutive votes with no missed proposals', () => {
    const votes = [vote(0, 'p3'), vote(5, 'p2'), vote(10, 'p1')];
    const proposals = [proposal(0, 'p3'), proposal(5, 'p2'), proposal(10, 'p1')];
    expect(computeVoteStreak(votes, proposals)).toBe(3);
  });

  it('does NOT break streak on a single skip (Nia ruling 2026-06-20)', () => {
    // Voted on p3 and p1, skipped p2 (which ended between).
    // One missed proposal is "noted" — the streak continues.
    const votes = [vote(0, 'p3'), vote(10, 'p1')];
    const proposals = [
      proposal(0, 'p3'),
      proposal(5, 'p2'), // ended between p1 and p3 — member did not vote
      proposal(10, 'p1'),
    ];
    const walk = walkVoteStreak(votes, proposals);
    expect(walk.streak).toBe(2);
    expect(walk.consecutiveSkipsAtBreak).toBe(1);
  });

  it('breaks streak only at TWO consecutive missed proposals', () => {
    const votes = [vote(0, 'p4'), vote(20, 'p1')];
    const proposals = [
      proposal(0, 'p4'),
      proposal(5, 'p3'), // skipped
      proposal(10, 'p2'), // skipped — two in a row
      proposal(20, 'p1'),
    ];
    const walk = walkVoteStreak(votes, proposals);
    expect(walk.streak).toBe(1);
    expect(walk.consecutiveSkipsAtBreak).toBe(2);
  });

  it('proposal ending BEFORE the oldest vote does not break the streak', () => {
    const votes = [vote(0, 'p2'), vote(5, 'p1')];
    const proposals = [
      proposal(0, 'p2'),
      proposal(5, 'p1'),
      proposal(20, 'p0'), // ended before member's earliest vote
    ];
    expect(computeVoteStreak(votes, proposals)).toBe(2);
  });

  it('dedupes votes on same proposal', () => {
    const votes = [vote(0, 'p1'), vote(1, 'p1'), vote(5, 'p0')];
    const proposals = [proposal(0, 'p1'), proposal(5, 'p0')];
    expect(computeVoteStreak(votes, proposals)).toBe(2);
  });
});

describe('streakToMultiplier — ramp + cap', () => {
  it('returns floor (1.0) at streak 0 and 1', () => {
    expect(streakToMultiplier(0)).toBe(1.0);
    expect(streakToMultiplier(1)).toBe(1.0);
  });

  it('returns cap (1.5) at the threshold and above', () => {
    expect(streakToMultiplier(VOTE_STREAK_CONSTANTS.VOTES_TO_REACH_CAP)).toBe(1.5);
    expect(streakToMultiplier(VOTE_STREAK_CONSTANTS.VOTES_TO_REACH_CAP + 10)).toBe(1.5);
  });

  it('ramps linearly between 1 and cap-threshold', () => {
    // 6 votes to cap means each step adds 0.5/6 = 0.0833...
    const step = VOTE_STREAK_CONSTANTS.PER_VOTE_INCREMENT;
    expect(streakToMultiplier(2)).toBeCloseTo(1.0 + step, 6);
    expect(streakToMultiplier(3)).toBeCloseTo(1.0 + 2 * step, 6);
    expect(streakToMultiplier(4)).toBeCloseTo(1.0 + 3 * step, 6);
  });
});

describe('computeVoteMultiplier — end-to-end', () => {
  it('returns floor for no votes', () => {
    expect(computeVoteMultiplier([], [])).toBe(1.0);
  });

  it('returns cap once streak reaches threshold', () => {
    const votes: VoteRecord[] = [];
    const proposals: ProposalRecord[] = [];
    for (let i = 0; i < VOTE_STREAK_CONSTANTS.VOTES_TO_REACH_CAP; i++) {
      const id = `p${i}`;
      votes.push(vote(i * 5, id));
      proposals.push(proposal(i * 5, id));
    }
    expect(computeVoteMultiplier(votes, proposals)).toBe(1.5);
  });

  it('applies half-step decay on a single skip (Nia ruling)', () => {
    // Voted on p1 (newest), skipped p2, voted on p3 (oldest).
    // Streak is 2 (both votes count); half-step decay applied.
    const votes = [vote(0, 'p1'), vote(10, 'p3')];
    const proposals = [
      proposal(0, 'p1'),
      proposal(5, 'p2'),
      proposal(10, 'p3'),
    ];
    const base = streakToMultiplier(2);
    expect(computeVoteMultiplier(votes, proposals)).toBeCloseTo(applyHalfStepDecay(base), 6);
  });

  it('decays to floor after two consecutive skipped proposals', () => {
    const votes = [vote(0, 'p4'), vote(20, 'p1')];
    const proposals = [
      proposal(0, 'p4'),
      proposal(5, 'p3'),  // skip
      proposal(10, 'p2'), // skip — second consecutive
      proposal(20, 'p1'),
    ];
    // streak walks back to 1 (the newest vote), no half-step decay applies
    // because consecutiveSkipsAtBreak === 2, not 1.
    expect(computeVoteMultiplier(votes, proposals)).toBe(1.0);
  });
});

describe('applyHalfStepDecay', () => {
  it('halves the distance from floor (1.0) to the base multiplier', () => {
    expect(applyHalfStepDecay(1.5)).toBeCloseTo(1.25, 6);
    expect(applyHalfStepDecay(1.25)).toBeCloseTo(1.125, 6);
    expect(applyHalfStepDecay(1.0)).toBe(1.0);
  });
});

describe('applyVoteMultiplier — float discipline', () => {
  it('rounds to 4 decimals', () => {
    expect(applyVoteMultiplier(1, 1.3333333)).toBe(1.3333);
  });

  it('returns 0 for zero base weight', () => {
    expect(applyVoteMultiplier(0, 1.5)).toBe(0);
  });

  it('handles non-trivial weights', () => {
    expect(applyVoteMultiplier(7, 1.5)).toBe(10.5);
    expect(applyVoteMultiplier(3, 1.0833)).toBeCloseTo(3.2499, 4);
  });
});
