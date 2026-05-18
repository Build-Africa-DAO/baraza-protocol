import { describe, expect, it, vi } from 'vitest';
import { cn, daysRemaining, formatKSh, truncateAddress } from '@/lib/utils';

describe('formatKSh', () => {
  it('formats zero', () => expect(formatKSh(0)).toBe('KSh 0'));
  it('formats thousands', () => expect(formatKSh(234500)).toBe('KSh 234,500'));
  it('formats millions', () => expect(formatKSh(1248500)).toBe('KSh 1,248,500'));
  it('formats small fee', () => expect(formatKSh(500)).toBe('KSh 500'));
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
