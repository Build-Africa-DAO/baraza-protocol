import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Community, MOCK_COMMUNITIES } from '@/lib/constants';

type CommunityInsert = {
  name: string;
  type: string;
  description: string;
  membershipFee: number;
};

type CommunityRow = {
  id: string;
  name: string;
  type: string;
  description: string;
  membership_fee?: number | null;
  membershipFee?: number | null;
  member_count?: number | null;
  memberCount?: number | null;
  fund_balance?: number | null;
  fundBalance?: number | null;
  active_decisions?: number | null;
  activeDecisions?: number | null;
  created_at?: string | null;
  createdAt?: string | null;
  image?: string | null;
};

const LOCAL_STORAGE_KEY = 'baraza.communities.v1';

let supabase: SupabaseClient | null | undefined;

function getSupabase(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  supabase = url && anonKey ? createClient(url, anonKey) : null;
  return supabase;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BR';
}

function communityFromRow(row: CommunityRow): Community {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    membershipFee: row.membership_fee ?? row.membershipFee ?? 0,
    memberCount: row.member_count ?? row.memberCount ?? 0,
    fundBalance: row.fund_balance ?? row.fundBalance ?? 0,
    activeDecisions: row.active_decisions ?? row.activeDecisions ?? 0,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    image: row.image ?? initials(row.name),
  };
}

function readLocalCommunities(): Community[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(communityFromRow) : [];
  } catch {
    return [];
  }
}

function writeLocalCommunities(communities: Community[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(communities));
}

function mergeCommunities(communities: Community[]): Community[] {
  const byId = new Map<string, Community>();
  [...MOCK_COMMUNITIES, ...communities].forEach((community) => {
    byId.set(community.id, community);
  });
  return Array.from(byId.values()).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function listCommunities(): Promise<Community[]> {
  const client = getSupabase();
  if (!client) return mergeCommunities(readLocalCommunities());

  const { data, error } = await client
    .from('communities')
    .select('id,name,type,description,membership_fee,member_count,fund_balance,active_decisions,created_at,image')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mergeCommunities((data ?? []).map(communityFromRow));
}

export async function getCommunity(id: string): Promise<Community | null> {
  const client = getSupabase();
  if (!client) {
    return mergeCommunities(readLocalCommunities()).find((community) => community.id === id) ?? null;
  }

  const { data, error } = await client
    .from('communities')
    .select('id,name,type,description,membership_fee,member_count,fund_balance,active_decisions,created_at,image')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (data) return communityFromRow(data);
  return MOCK_COMMUNITIES.find((community) => community.id === id) ?? null;
}

export async function createCommunityRecord(input: CommunityInsert): Promise<Community> {
  const now = new Date().toISOString();
  const localCommunity: Community = {
    id: `community-${Date.now()}`,
    name: input.name.trim(),
    type: input.type,
    description: input.description.trim(),
    membershipFee: input.membershipFee,
    memberCount: 0,
    fundBalance: 0,
    activeDecisions: 0,
    createdAt: now,
    image: initials(input.name),
  };

  const client = getSupabase();
  if (!client) {
    const communities = readLocalCommunities();
    writeLocalCommunities([localCommunity, ...communities]);
    return localCommunity;
  }

  const { data, error } = await client
    .from('communities')
    .insert({
      name: localCommunity.name,
      type: localCommunity.type,
      description: localCommunity.description,
      membership_fee: localCommunity.membershipFee,
      member_count: 0,
      fund_balance: 0,
      active_decisions: 0,
      image: localCommunity.image,
    })
    .select('id,name,type,description,membership_fee,member_count,fund_balance,active_decisions,created_at,image')
    .single();

  if (error) throw error;
  return communityFromRow(data);
}
