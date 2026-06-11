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
    // Records persisted before the BRZA rename carry `razaBalance`.
    return parsed.map((r: MembershipRecord & { razaBalance?: number }) => ({
      ...r,
      brzaBalance: r.brzaBalance ?? r.razaBalance ?? 1,
    }));
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
 * Async variant of `listMembershipsForWallet`. Tries Supabase first (memberships
 * table has public SELECT RLS); falls back to localStorage when Supabase is not
 * configured or the query returns empty.
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
    if (!error && data && data.length > 0) {
      return (data as MembershipRow[]).map(rowToRecord);
    }
  }
  return listMembershipsForWallet(walletAddress);
}

/**
 * Async variant of `getActiveMembership`. Tries Supabase first; falls back to
 * localStorage. Use this when you need the freshest server state (e.g. dashboard
 * membership badge). The sync `getActiveMembership` is still fine for optimistic
 * UI gates that should be instant.
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
    if (!error && data) {
      return rowToRecord(data as MembershipRow);
    }
  }
  return getActiveMembership(communityId, walletAddress);
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
