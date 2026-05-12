const LOCAL_MEMBERSHIP_KEY = 'baraza.memberships.v1';

export type MembershipStatus = 'active' | 'pending' | 'revoked';

export interface MembershipRecord {
  communityId: string;
  walletAddress: string;
  status: MembershipStatus;
  joinedAt: string;
}

function readMemberships(): MembershipRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_MEMBERSHIP_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMemberships(records: MembershipRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_MEMBERSHIP_KEY, JSON.stringify(records));
}

export function getActiveMembership(
  communityId: string,
  walletAddress: string,
): MembershipRecord | null {
  return readMemberships().find((record) => {
    return (
      record.communityId === communityId &&
      record.walletAddress === walletAddress &&
      record.status === 'active'
    );
  }) ?? null;
}

export function recordActiveMembership(communityId: string, walletAddress: string): MembershipRecord {
  const records = readMemberships();
  const existingIndex = records.findIndex((record) => {
    return record.communityId === communityId && record.walletAddress === walletAddress;
  });
  const nextRecord: MembershipRecord = {
    communityId,
    walletAddress,
    status: 'active',
    joinedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    records[existingIndex] = { ...records[existingIndex], ...nextRecord };
  } else {
    records.push(nextRecord);
  }

  writeMemberships(records);
  return nextRecord;
}
