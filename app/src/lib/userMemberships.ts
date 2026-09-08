import type { Community } from '@/lib/constants';
import type { MembershipRecord, MembershipStatus } from '@/lib/memberships';

export interface UserMembershipSummary {
  communityId: string;
  name: string;
  role: string;
  activationStatus: string;
  joinedAt: string;
  duesStatus?: string;
  outstandingDuesMinor?: number;
  votingPower?: number;
  vaultBalanceMinor?: number;
  currency?: string;
  membershipStatus?: string;
}

export interface UserMembershipsResponse {
  ok: boolean;
  memberships: UserMembershipSummary[];
}

export function mapActivationStatus(status: string | undefined): MembershipStatus {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'pending') return 'pending';
  return 'revoked';
}

export function membershipRecordFromSummary(
  summary: UserMembershipSummary,
  accountId: string,
): MembershipRecord {
  return {
    communityId: summary.communityId,
    walletAddress: accountId,
    status: mapActivationStatus(summary.activationStatus || summary.membershipStatus),
    joinedAt: summary.joinedAt,
    brzaBalance: summary.votingPower ?? 1,
  };
}

export function communityFromSummary(
  summary: UserMembershipSummary,
  existing?: Community,
): Community {
  if (existing) return existing;
  const initials = summary.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'GP';
  return {
    id: summary.communityId,
    name: summary.name,
    type: 'other',
    description: '',
    membershipFee: 0,
    memberCount: 0,
    fundBalance: 0,
    activeDecisions: 0,
    createdAt: summary.joinedAt,
    image: initials,
  };
}

export async function fetchUserMemberships(token: string): Promise<UserMembershipSummary[]> {
  const response = await fetch('/api/user/memberships', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('unauthorized');
  }
  if (!response.ok) {
    throw new Error('memberships_unavailable');
  }

  const body = await response.json() as UserMembershipsResponse;
  if (!body?.ok || !Array.isArray(body.memberships)) {
    throw new Error('memberships_unavailable');
  }
  return body.memberships;
}
