import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_GOVERNANCE, type Community, type CommunitySettlement, type VerificationTier, MOCK_COMMUNITIES } from '@/lib/constants';
export type { CommunitySettlement };
import { isSyntheticDataEnabled } from '@/lib/devMode';
import type { Chain } from '@/lib/chain';
import { apiFetch } from '@/lib/api';
import type { Member } from '@/lib/dataStore';

type TreasuryPolicy = 'multisig-ready' | 'proposal-only' | 'manual-review';

export type CommunityInsert = {
  name: string;
  type: string;
  description: string;
  membershipFee: number;
  activationFeeMinor?: number;
  feeType?: 'one_time' | 'recurring_monthly' | 'free';
  carrierPassThrough?: boolean;
  currency?: string;
  chain?: Chain;
  quorumPct?: number;
  approvalThresholdPct?: number;
  votingPeriodDays?: number;
  treasuryPolicy?: TreasuryPolicy;
  paybillNumber?: string;
  ussdShortcode?: string;
  createdBy?: string;
  verificationTier?: VerificationTier;
  vouchThreshold?: number;
  saccoRegistrationNumber?: string;
  walletProofHeaders?: Record<string, string>;
};

export type CommunityRow = {
  id: string;
  name: string;
  type: string;
  description: string;
  membership_fee?: number | null;
  membershipFee?: number | null;
  activation_fee_minor?: number | null;
  activationFeeMinor?: number | null;
  fee_type?: string | null;
  feeType?: string | null;
  carrier_pass_through?: boolean | null;
  carrierPassThrough?: boolean | null;
  currency?: string | null;
  member_count?: number | null;
  memberCount?: number | null;
  fund_balance?: number | null;
  fundBalance?: number | null;
  liquid_vault_balance_minor?: number | null;
  encumbered_balance_minor?: number | null;
  active_decisions?: number | null;
  activeDecisions?: number | null;
  created_at?: string | null;
  createdAt?: string | null;
  image?: string | null;
  chain?: string | null;
  quorum_pct?: number | null;
  quorumPct?: number | null;
  approval_threshold_pct?: number | null;
  approvalThresholdPct?: number | null;
  voting_period_days?: number | null;
  votingPeriodDays?: number | null;
  treasury_policy?: string | null;
  treasuryPolicy?: string | null;
  paybill_number?: string | null;
  paybillNumber?: string | null;
  ussd_shortcode?: string | null;
  ussdShortcode?: string | null;
  created_by?: string | null;
  createdBy?: string | null;
  verification_tier?: string | null;
  verificationTier?: string | null;
  vouch_threshold?: number | null;
  vouchThreshold?: number | null;
  sacco_registration_number?: string | null;
  saccoRegistrationNumber?: string | null;
  sacco_license_status?: string | null;
  saccoLicenseStatus?: string | null;
  is_payout_frozen?: boolean | null;
  isPayoutFrozen?: boolean | null;
  status?: string | null;
  communityStatus?: string | null;
  operational_address?: string | null;
  chain_config?: Record<string, unknown> | null;
};

const VALID_TREASURY_POLICIES: TreasuryPolicy[] = ['multisig-ready', 'proposal-only', 'manual-review'];

function parseTreasuryPolicy(raw: string | null | undefined): TreasuryPolicy {
  return VALID_TREASURY_POLICIES.includes(raw as TreasuryPolicy)
    ? (raw as TreasuryPolicy)
    : DEFAULT_GOVERNANCE.treasuryPolicy;
}

const VERIFICATION_TIERS: VerificationTier[] = ['activation', 'vouching', 'phone', 'proof_of_personhood'];

function parseVerificationTier(raw: string | null | undefined): VerificationTier {
  return VERIFICATION_TIERS.includes(raw as VerificationTier) ? (raw as VerificationTier) : 'activation';
}

const LOCAL_STORAGE_KEY = 'baraza.communities.v1';

/**
 * Only columns that exist in `supabase/migrations`. `active_decisions`,
 * `image`, `paybill_number` and `ussd_shortcode` were never created; asking
 * PostgREST for them returns 400 and took Browse down against a real database.
 * Optional columns added by later migrations are read when present.
 */
export const COMMUNITY_COLUMNS =
  'id,name,type,description,membership_fee,activation_fee_minor,fee_type,carrier_pass_through,currency,member_count,fund_balance,created_at,chain,quorum_pct,approval_threshold_pct,voting_period_days,treasury_policy,created_by,sacco_license_status,is_payout_frozen,status,liquid_vault_balance_minor,encumbered_balance_minor';

let supabase: SupabaseClient | null | undefined;

