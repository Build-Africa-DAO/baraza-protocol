import type { Chain } from '@/lib/chain';

export type VoteOption = 'yes' | 'no' | 'abstain';

export type MembershipTier = 'soulbound' | 'token-bound' | 'basic';

export type BountyStatus = 'open' | 'in-progress' | 'completed' | 'disputed';

export type BountyAccess = 'public' | 'community-restricted';

export type RewardToken = 'SOL' | 'G$' | 'XLM' | 'COMMUNITY_TOKEN';

export type AdminRole =
  | 'founder'
  | 'treasurer'
  | 'moderator'
  | 'bounty-manager'
  | 'member-admin'
  | 'viewer';

export interface Member {
  id: string;
  communityId: string;
  displayName: string;
  accountAddress?: string;
  phoneHash?: string;
  emailHash?: string;
  tier: MembershipTier;
  roles: AdminRole[];
  status: 'pending' | 'active' | 'suspended' | 'removed';
  joinedAt: string;
  votingWeight: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  chain: Chain;
  treasuryCurrency: 'KES' | 'SOL' | 'XLM' | 'G$' | 'ETH' | 'CELO';
  memberCount: number;
  treasuryBalanceKes: number;
  membershipTiers: MembershipTier[];
  quorumPct: number;
  approvalThresholdPct: number;
  createdAt: string;
  adminRoles: AdminRole[];
  communityToken?: {
    mintAddress?: string;
    symbol: string;
    umbrellaTreasuryPct: number;
    optionalLaunch: boolean;
  };
}

export interface Vote {
  id: string;
  proposalId: string;
  memberId: string;
  option: VoteOption;
  weight: number;
  castAt: string;
  txHash?: string;
}

export interface Comment {
  id: string;
  proposalId: string;
  memberId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  kind:
    | 'treasury-release'
    | 'rule-change'
    | 'membership-action'
    | 'disciplinary-action'
    | 'governing-body-election'
    | 'text';
  status: 'draft' | 'pending' | 'active' | 'passed' | 'failed' | 'queued' | 'executed' | 'cancelled';
  requestedAmountKes?: number;
  createdBy: string;
  createdAt: string;
  startsAt?: string;
  endsAt?: string;
  votes: Vote[];
  comments: Comment[];
  auditTrail: Array<{
    id: string;
    action: string;
    actor: string;
    createdAt: string;
    txHash?: string;
  }>;
}

export interface Bounty {
  id: string;
  communityId: string;
  title: string;
  brief: string;
  access: BountyAccess;
  status: BountyStatus;
  rewardToken: RewardToken;
  rewardAmount: string;
  rewardKesEstimate?: number;
  postedByMemberId: string;
  assignedMemberId?: string;
  dueAt: string;
  createdAt: string;
  payoutTxHash?: string;
  disputeId?: string;
}

export interface GrantEligibility {
  communityId: string;
  checkedAt: string;
  eligible: boolean;
  minimumMemberCount: boolean;
  minimumVotesCast: boolean;
  minimumTransactions: boolean;
  minimumTvl: boolean;
  minimumPassedProposals: boolean;
  minimumActiveDuration: boolean;
  treasuryAboveFloor: boolean;
  treasuryFloorKes: number;
  notes: string[];
}

export interface ChainActionResult {
  ok: boolean;
  chain: Chain;
  txHash?: string;
  error?: string;
}
