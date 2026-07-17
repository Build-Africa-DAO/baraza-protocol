import { describe, expect, it } from 'vitest';
import { getTreasuryApprovalOverview, withdrawalStatusLabel } from '@/lib/treasuryApprovals';
import type { Community } from '@/lib/constants';

const community: Community = {
  id: 'community-1',
  name: 'Umoja SACCO',
  description: 'A registered savings group.',
  image: 'US',
  memberCount: 20,
  fundBalance: 450000,
  membershipFee: 2000,
  activeDecisions: 1,
  type: 'sacco',
  treasuryPolicy: 'multisig-ready',
  createdAt: '2026-01-01',
};

describe('treasuryApprovals', () => {
  it('keeps withdrawals disabled and requires two approvers by default', () => {
    const overview = getTreasuryApprovalOverview(community);
    expect(overview.withdrawalsEnabled).toBe(false);
    expect(overview.requiredApprovals).toBe(2);
    expect(overview.approvers).toHaveLength(3);
  });

  it('uses plain withdrawal status labels', () => {
    const overview = getTreasuryApprovalOverview(community);
    expect(withdrawalStatusLabel(overview.requests[0])).toBe('Needs 1 more approval');
    expect(withdrawalStatusLabel(overview.requests[1])).toBe('Approved; release paused');
  });
});