/**
 * Returns the configured Supabase client, or null when the env vars are not set.
 * Lazy + cached — the client is created on first call and reused.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  supabase = url && anonKey ? createClient(url, anonKey) : null;
  return supabase;
}

function getSupabase(): SupabaseClient | null {
  return getSupabaseClient();
}

/**
 * Whether Supabase is wired via `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
 * When false, the app uses localStorage + mock data; when true, communities
 * persist across sessions and devices via Postgres.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BR';
}

// Chains a community can live on — `Chain` minus 'mpesa' (a payment rail, not a chain).
type CommunityChain = NonNullable<Community['chain']>;

const VALID_CHAINS: readonly CommunityChain[] = [
  'solana',
  'stellar',
  'ethereum',
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'bnb',
  'celo',
  'xdc',
];

function parseChain(raw: string | null | undefined): CommunityChain {
  return VALID_CHAINS.includes(raw as CommunityChain) ? (raw as CommunityChain) : 'solana';
}

function communityFromRow(row: CommunityRow): Community {
  const chain = parseChain(row.chain);
  const feeMinor = row.activation_fee_minor ?? row.activationFeeMinor;
  const resolvedFee = feeMinor !== undefined && feeMinor !== null
    ? feeMinor / 100
    : (row.membership_fee ?? row.membershipFee ?? 0);

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    membershipFee: resolvedFee,
    currency: row.currency ?? undefined,
    memberCount: row.member_count ?? row.memberCount ?? 0,
    fundBalance: row.fund_balance ?? row.fundBalance ?? 0,
    liquidVaultBalanceMinor: typeof row.liquid_vault_balance_minor === 'number' ? row.liquid_vault_balance_minor : null,
    encumberedBalanceMinor: typeof row.encumbered_balance_minor === 'number' ? row.encumbered_balance_minor : null,
    activeDecisions: row.activeDecisions ?? 0,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    image: initials(row.name),
    chain,
    quorumPct: row.quorum_pct ?? row.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct,
    approvalThresholdPct:
      row.approval_threshold_pct ?? row.approvalThresholdPct ?? DEFAULT_GOVERNANCE.approvalThresholdPct,
    votingPeriodDays:
      row.voting_period_days ?? row.votingPeriodDays ?? DEFAULT_GOVERNANCE.votingPeriodDays,
    treasuryPolicy: parseTreasuryPolicy(row.treasury_policy ?? row.treasuryPolicy ?? null),
    paybillNumber: row.paybillNumber ?? undefined,
    ussdShortcode: row.ussdShortcode ?? undefined,
    createdBy: row.created_by ?? row.createdBy ?? undefined,
    verificationTier: parseVerificationTier(row.verification_tier ?? row.verificationTier),
    vouchThreshold: row.vouch_threshold ?? row.vouchThreshold ?? undefined,
    saccoRegistrationNumber: row.sacco_registration_number ?? row.saccoRegistrationNumber ?? undefined,
    saccoLicenseStatus: row.sacco_license_status ?? row.saccoLicenseStatus ?? undefined,
    isPayoutFrozen: row.is_payout_frozen ?? row.isPayoutFrozen ?? false,
    communityStatus: row.status === 'paused' || row.communityStatus === 'paused' ? 'paused' : 'active',
    settlement: {
      chain,
      contracts_state: chain === 'stellar' || chain === 'base' ? 'DEPLOYED' : 'NOT_DEPLOYED',
      treasury_address: (row.operational_address as string) || (row.chain_config?.treasury_address as string) || undefined,
      gasless_eligible: chain === 'stellar' || chain === 'base',
    } satisfies CommunitySettlement,
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

function sortByDate(communities: Community[]): Community[] {
  return [...communities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Mock communities seed the UI while working locally without Supabase. They
 * carry invented balances and member counts, so a production build never sees
 * them — an unconfigured backend must read as empty, not as four thriving groups.
 */
function mergeWithMocks(communities: Community[]): Community[] {
  if (!isSyntheticDataEnabled()) return sortByDate(communities);
  const byId = new Map<string, Community>();
  [...MOCK_COMMUNITIES, ...communities].forEach((c) => byId.set(c.id, c));
  return sortByDate(Array.from(byId.values()));
}

