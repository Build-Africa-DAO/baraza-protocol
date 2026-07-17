import type { Community } from '@/lib/constants';
import { getTreasuryApprovalOverview } from '@/lib/treasuryApprovals';

export function useTreasuryApprovals(community: Community | null | undefined) {
  return community ? getTreasuryApprovalOverview(community) : undefined;
}
