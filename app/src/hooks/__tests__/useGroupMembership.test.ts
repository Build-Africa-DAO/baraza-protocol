import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGroupMembership } from '@/hooks/useGroupMembership';
import type { MembershipPair } from '@/hooks/useMyMemberships';
import type { UserMembershipSummary } from '@/lib/userMemberships';

const mockUseMyMemberships = vi.fn();

vi.mock('@/hooks/useMyMemberships', () => ({
  useMyMemberships: () => mockUseMyMemberships(),
}));

function pair(overrides: Partial<UserMembershipSummary> | null): MembershipPair {
  const summary: UserMembershipSummary | null = overrides
    ? {
        communityId: 'c1',
        name: 'Kibera Youth',
        role: 'member',
        activationStatus: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
      }
    : null;

  return {
    record: {
      communityId: 'c1',
      walletAddress: 'w1',
      status: 'active',
      joinedAt: '2026-01-01T00:00:00.000Z',
      brzaBalance: 1,
    },
    community: {
      id: 'c1',
      name: 'Kibera Youth',
      type: 'savings',
      description: '',
      membershipFee: 500,
      memberCount: 12,
      fundBalance: 0,
      activeDecisions: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      image: 'KY',
    },
    summary,
  };
}

function setup(memberships: MembershipPair[], source: 'api' | 'wallet' | 'none') {
  mockUseMyMemberships.mockReturnValue({ memberships, source, isLoading: false, active: [] });
  return renderHook(() => useGroupMembership('c1')).result.current;
}

describe('useGroupMembership officer trust', () => {
  it('grants officer surfaces when the server says the role is treasurer', () => {
    const result = setup([pair({ role: 'treasurer' })], 'api');
    expect(result.isMember).toBe(true);
    expect(result.role).toBe('treasurer');
    expect(result.isOfficer).toBe(true);
  });

  it('recognises founder and admin as officers too', () => {
    expect(setup([pair({ role: 'founder' })], 'api').isOfficer).toBe(true);
    expect(setup([pair({ role: 'admin' })], 'api').isOfficer).toBe(true);
    expect(setup([pair({ role: 'member' })], 'api').isOfficer).toBe(false);
  });

  it('refuses to grant officer surfaces from a locally cached membership', () => {
    // A localStorage record has no role. If the wallet fallback could promote
    // someone, anyone could hand themselves the payout screen by editing
    // localStorage. Officer state must come from the API or not at all.
    const result = setup([pair({ role: 'founder' })], 'wallet');
    expect(result.isMember).toBe(true);
    expect(result.isOfficer).toBe(false);
    expect(result.role).toBeNull();
  });

  it('does not trust a membership pair that carries no server summary', () => {
    const result = setup([pair(null)], 'api');
    expect(result.isMember).toBe(true);
    expect(result.isOfficer).toBe(false);
  });

  it('reports a visitor when the group is not in the membership list', () => {
    const result = setup([], 'api');
    expect(result.isMember).toBe(false);
    expect(result.isOfficer).toBe(false);
    expect(result.duesOwedMinor).toBeNull();
  });

  it('surfaces outstanding dues only from the server', () => {
    expect(setup([pair({ outstandingDuesMinor: 50_000 })], 'api').duesOwedMinor).toBe(50_000);
    expect(setup([pair({ outstandingDuesMinor: 50_000 })], 'wallet').duesOwedMinor).toBeNull();
  });

  it('degrades to a visitor instead of throwing on a malformed payload', () => {
    mockUseMyMemberships.mockReturnValue({ memberships: undefined, source: 'none', isLoading: false });
    const result = renderHook(() => useGroupMembership('c1')).result.current;
    expect(result.isMember).toBe(false);
    expect(result.isOfficer).toBe(false);
  });
});
