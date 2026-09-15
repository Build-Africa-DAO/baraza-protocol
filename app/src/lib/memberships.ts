import { getSupabaseClient } from '@/lib/communities';

const LOCAL_MEMBERSHIP_KEY = 'baraza.memberships.v1';

export type MembershipStatus = 'active' | 'pending' | 'revoked';

export interface MembershipRecord {
  communityId: string;
  walletAddress: string;
  status: MembershipStatus;
  joinedAt: string;
  /** BRZA voting weight from MemberAccount. Default 1 for all active members. */
  brzaBalance: number;
}

function readMemberships(): MembershipRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_MEMBERSHIP_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Records persisted before the BRZA rename carry `razaBalance`. Strip it
    // off the result so legacy installs don't accumulate the dead key forever.
    return parsed.map((r: MembershipRecord & { razaBalance?: number }) => {
      const { razaBalance, ...rest } = r;
      return { ...rest, brzaBalance: rest.brzaBalance ?? razaBalance ?? 1 };
    });
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

export function listMembershipsForWallet(walletAddress: string): MembershipRecord[] {
  return readMemberships()
    .filter((record) => record.walletAddress === walletAddress)
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
}

export function listMembershipsForCommunity(communityId: string): MembershipRecord[] {
  return readMemberships()
    .filter((record) => record.communityId === communityId)
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
}

interface MembershipRow {
  community_id: string;
  wallet_address: string;
  status: string;
  joined_at: string;
  voting_weight?: number | null;
}

function rowToRecord(row: MembershipRow): MembershipRecord {
  return {
    communityId: row.community_id,
    walletAddress: row.wallet_address,
    status: row.status === 'ACTIVE' ? 'active' : row.status === 'PENDING' ? 'pending' : 'revoked',
    joinedAt: row.joined_at,
    brzaBalance: row.voting_weight ?? 1,
  };
}

/**
 * Async variant of `listMembershipsForWallet`. Supabase is authoritative: when it
 * answers without error, its result stands even if empty. The localStorage cache
 * is only consulted when there is no client or the query failed — an empty server
 * response means "you are not a member", not "check the browser".
 */
export async function fetchMembershipsForWallet(walletAddress: string): Promise<MembershipRecord[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('memberships')
      .select('community_id,wallet_address,status,joined_at,voting_weight')
      .eq('wallet_address', walletAddress)
      .in('status', ['ACTIVE', 'PENDING'])
      .order('joined_at', { ascending: false });
    if (!error && data) {
      return (data as MembershipRow[]).map(rowToRecord);
    }
  }
  return listMembershipsForWallet(walletAddress);
}

/**
 * Async variant of `getActiveMembership`. Same rule: a successful Supabase read
 * wins, including a successful read that finds nothing.
 */
export async function fetchActiveMembership(
  communityId: string,
  walletAddress: string,
): Promise<MembershipRecord | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('memberships')
      .select('community_id,wallet_address,status,joined_at,voting_weight')
      .eq('community_id', communityId)
      .eq('wallet_address', walletAddress)
      .in('status', ['ACTIVE', 'PENDING'])
      .maybeSingle();
    if (!error) {
      return data ? rowToRecord(data as MembershipRow) : null;
    }
  }
  return getActiveMembership(communityId, walletAddress);
}

/**
 * Cache a membership the server has already confirmed. Never call this to
 * optimistically mark someone active — `JoinStatus` only reaches it after
 * `/api/membership/activate` returns 2xx.
 */
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
    brzaBalance: 1,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = { ...records[existingIndex], ...nextRecord };
  } else {
    records.push(nextRecord);
  }

  writeMemberships(records);
  return nextRecord;
}
