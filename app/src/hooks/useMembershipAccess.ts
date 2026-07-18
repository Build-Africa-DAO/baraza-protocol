import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getPhoneAuthSession } from '@/lib/phoneAuth';
import { listMembershipsForWallet } from '@/lib/memberships';
import { useMemberCommunityIds } from '@/hooks/useBarazaData';

function getLocalCommunityIds(address: string | null): string[] {
  const session = getPhoneAuthSession();
  const identities = [address, session.phone ? `phone:${session.phone}` : null]
    .filter((value): value is string => Boolean(value));
  return [...new Set(
    identities.flatMap((identity) =>
      listMembershipsForWallet(identity)
        .filter((membership) => membership.status === 'active')
        .map((membership) => membership.communityId),
    ),
  )];
}

export function useMembershipAccess() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? null;
  const storeCommunityIds = useMemberCommunityIds(address);
  const [localCommunityIds, setLocalCommunityIds] = useState<string[]>(() => getLocalCommunityIds(address));

  useEffect(() => {
    const refresh = () => setLocalCommunityIds(getLocalCommunityIds(address));
    refresh();
    window.addEventListener('baraza:memberships', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('baraza:memberships', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [address]);

  return {
    communityIds: [...new Set([...storeCommunityIds, ...localCommunityIds])],
    identified: Boolean(address || getPhoneAuthSession().phone || getPhoneAuthSession().email),
  };
}
