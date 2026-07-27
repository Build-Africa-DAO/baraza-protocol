import { describe, expect, it } from 'vitest';
import { getBountyCreateAccess, isAdminWallet } from '@/lib/access';
import { recordActiveMembership } from '@/lib/memberships';

describe('access', () => {
  it('recognises allowlisted admin accounts', () => {
    expect(isAdminWallet('admin-1', ['admin-1'])).toBe(true);
    expect(isAdminWallet('member-1', ['admin-1'])).toBe(false);
    expect(isAdminWallet(null, ['admin-1'])).toBe(false);
  });

  it('requires a connected account and selected community for bounty creation', () => {
    expect(getBountyCreateAccess('c1', null).reason).toBe('connect-account');
    expect(getBountyCreateAccess(null, 'wallet-1').reason).toBe('select-community');
  });

  it('allows an active member with a passed proposal to create bounties', () => {
    recordActiveMembership('c1', 'wallet-1');

    const access = getBountyCreateAccess('c1', 'wallet-1', { approvedProposalId: 'proposal-1' });

    expect(access.allowed).toBe(true);
    expect(access.isMember).toBe(true);
    expect(access.hasPassedProposal).toBe(true);
  });

  it('blocks non-members from creating bounties', () => {
    const access = getBountyCreateAccess('c1', 'wallet-2');

    expect(access.allowed).toBe(false);
    expect(access.reason).toBe('not-member');
  });

  it('lets the community admin create a bounty directly', () => {
    const access = getBountyCreateAccess('c1', 'admin-1', { communityAdminId: 'admin-1' });

    expect(access.allowed).toBe(true);
    expect(access.isAdmin).toBe(true);
  });

  it('requires ordinary members to select a passed proposal', () => {
    recordActiveMembership('c1', 'wallet-3');

    const access = getBountyCreateAccess('c1', 'wallet-3');

    expect(access.allowed).toBe(false);
    expect(access.reason).toBe('admin-or-proposal-required');
  });
});
