import type { Community } from '@/lib/constants';

export type WithdrawalRequestStatus = 'needs-approval' | 'approved-paused' | 'paid';

export interface WithdrawalApprover {
  role: string;
  status: 'ready' | 'invite-pending';
}

export interface WithdrawalRequest {
  id: string;
  purpose: string;
  amountKes: number;
  approvals: number;
  requiredApprovals: number;
  status: WithdrawalRequestStatus;
}

export interface TreasuryApprovalOverview {
  requiredApprovals: number;
  approvers: WithdrawalApprover[];
  requests: WithdrawalRequest[];
  withdrawalsEnabled: false;
}

export function getTreasuryApprovalOverview(community: Community): TreasuryApprovalOverview {
  const requiredApprovals = community.treasuryPolicy === 'proposal-only' ? 1 : 2;
  const approvers: WithdrawalApprover[] = [
    { role: 'Chairperson', status: 'ready' },
    { role: 'Treasurer', status: 'ready' },
    { role: 'Secretary', status: 'invite-pending' },
  ];

  return {
    requiredApprovals,
    approvers,
    withdrawalsEnabled: false,
    requests: [
      {
        id: 'withdrawal-042',
        purpose: 'Member emergency support',
        amountKes: 150000,
        approvals: Math.min(1, requiredApprovals),
        requiredApprovals,
        status: 'needs-approval',
      },
      {
        id: 'withdrawal-044',
        purpose: 'Annual accounts review',
        amountKes: 62500,
        approvals: requiredApprovals,
        requiredApprovals,
        status: 'approved-paused',
      },
      {
        id: 'withdrawal-035',
        purpose: 'Member training workshop',
        amountKes: 30000,
        approvals: requiredApprovals,
        requiredApprovals,
        status: 'paid',
      },
    ],
  };
}

export function withdrawalStatusLabel(request: WithdrawalRequest): string {
  if (request.status === 'needs-approval') {
    const remaining = request.requiredApprovals - request.approvals;
    return `Needs ${remaining} more approval${remaining === 1 ? '' : 's'}`;
  }
  if (request.status === 'approved-paused') return 'Approved; release paused';
  return 'Paid';
}