export async function listCommunities(): Promise<Community[]> {
  const client = getSupabase();
  if (!client) return mergeWithMocks(readLocalCommunities());

  const { data, error } = await client
    .from('communities')
    .select(
      COMMUNITY_COLUMNS,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return sortByDate((data ?? []).map(communityFromRow));
}

export async function getCommunity(id: string): Promise<Community | null> {
  const client = getSupabase();
  if (!client) {
    return mergeWithMocks(readLocalCommunities()).find((community) => community.id === id) ?? null;
  }

  const { data, error } = await client
    .from('communities')
    .select(
      COMMUNITY_COLUMNS,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (data) return communityFromRow(data);
  if (!isSyntheticDataEnabled()) return null;
  return MOCK_COMMUNITIES.find((community) => community.id === id) ?? null;
}

export async function createCommunityRecord(input: CommunityInsert): Promise<Community> {
  const now = new Date().toISOString();
  const chain: CommunityChain = parseChain(input.chain);
  const quorumPct = input.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct;
  const approvalThresholdPct = input.approvalThresholdPct ?? DEFAULT_GOVERNANCE.approvalThresholdPct;
  const votingPeriodDays = input.votingPeriodDays ?? DEFAULT_GOVERNANCE.votingPeriodDays;
  const treasuryPolicy = input.treasuryPolicy ?? DEFAULT_GOVERNANCE.treasuryPolicy;

  const activationFeeMinor = input.activationFeeMinor !== undefined
    ? input.activationFeeMinor
    : Math.round(input.membershipFee * 100);

  const localCommunity: Community = {
    id: `community-${Date.now()}`,
    name: input.name.trim(),
    type: input.type,
    description: input.description.trim(),
    membershipFee: input.membershipFee,
    currency: input.currency || 'KES',
    memberCount: 0,
    fundBalance: 0,
    activeDecisions: 0,
    createdAt: now,
    image: initials(input.name),
    chain,
    quorumPct,
    approvalThresholdPct,
    votingPeriodDays,
    treasuryPolicy,
    paybillNumber: input.paybillNumber || undefined,
    ussdShortcode: input.ussdShortcode || undefined,
    createdBy: input.createdBy || undefined,
    verificationTier: input.verificationTier ?? 'activation',
    vouchThreshold: input.vouchThreshold,
    saccoRegistrationNumber: input.saccoRegistrationNumber || undefined,
  };

  if (isSupabaseConfigured()) {
    const res = await apiFetch<{ persisted: boolean; community?: CommunityRow }>('/api/communities', {
      method: 'POST',
      headers: input.walletProofHeaders,
      body: {
        name: input.name,
        type: input.type,
        description: input.description,
        membershipFee: input.membershipFee,
        activationFeeMinor,
        feeType: input.feeType || (input.membershipFee === 0 ? 'free' : 'one_time'),
        carrierPassThrough: input.carrierPassThrough ?? true,
        currency: input.currency || 'KES',
        chain,
        quorumPct,
        approvalThresholdPct,
        votingPeriodDays,
        treasuryPolicy,
        paybillNumber: input.paybillNumber,
        ussdShortcode: input.ussdShortcode,
        createdBy: input.createdBy,
      },
    });

    if (!res.ok) {
      throw new Error(res.error.message || 'Failed to create group on Baraza protocol.');
    }
    if (res.data?.community) {
      return communityFromRow(res.data.community);
    }
  } else if (!import.meta.env.DEV) {
    throw new Error(
      'Database persistence is not configured. Communities cannot be created offline in production. Please contact support.',
    );
  }

  const communities = readLocalCommunities();
  writeLocalCommunities([localCommunity, ...communities]);
  return localCommunity;
}

export interface CommunityMemberRecord {
  memberId: string;
  walletAddress: string;
  role: string;
  activationStatus: string;
  displayName: string;
  avatarUrl: string;
  votingWeight: number;
  joinedAt: string;
  activatedAt?: string | null;
}

export async function fetchCommunityMembers(communityId: string): Promise<Member[]> {
  try {
    const res = await apiFetch<{ ok: boolean; members: CommunityMemberRecord[]; total: number }>(
      `/api/communities/members?communityId=${encodeURIComponent(communityId)}&limit=100`,
    );
    if (res.ok && res.data?.members) {
      return res.data.members.map((r): Member => ({
        id: r.memberId,
        communityId,
        name: r.displayName || 'Anonymous Member',
        walletKey: r.walletAddress,
        joinedAt: r.joinedAt ? new Date(r.joinedAt).getTime() : Date.now(),
        role: r.role === 'founder' || r.role === 'admin' ? r.role : 'member',
        status: r.activationStatus === 'active' ? 'active' : 'inactive',
        totalContributed: 0,
        contributionCount: 0,
        lastContributionAt: r.activatedAt ? new Date(r.activatedAt).getTime() : Date.now(),
        contributions: [],
        votesCount: 0,
        proposalsCount: 0,
      }));
    }
  } catch {
    // fall through
  }
  return [];
}
