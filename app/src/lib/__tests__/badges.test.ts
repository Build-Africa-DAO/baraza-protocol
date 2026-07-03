import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BADGES, deriveBadges, type BadgeDerivationInput } from '@/lib/badges';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-06-18T00:00:00.000Z').getTime();

function input(overrides: Partial<BadgeDerivationInput> = {}): BadgeDerivationInput {
  return {
    activeMembershipCount: 0,
    earliestJoinedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('deriveBadges — trailblazer', () => {
  it('earned when wallet holds ≥1 membership', () => {
    const r = deriveBadges(input({ activeMembershipCount: 1 }));
    expect(r.earned).toContain('trailblazer');
    expect(r.inProgress).not.toContain('trailblazer');
  });

  it('in-progress when wallet holds 0 memberships', () => {
    const r = deriveBadges(input());
    expect(r.inProgress).toContain('trailblazer');
    expect(r.earned).not.toContain('trailblazer');
  });
});

describe('deriveBadges — convener', () => {
  it('earned at exactly 3 memberships', () => {
    const r = deriveBadges(input({ activeMembershipCount: 3 }));
    expect(r.earned).toContain('convener');
  });

  it('in-progress at 2 memberships', () => {
    const r = deriveBadges(input({ activeMembershipCount: 2 }));
    expect(r.inProgress).toContain('convener');
    expect(r.earned).not.toContain('convener');
  });
});

describe('deriveBadges — veteran', () => {
  it('earned at exactly 90 days of tenure', () => {
    const joined = new Date(NOW - 90 * DAY_MS).toISOString();
    const r = deriveBadges(input({ activeMembershipCount: 1, earliestJoinedAt: joined }));
    expect(r.earned).toContain('veteran');
  });

  it('in-progress at 89 days', () => {
    const joined = new Date(NOW - 89 * DAY_MS).toISOString();
    const r = deriveBadges(input({ activeMembershipCount: 1, earliestJoinedAt: joined }));
    expect(r.inProgress).toContain('veteran');
  });

  it('in-progress when earliestJoinedAt is null', () => {
    const r = deriveBadges(input({ earliestJoinedAt: null }));
    expect(r.inProgress).toContain('veteran');
  });
});

describe('deriveBadges — founder', () => {
  it('earned when wallet has ≥1 surviving founded community', () => {
    const r = deriveBadges(input({ foundedSurvivingCommunityCount: 1 }));
    expect(r.earned).toContain('founder');
  });

  it('in-progress when count is 0 or undefined (default)', () => {
    expect(deriveBadges(input()).inProgress).toContain('founder');
    expect(deriveBadges(input({ foundedSurvivingCommunityCount: 0 })).inProgress).toContain('founder');
  });
});

describe('deriveBadges — quorum-keeper', () => {
  it('earned at exactly 5 proposal votes', () => {
    const r = deriveBadges(input({ proposalVoteCount: 5 }));
    expect(r.earned).toContain('quorum-keeper');
  });

  it('in-progress at 4 votes', () => {
    const r = deriveBadges(input({ proposalVoteCount: 4 }));
    expect(r.inProgress).toContain('quorum-keeper');
  });

  it('in-progress when undefined (default to 0)', () => {
    const r = deriveBadges(input());
    expect(r.inProgress).toContain('quorum-keeper');
  });
});

describe('deriveBadges — locked bucket', () => {
  it('contains only non-derivable badges', () => {
    const r = deriveBadges(input());
    for (const id of r.locked) {
      expect(BADGES[id].derivable).toBe(false);
    }
  });

  it('is empty now that all v1 badges are derivable', () => {
    const r = deriveBadges(input());
    expect(r.locked).toEqual([]);
  });
});

describe('deriveBadges — full earn scenario', () => {
  it('returns all five badges earned when every signal is met', () => {
    const r = deriveBadges({
      activeMembershipCount: 3,
      earliestJoinedAt: new Date(NOW - 365 * DAY_MS).toISOString(),
      foundedSurvivingCommunityCount: 1,
      proposalVoteCount: 12,
    });
    expect(r.earned).toEqual(
      expect.arrayContaining(['trailblazer', 'convener', 'veteran', 'founder', 'quorum-keeper']),
    );
    expect(r.inProgress).toEqual([]);
    expect(r.locked).toEqual([]);
  });
});
