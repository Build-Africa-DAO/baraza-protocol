import { describe, expect, it, vi } from 'vitest';
import {
  cn,
  daysRemaining,
  formatKSh,
  formatRailAmountFromKes,
  formatRailAmountWithKes,
  formatRailDate,
  formatUSD,
  truncateAddress,
} from '@/lib/utils';

describe('formatKSh', () => {
  it('formats zero', () => expect(formatKSh(0)).toBe('KES 0'));
  it('formats thousands', () => expect(formatKSh(234500)).toBe('KES 234,500'));
  it('formats millions', () => expect(formatKSh(1248500)).toBe('KES 1,248,500'));
  it('formats small fee', () => expect(formatKSh(500)).toBe('KES 500'));
});

describe('formatUSD', () => {
  it('formats whole-dollar amounts', () => expect(formatUSD(50)).toBe('$50'));
  it('formats cents when needed', () => expect(formatUSD(50.25)).toBe('$50.25'));
});

describe('rail formatting', () => {
  it('formats KES source amounts in selected rail currency', () => {
    expect(formatRailAmountFromKes(2600, 'solana')).toBe('BRZA 1,000');
    expect(formatRailAmountFromKes(1600, 'stellar')).toBe('XLM 100');
    expect(formatRailAmountFromKes(450000, 'base')).toBe('ETH 1.00');
  });

  it('keeps KES equivalent visible for reconciled amounts', () => {
    expect(formatRailAmountWithKes(6500, 'base')).toContain('KES 6,500');
  });

  it('formats dates in the selected rail timezone', () => {
    expect(formatRailDate('2026-05-26T00:30:00.000Z', 'solana', { day: '2-digit', month: 'short', year: 'numeric' })).toBe('25 May 2026');
    expect(formatRailDate('2026-05-26T00:30:00.000Z', 'celo', { day: '2-digit', month: 'short', year: 'numeric' })).toBe('26 May 2026');
  });
});

describe('truncateAddress', () => {
  const addr = 'So11111111111111111111111111111111111111112';

  it('shows first and last 4 chars by default', () => {
    expect(truncateAddress(addr)).toBe('So11...1112');
  });

  it('respects custom char count', () => {
    expect(truncateAddress(addr, 6)).toBe('So1111...111112');
  });

  it('handles short address', () => {
    expect(truncateAddress('abcd1234', 4)).toBe('abcd...1234');
  });
});

describe('daysRemaining', () => {
  it('returns 0 for past date', () => {
    expect(daysRemaining('2020-01-01')).toBe(0);
  });

  it('returns positive number for future date', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysRemaining(future)).toBeGreaterThan(0);
  });

  it('returns correct count for exactly 7 days away', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    expect(daysRemaining('2026-01-08T00:00:00Z')).toBe(7);
    vi.useRealTimers();
  });
});

describe('cn', () => {
  it('merges class names', () => expect(cn('foo', 'bar')).toBe('foo bar'));
  it('drops falsy values', () => {
    const falsy = (): string | false => false as const;
    expect(cn('foo', falsy() && 'bar')).toBe('foo');
  });
  it('resolves tailwind conflicts (later wins)', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});
