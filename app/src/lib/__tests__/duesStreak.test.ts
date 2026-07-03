import { describe, expect, it } from 'vitest';
import { computeStreak, type ConfirmedPayment } from '@/lib/duesStreak';

function payment(year: number, month: number, communityId = 'c1'): ConfirmedPayment {
  // Mid-month timestamp so timezone wobble can't push month boundaries.
  return {
    confirmedAt: new Date(Date.UTC(year, month - 1, 15, 12, 0, 0)).toISOString(),
    communityId,
  };
}

describe('computeStreak — empty + base cases', () => {
  it('returns 0 streak for no payments', () => {
    const r = computeStreak([]);
    expect(r).toEqual({ consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} });
  });

  it('returns streak of 1 for a single payment', () => {
    const r = computeStreak([payment(2026, 6)]);
    expect(r.consecutiveMonthsPaid).toBe(1);
    expect(r.perCommunity.c1).toBe(1);
    expect(r.lastPaidAt).toBeTruthy();
  });
});

describe('computeStreak — consecutive months', () => {
  it('counts three consecutive months', () => {
    const r = computeStreak([
      payment(2026, 4),
      payment(2026, 5),
      payment(2026, 6),
    ]);
    expect(r.consecutiveMonthsPaid).toBe(3);
  });

  it('handles year boundary (Dec → Jan)', () => {
    const r = computeStreak([
      payment(2025, 11),
      payment(2025, 12),
      payment(2026, 1),
    ]);
    expect(r.consecutiveMonthsPaid).toBe(3);
  });

  it('resets streak when there is a gap', () => {
    const r = computeStreak([
      payment(2026, 1),
      payment(2026, 2),
      // gap in March
      payment(2026, 4),
      payment(2026, 5),
      payment(2026, 6), // latest
    ]);
    // From June back: Jun(1) + May(2) + Apr(3) + March gap → stops at 3
    expect(r.consecutiveMonthsPaid).toBe(3);
  });
});

describe('computeStreak — multi-community', () => {
  it('partitions per community', () => {
    const r = computeStreak([
      payment(2026, 4, 'c1'),
      payment(2026, 5, 'c1'),
      payment(2026, 6, 'c1'),
      payment(2026, 5, 'c2'),
      payment(2026, 6, 'c2'),
    ]);
    expect(r.perCommunity.c1).toBe(3);
    expect(r.perCommunity.c2).toBe(2);
    expect(r.consecutiveMonthsPaid).toBe(3); // global streak still 3
  });

  it('per-community gaps are computed independently of the global streak', () => {
    const r = computeStreak([
      // c1: continuous 3 months ending June
      payment(2026, 4, 'c1'),
      payment(2026, 5, 'c1'),
      payment(2026, 6, 'c1'),
      // c2: gap → only counts 1
      payment(2026, 1, 'c2'),
      payment(2026, 6, 'c2'),
    ]);
    expect(r.perCommunity.c1).toBe(3);
    expect(r.perCommunity.c2).toBe(1);
  });
});

describe('computeStreak — multiple payments in same month', () => {
  it('counts the month once even with two payments in it', () => {
    const r = computeStreak([
      payment(2026, 6),
      payment(2026, 6), // same month, second order
      payment(2026, 5),
    ]);
    expect(r.consecutiveMonthsPaid).toBe(2);
  });
});

describe('computeStreak — lastPaidAt', () => {
  it('picks the latest confirmedAt regardless of input order', () => {
    const oldest = payment(2026, 1).confirmedAt;
    const newest = payment(2026, 6).confirmedAt;
    const r = computeStreak([
      payment(2026, 1),
      payment(2026, 6),
      payment(2026, 3),
    ]);
    expect(r.lastPaidAt).toBe(newest);
    expect(r.lastPaidAt).not.toBe(oldest);
  });
});

describe('computeStreak — invalid timestamps', () => {
  it('skips entries with unparseable confirmedAt', () => {
    const r = computeStreak([
      { confirmedAt: 'not-a-date', communityId: 'c1' },
      payment(2026, 6),
    ]);
    expect(r.consecutiveMonthsPaid).toBe(1);
  });
});
