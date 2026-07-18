import { describe, expect, it, vi } from 'vitest';
import {
  getActiveMembership,
  listMembershipsForCommunity,
  listMembershipsForWallet,
  recordActiveMembership,
} from '@/lib/memberships';

describe('getActiveMembership', () => {
  it('returns null when no records exist', () => {
    expect(getActiveMembership('c1', 'wallet1')).toBeNull();
  });

  it('returns null for wrong communityId', () => {
    recordActiveMembership('c1', 'wallet1');
    expect(getActiveMembership('c2', 'wallet1')).toBeNull();
  });

  it('returns null for wrong walletAddress', () => {
    recordActiveMembership('c1', 'wallet1');
    expect(getActiveMembership('c1', 'wallet2')).toBeNull();
  });

  it('returns the record when community and wallet match', () => {
    recordActiveMembership('c1', 'wallet1');
    const result = getActiveMembership('c1', 'wallet1');
    expect(result).not.toBeNull();
    expect(result?.communityId).toBe('c1');
    expect(result?.walletAddress).toBe('wallet1');
    expect(result?.status).toBe('active');
  });
});

describe('recordActiveMembership', () => {
  it('creates a new record with active status', () => {
    const record = recordActiveMembership('c1', 'wallet1');
    expect(record.communityId).toBe('c1');
    expect(record.walletAddress).toBe('wallet1');
    expect(record.status).toBe('active');
    expect(record.joinedAt).toBeTruthy();
  });

  it('stores an ISO date string for joinedAt', () => {
    const record = recordActiveMembership('c1', 'wallet1');
    expect(() => new Date(record.joinedAt)).not.toThrow();
    expect(new Date(record.joinedAt).toISOString()).toBe(record.joinedAt);
  });

  it('upserts — calling twice does not duplicate the record', () => {
    recordActiveMembership('c1', 'wallet1');
    recordActiveMembership('c1', 'wallet1');
    // Only one record exists: getActiveMembership still returns exactly one
    const result = getActiveMembership('c1', 'wallet1');
    expect(result).not.toBeNull();
  });

  it('updates joinedAt on re-record', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const first = recordActiveMembership('c1', 'wallet1');

    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    const second = recordActiveMembership('c1', 'wallet1');

    expect(second.joinedAt).not.toBe(first.joinedAt);
    expect(getActiveMembership('c1', 'wallet1')?.joinedAt).toBe(second.joinedAt);
    vi.useRealTimers();
  });

  it('stores independent records for different communities', () => {
    recordActiveMembership('c1', 'wallet1');
    recordActiveMembership('c2', 'wallet1');
    expect(getActiveMembership('c1', 'wallet1')).not.toBeNull();
    expect(getActiveMembership('c2', 'wallet1')).not.toBeNull();
  });

  it('stores independent records for different wallets', () => {
    recordActiveMembership('c1', 'wallet1');
    recordActiveMembership('c1', 'wallet2');
    expect(getActiveMembership('c1', 'wallet1')).not.toBeNull();
    expect(getActiveMembership('c1', 'wallet2')).not.toBeNull();
  });

  it('notifies reactive views after membership activation', () => {
    const listener = vi.fn();
    window.addEventListener('baraza:memberships', listener);

    recordActiveMembership('c1', 'wallet1');

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('baraza:memberships', listener);
  });
});

describe('listMembershipsForWallet', () => {
  it('returns an empty array when no records exist', () => {
    expect(listMembershipsForWallet('wallet1')).toEqual([]);
  });

  it('returns only records matching the wallet', () => {
    recordActiveMembership('c1', 'wallet1');
    recordActiveMembership('c2', 'wallet1');
    recordActiveMembership('c1', 'wallet2');

    const result = listMembershipsForWallet('wallet1');
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.walletAddress === 'wallet1')).toBe(true);
  });

  it('sorts results most-recent first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    recordActiveMembership('c1', 'wallet1');

    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    recordActiveMembership('c2', 'wallet1');

    const result = listMembershipsForWallet('wallet1');
    expect(result[0].communityId).toBe('c2');
    expect(result[1].communityId).toBe('c1');
    vi.useRealTimers();
  });

  it('does not include records for other wallets', () => {
    recordActiveMembership('c1', 'wallet2');
    expect(listMembershipsForWallet('wallet1')).toEqual([]);
  });
});

describe('legacy record normalisation (RAZA→BRZA rename)', () => {
  const KEY = 'baraza.memberships.v1';

  function seed(records: unknown[]): void {
    window.localStorage.setItem(KEY, JSON.stringify(records));
  }

  it('maps a legacy razaBalance onto brzaBalance', () => {
    seed([
      {
        communityId: 'c1',
        walletAddress: 'wallet1',
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        razaBalance: 5,
      },
    ]);

    const [record] = listMembershipsForWallet('wallet1');
    expect(record.brzaBalance).toBe(5);
    expect(typeof record.brzaBalance).toBe('number');
  });

  it('defaults brzaBalance to 1 when a record has neither balance field', () => {
    seed([
      {
        communityId: 'c1',
        walletAddress: 'wallet1',
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const [record] = listMembershipsForWallet('wallet1');
    expect(record.brzaBalance).toBe(1);
  });

  it('preserves a modern brzaBalance, even when a stale razaBalance is present', () => {
    seed([
      {
        communityId: 'c1',
        walletAddress: 'wallet1',
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        brzaBalance: 3,
        razaBalance: 9,
      },
    ]);

    const [record] = listMembershipsForWallet('wallet1');
    expect(record.brzaBalance).toBe(3);
  });

  it('normalises legacy records surfaced via getActiveMembership', () => {
    seed([
      {
        communityId: 'c1',
        walletAddress: 'wallet1',
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        razaBalance: 2,
      },
    ]);

    expect(getActiveMembership('c1', 'wallet1')?.brzaBalance).toBe(2);
  });
});

describe('listMembershipsForCommunity', () => {
  it('returns an empty array when no records exist', () => {
    expect(listMembershipsForCommunity('c1')).toEqual([]);
  });

  it('returns only records matching the community', () => {
    recordActiveMembership('c1', 'wallet1');
    recordActiveMembership('c1', 'wallet2');
    recordActiveMembership('c2', 'wallet3');

    const result = listMembershipsForCommunity('c1');
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.communityId === 'c1')).toBe(true);
  });

  it('sorts results most-recent first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    recordActiveMembership('c1', 'wallet1');

    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    recordActiveMembership('c1', 'wallet2');

    const result = listMembershipsForCommunity('c1');
    expect(result[0].walletAddress).toBe('wallet2');
    expect(result[1].walletAddress).toBe('wallet1');
    vi.useRealTimers();
  });

  it('does not leak records from other communities', () => {
    recordActiveMembership('c2', 'wallet1');
    expect(listMembershipsForCommunity('c1')).toEqual([]);
  });
});
