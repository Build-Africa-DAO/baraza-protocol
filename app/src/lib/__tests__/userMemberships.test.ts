import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  communityFromSummary,
  fetchUserMemberships,
  mapActivationStatus,
  membershipRecordFromSummary,
} from '@/lib/userMemberships';
import type { Community } from '@/lib/constants';

describe('mapActivationStatus', () => {
  it('maps active and pending standing, and treats everything else as revoked', () => {
    expect(mapActivationStatus('active')).toBe('active');
    expect(mapActivationStatus('ACTIVE')).toBe('active');
    expect(mapActivationStatus('pending')).toBe('pending');
    expect(mapActivationStatus('suspended')).toBe('revoked');
    expect(mapActivationStatus('revoked')).toBe('revoked');
    expect(mapActivationStatus(undefined)).toBe('revoked');
  });
});

describe('membershipRecordFromSummary', () => {
  it('keeps the group id, join date, and voting weight from the account API', () => {
    const record = membershipRecordFromSummary({
      communityId: 'chama-1',
      name: 'Kibera Youth',
      role: 'member',
      activationStatus: 'active',
      joinedAt: '2026-01-02T00:00:00.000Z',
      votingPower: 3,
    }, 'acct-9');

    expect(record).toEqual({
      communityId: 'chama-1',
      walletAddress: 'acct-9',
      status: 'active',
      joinedAt: '2026-01-02T00:00:00.000Z',
      brzaBalance: 3,
    });
  });
});

describe('communityFromSummary', () => {
  it('reuses a known community instead of inventing balances', () => {
    const existing: Community = {
      id: 'chama-1',
      name: 'Kibera Youth',
      type: 'savings',
      description: 'desc',
      membershipFee: 500,
      memberCount: 12,
      fundBalance: 8000,
      activeDecisions: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      image: 'KY',
    };

    expect(communityFromSummary({
      communityId: 'chama-1',
      name: 'Other Name',
      role: 'member',
      activationStatus: 'active',
      joinedAt: '2026-01-02T00:00:00.000Z',
      vaultBalanceMinor: 999999,
    }, existing)).toBe(existing);
  });

  it('builds a name-only stub without fabricating dues or funds', () => {
    const stub = communityFromSummary({
      communityId: 'chama-2',
      name: 'Eastlands Chama',
      role: 'member',
      activationStatus: 'pending',
      joinedAt: '2026-02-01T00:00:00.000Z',
      vaultBalanceMinor: 1248500,
    });

    expect(stub.id).toBe('chama-2');
    expect(stub.name).toBe('Eastlands Chama');
    expect(stub.membershipFee).toBe(0);
    expect(stub.fundBalance).toBe(0);
    expect(stub.image).toBe('EC');
  });
});

describe('fetchUserMemberships', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the membership list from a successful account API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        memberships: [{
          communityId: 'chama-1',
          name: 'Kibera Youth',
          role: 'member',
          activationStatus: 'active',
          joinedAt: '2026-01-02T00:00:00.000Z',
        }],
      }),
    }));

    const memberships = await fetchUserMemberships('token-1');
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.communityId).toBe('chama-1');
    expect(fetch).toHaveBeenCalledWith('/api/user/memberships', {
      headers: { Authorization: 'Bearer token-1' },
    });
  });

  it('throws when the session is not authorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized' }),
    }));

    await expect(fetchUserMemberships('bad')).rejects.toThrow('unauthorized');
  });
});
