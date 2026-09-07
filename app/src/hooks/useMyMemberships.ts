import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { useCommunities } from '@/hooks/useCommunities';
import {
  fetchMembershipsForWallet,
  listMembershipsForWallet,
  type MembershipRecord,
} from '@/lib/memberships';
import type { Community } from '@/lib/constants';

export interface MembershipPair {
  record: MembershipRecord;
  community: Community;
}

export function useMyMemberships() {
  const account = useAccount();
  const { communities, isLoading: communitiesLoading } = useCommunities();
  const address = account.accountId ?? '';
  const [records, setRecords] = useState<MembershipRecord[]>(() => (
    address ? listMembershipsForWallet(address) : []
  ));
  const [isLoading, setIsLoading] = useState(Boolean(address));

  useEffect(() => {
    if (!address) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    setRecords(listMembershipsForWallet(address));
    let cancelled = false;
    setIsLoading(true);
    fetchMembershipsForWallet(address)
      .then((next) => {
        if (!cancelled) setRecords(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  const memberships = useMemo<MembershipPair[]>(() => (
    records
      .map((record) => {
        const community = communities.find((item) => item.id === record.communityId);
        return community ? { record, community } : null;
      })
      .filter((entry): entry is MembershipPair => entry !== null)
  ), [communities, records]);

  const active = useMemo(
    () => memberships.filter((item) => item.record.status === 'active'),
    [memberships],
  );

  return {
    address,
    records,
    memberships,
    active,
    isLoading: Boolean(address) && (isLoading || communitiesLoading),
  };
}
