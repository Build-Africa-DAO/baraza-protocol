import { InitialsTile, ListRow } from '@/components/app/ListRow';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { useProposals } from '@/hooks/useProposals';
import type { MembershipPair } from '@/hooks/useMyMemberships';
import { useCommunityImage } from '@/lib/imageUpload';
import { formatMoney } from '@/lib/money';
import { proposalBucket } from '@/lib/proposalStatus';
import { isVotingOpen } from '@/lib/voteCopy';

/**
 * One of my groups, as a row (§13.9, §13.20). Name, my standing as a chip,
 * and a next-action caption sourced from the membership summary: dues owed,
 * a vote waiting, or nothing. Used by My Groups and Account so they can never
 * disagree.
 */
export function GroupRow({ pair }: { pair: MembershipPair }) {
  const { community, record, summary } = pair;
  const { image } = useCommunityImage(community.id, community.image);
  const { all } = useProposals(community.id);
  const openVotes = all.filter((decision) => proposalBucket(decision) === 'active' && isVotingOpen(decision)).length;

  const status = summary?.activationStatus ?? record.status;
  const chip: { kind: StatusKind; label: string } =
    status === 'pending'
      ? { kind: 'pending', label: 'Pending' }
      : status === 'suspended' || status === 'revoked'
        ? { kind: 'hold', label: 'On Hold' }
        : summary && (summary.role === 'founder' || summary.role === 'admin' || summary.role === 'treasurer')
          ? { kind: 'confirmed', label: 'Officer' }
          : { kind: 'confirmed', label: 'Active' };

  const owes = (summary?.outstandingDuesMinor ?? 0) > 0 || summary?.duesStatus === 'OVERDUE_DUES';
  const meta = status === 'pending'
    ? 'Waiting for your payment to be confirmed'
    : owes
      ? `Pay dues${summary?.outstandingDuesMinor ? ` · ${formatMoney(summary.outstandingDuesMinor, summary.currency ?? community.currency)}` : ''}`
      : openVotes > 0
        ? `${openVotes} ${openVotes === 1 ? 'vote needs' : 'votes need'} you`
        : 'Nothing needs you';

  return (
    <ListRow
      title={community.name}
      meta={meta}
      to={`/dashboard/${community.id}`}
      leading={<InitialsTile initials={image ?? community.image} image={image ?? community.image} />}
      trailing={<StatusChip kind={chip.kind} label={chip.label} />}
    />
  );
}

export default GroupRow;
