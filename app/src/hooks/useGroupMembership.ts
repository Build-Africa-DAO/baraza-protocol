import { useMemo } from 'react';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import {
  isOfficerRole,
  type ActivationStatus,
  type DuesStatus,
  type OfficerRole,
} from '@/lib/userMemberships';

export interface GroupMembership {
  /** Whether the viewer belongs to this group at all. */
  isMember: boolean;
  /** Server activation status. `null` when we only have a local cache. */
  status: ActivationStatus | null;
  role: OfficerRole | null;
  /**
   * Officer surfaces (Money, Settings, Approve Send) hang off this. It is only
   * ever true when the role came from `GET /api/user/memberships` — a record
   * restored from localStorage must not be able to promote anyone.
   */
  isOfficer: boolean;
  duesStatus: DuesStatus | null;
  /** Minor units (cents). `null` when the server did not send a figure. */
  duesOwedMinor: number | null;
  vaultBalanceMinor: number | null;
  currency: string | null;
  /** Where the answer came from. Screens should degrade when this is not 'api'. */
  source: 'api' | 'wallet' | 'none';
  isLoading: boolean;
}

const EMPTY: Omit<GroupMembership, 'isLoading' | 'source'> = {
  isMember: false,
  status: null,
  role: null,
  isOfficer: false,
  duesStatus: null,
  duesOwedMinor: null,
  vaultBalanceMinor: null,
  currency: null,
};

/**
 * The viewer's relationship to one group, as the server sees it.
 *
 * This is the single input that decides whether a screen renders the visitor,
 * pending, member or officer composition — §13.12 of the screen map.
 */
export function useGroupMembership(communityId: string | undefined): GroupMembership {
  const { memberships, source, isLoading } = useMyMemberships();

  return useMemo(() => {
    if (!communityId) return { ...EMPTY, source, isLoading };

    // Defensive: this hook sits in the group workspace shell, so a malformed
    // memberships payload must degrade to "visitor" rather than blanking the
    // whole page behind the error boundary.
    const pair = Array.isArray(memberships)
      ? memberships.find((item) => item.record.communityId === communityId)
      : undefined;
    if (!pair) return { ...EMPTY, source, isLoading };

    const summary = pair.summary;
    const trusted = source === 'api' && summary !== null;

    return {
      isMember: true,
      status: trusted ? summary.activationStatus : null,
      role: trusted ? summary.role : null,
      isOfficer: trusted ? isOfficerRole(summary.role) : false,
      duesStatus: trusted ? summary.duesStatus ?? null : null,
      duesOwedMinor: trusted ? summary.outstandingDuesMinor ?? null : null,
      vaultBalanceMinor: trusted ? summary.vaultBalanceMinor ?? null : null,
      currency: trusted ? summary.currency ?? null : null,
      source,
      isLoading,
    };
  }, [communityId, memberships, source, isLoading]);
}
