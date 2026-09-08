import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { useCommunities } from '@/hooks/useCommunities';
import {
  fetchMembershipsForWallet,
  listMembershipsForWallet,
  type MembershipRecord,
} from '@/lib/memberships';
import {
  communityFromSummary,
  fetchUserMemberships,
  membershipRecordFromSummary,
} from '@/lib/userMemberships';
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
  const [summariesById, setSummariesById] = useState<Record<string, { name: string }>>({});
  const [isLoading, setIsLoading] = useState(Boolean(account.authenticated || address));
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'wallet' | 'none'>('none');

  useEffect(() => {
    let cancelled = false;

    if (!account.authenticated && !address) {
      setRecords([]);
      setSummariesById({});
      setIsLoading(false);
      setError(null);
      setSource('none');
      return;
    }

    setIsLoading(true);
    setError(null);

    const load = async () => {
      if (account.authenticated) {
        try {
          const token = await account.getAccessToken();
          if (token) {
            const summaries = await fetchUserMemberships(token);
            if (cancelled) return;
            setRecords(summaries.map((summary) => membershipRecordFromSummary(summary, address || summary.communityId)));
            setSummariesById(Object.fromEntries(summaries.map((summary) => [summary.communityId, { name: summary.name }])));
            setSource('api');
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall through to the wallet/local path when the session API is unavailable.
        }
      }

      if (!address) {
        if (!cancelled) {
          setRecords([]);
          setSummariesById({});
          setSource('none');
          setError(account.authenticated ? 'Could not load your groups.' : null);
          setIsLoading(false);
        }
        return;
      }

      setRecords(listMembershipsForWallet(address));
      try {
        const next = await fetchMembershipsForWallet(address);
        if (!cancelled) {
          setRecords(next);
          setSource('wallet');
        }
      } catch {
        if (!cancelled) {
          setError('Could not load your groups.');
          setSource('wallet');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [account.authenticated, account.getAccessToken, address]);

  const memberships = useMemo<MembershipPair[]>(() => (
    records
      .map((record) => {
        const community = communities.find((item) => item.id === record.communityId)
          ?? (summariesById[record.communityId]
            ? communityFromSummary({
                communityId: record.communityId,
                name: summariesById[record.communityId].name,
                role: 'member',
                activationStatus: record.status,
                joinedAt: record.joinedAt,
              })
            : null);
        return community ? { record, community } : null;
      })
      .filter((entry): entry is MembershipPair => entry !== null)
  ), [communities, records, summariesById]);

  const active = useMemo(
    () => memberships.filter((item) => item.record.status === 'active'),
    [memberships],
  );

  return {
    address,
    records,
    memberships,
    active,
    source,
    error,
    isLoading: Boolean(account.authenticated || address) && (isLoading || communitiesLoading),
  };
}
