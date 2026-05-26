import { getActiveMembership } from '@/lib/memberships';

export type BountyCreateAccessReason = 'allowed' | 'connect-account' | 'select-community' | 'not-member';

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
  adminWallets?: string[],
): { allowed: boolean; reason: BountyCreateAccessReason; isAdmin: boolean; isMember: boolean } {
  const isAdmin = isAdminWallet(walletAddress, adminWallets);
  if (!walletAddress) {
    return { allowed: false, reason: 'connect-account', isAdmin: false, isMember: false };
  }
  if (!communityId) {
    return { allowed: false, reason: 'select-community', isAdmin, isMember: false };
  }

  const isMember = !!getActiveMembership(communityId, walletAddress);
  const allowed = isMember;
  return {
    allowed,
    reason: allowed ? 'allowed' : 'not-member',
    isAdmin,
    isMember,
  };
}

export function bountyCreateAccessMessage(reason: BountyCreateAccessReason): string {
  if (reason === 'connect-account') return 'Connect your Solana account to post a bounty.';
  if (reason === 'select-community') return 'Choose a community before posting a bounty.';
  if (reason === 'not-member') return 'Only active members of this community can post bounties.';
  return 'You can post bounties for this community.';
}
