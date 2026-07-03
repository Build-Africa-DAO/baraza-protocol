import { isAdminWallet } from '@/lib/access';
import { getActiveMembership } from '@/lib/memberships';

export type TokenGateAction = 'proposal' | 'bounty' | 'treasury' | 'members' | 'gallery';

export type TokenGateReason = 'allowed' | 'connect-account' | 'join-group' | 'admin-only';

export interface TokenGateStatus {
  allowed: boolean;
  reason: TokenGateReason;
  label: string;
  detail: string;
  isAdmin: boolean;
  isMember: boolean;
}

const ACTION_LABELS: Record<TokenGateAction, string> = {
  proposal: 'Submit proposals',
  bounty: 'Post bounties',
  treasury: 'Release treasury funds',
  members: 'View member records',
  gallery: 'Add gallery updates',
};

export function getTokenGateStatus(
  communityId: string | null | undefined,
  accountAddress: string | null | undefined,
  action: TokenGateAction,
  adminWallets?: string[],
): TokenGateStatus {
  const isAdmin = isAdminWallet(accountAddress, adminWallets);
  const isMember = !!communityId && !!accountAddress && !!getActiveMembership(communityId, accountAddress);
  const adminOnly = action === 'treasury';

  if (!accountAddress) {
    return {
      allowed: false,
      reason: 'connect-account',
      label: 'Connect account',
      detail: `${ACTION_LABELS[action]} needs a connected account first.`,
      isAdmin: false,
      isMember: false,
    };
  }

  if (adminOnly && !isAdmin) {
    return {
      allowed: false,
      reason: 'admin-only',
      label: 'Admin only',
      detail: `${ACTION_LABELS[action]} is limited to approved Baraza admins.`,
      isAdmin,
      isMember,
    };
  }

  if (!isAdmin && !isMember) {
    return {
      allowed: false,
      reason: 'join-group',
      label: 'Members only',
      detail: `${ACTION_LABELS[action]} opens after this group confirms your membership credential.`,
      isAdmin,
      isMember,
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
    label: isAdmin ? 'Admin cleared' : 'Member cleared',
    detail: `${ACTION_LABELS[action]} is available for this account.`,
    isAdmin,
    isMember,
  };
}
