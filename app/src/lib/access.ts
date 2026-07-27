import { getActiveMembership } from '@/lib/memberships';

export type BountyCreateAccessReason =
  | 'allowed'
  | 'connect-account'
  | 'select-community'
  | 'not-member'
  | 'admin-or-proposal-required';

interface BountyCreateAccessOptions {
  adminWallets?: string[];
  communityAdminId?: string | null;
  approvedProposalId?: string | null;
}

export function getAdminWallets(): string[] {
  return (import.meta.env.VITE_ADMIN_WALLETS ?? '')
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean);
}

export function isAdminWallet(walletAddress: string | null | undefined, adminWallets = getAdminWallets()): boolean {
  return !!walletAddress && adminWallets.includes(walletAddress);
}

export function getBountyCreateAccess(
  communityId: string | null | undefined,
  walletAddress: string | null | undefined,
  options: BountyCreateAccessOptions = {},
): {
  allowed: boolean;
  reason: BountyCreateAccessReason;
  isAdmin: boolean;
  isMember: boolean;
  hasPassedProposal: boolean;
} {
  const isCommunityAdmin = !!walletAddress && walletAddress === options.communityAdminId;
  const isAdmin = isCommunityAdmin || isAdminWallet(walletAddress, options.adminWallets);
  const hasPassedProposal = !!options.approvedProposalId;
  if (!walletAddress) {
    return { allowed: false, reason: 'connect-account', isAdmin: false, isMember: false, hasPassedProposal: false };
  }
  if (!communityId) {
    return { allowed: false, reason: 'select-community', isAdmin, isMember: false, hasPassedProposal };
  }

  const isMember = isCommunityAdmin || !!getActiveMembership(communityId, walletAddress);
  const allowed = isMember && (isAdmin || hasPassedProposal);
  return {
    allowed,
    reason: allowed ? 'allowed' : isMember ? 'admin-or-proposal-required' : 'not-member',
    isAdmin,
    isMember,
    hasPassedProposal,
  };
}

export function bountyCreateAccessMessage(reason: BountyCreateAccessReason): string {
  if (reason === 'connect-account') return 'Connect your Baraza account to post a bounty.';
  if (reason === 'select-community') return 'Choose a community before posting a bounty.';
  if (reason === 'not-member') return 'Only active members of this community can post bounties.';
  if (reason === 'admin-or-proposal-required') return 'A community admin or a passed proposal must authorize this bounty.';
  return 'Authorization confirmed. You can post this bounty.';
}
