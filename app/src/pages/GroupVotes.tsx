import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vote as VoteIcon } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ListRow } from '@/components/app/ListRow';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';
import { SkeletonList } from '@/components/ui/skeletons';
import { FilterChips } from '@/components/ui/filter-chips';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { useAccount } from '@/contexts/AccountContext';
import { useVoteStatus } from '@/hooks/useBarazaData';
import { useProposals } from '@/hooks/useProposals';
import { formatMajor } from '@/lib/money';
import { proposalBucket } from '@/lib/proposalStatus';
import { isVotingOpen, participationPct, voteTimeLabel } from '@/lib/voteCopy';
import type { Decision } from '@/lib/dataStore';

/**
 * §13.14 Votes.
 *
 * Rows, not cards: the list is for finding a vote, the vote page is for
 * reading and deciding. Filters use member words. Visitors see the rows and
 * the sticky Join bar from the workspace; there are no vote buttons here.
 */
type VoteFilter = 'needs-you' | 'open' | 'passed' | 'sent' | 'did-not-pass';

const FILTERS: ReadonlyArray<{ key: VoteFilter; label: string }> = [
  { key: 'needs-you', label: 'Needs You' },
  { key: 'open', label: 'Open' },
  { key: 'passed', label: 'Passed' },
  { key: 'sent', label: 'Sent' },
  { key: 'did-not-pass', label: 'Did Not Pass' },
];

function filterOf(decision: Decision): Exclude<VoteFilter, 'needs-you'> {
  const bucket = proposalBucket(decision);
  if (bucket === 'active') return 'open';
  if (bucket === 'passed') return 'passed';
  if (bucket === 'executed') return 'sent';
  return 'did-not-pass';
}

export default function GroupVotes() {
  return (
    <GroupWorkspace title="Votes" subtitle="Decisions that spend this group's money." hideBanner>
      {({ community, isMember }) => (
        <VotesPanel
          communityId={community.id}
          currency={community.currency}
          quorumPct={community.quorumPct}
          isMember={isMember}
        />
      )}
    </GroupWorkspace>
  );
}

function VotesPanel({
  communityId,
  currency,
  quorumPct,
  isMember,
}: {
  communityId: string;
  currency?: string;
  quorumPct?: number;
  isMember: boolean;
}) {
  const account = useAccount();
  const { all, isLoading, error } = useProposals(communityId);
  const [filter, setFilter] = useState<VoteFilter>(isMember ? 'needs-you' : 'open');

  const grouped = useMemo(() => {
    const open = all.filter((d) => filterOf(d) === 'open');
    return {
      // "Needs You" is the open votes a member can still act on. Whether this
      // person already voted is checked per row, so a row hides itself once
      // the ballot is in.
      'needs-you': open.filter((d) => isVotingOpen(d)),
      open,
      passed: all.filter((d) => filterOf(d) === 'passed'),
      sent: all.filter((d) => filterOf(d) === 'sent'),
      'did-not-pass': all.filter((d) => filterOf(d) === 'did-not-pass'),
    } satisfies Record<VoteFilter, Decision[]>;
  }, [all]);

  const options = FILTERS.filter((f) => isMember || f.key !== 'needs-you').map((f) => ({
    ...f,
    count: grouped[f.key].length,
  }));
  const visible = grouped[filter];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips options={options} value={filter} onChange={setFilter} aria-label="Vote filters" />
        {isMember && (
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to={`/dashboard/${communityId}/votes/new`}>Propose a Spend</Link>
          </Button>
        )}
      </div>

      {error ? <InlineError message={error} /> : null}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={VoteIcon}
          title={filter === 'needs-you' ? 'No Votes Need You' : 'Nothing Here Yet'}
          body={
            filter === 'needs-you' || filter === 'open'
              ? 'When a member proposes a spend, it will appear here for you to support or object.'
              : 'Decisions move into this list once they close.'
          }
          primary={isMember && (filter === 'needs-you' || filter === 'open') ? { label: 'Propose a Spend', to: `/dashboard/${communityId}/votes/new` } : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((decision) => (
            <li key={decision.id}>
              <VoteRow
                decision={decision}
                communityId={communityId}
                currency={currency}
                quorumPct={quorumPct}
                voterKey={account.accountId}
                hideIfVoted={filter === 'needs-you'}
              />
            </li>
          ))}
        </ul>
      )}

      {isMember && (
        <Button asChild fullWidth className="sm:hidden">
          <Link to={`/dashboard/${communityId}/votes/new`}>Propose a Spend</Link>
        </Button>
      )}
    </div>
  );
}

const CHIP: Record<Exclude<VoteFilter, 'needs-you'>, { kind: StatusKind; label: string }> = {
  open: { kind: 'pending', label: 'Open' },
  passed: { kind: 'confirmed', label: 'Passed' },
  sent: { kind: 'confirmed', label: 'Sent' },
  'did-not-pass': { kind: 'stale', label: 'Did Not Pass' },
};

function VoteRow({
  decision,
  communityId,
  currency,
  quorumPct,
  voterKey,
  hideIfVoted,
}: {
  decision: Decision;
  communityId: string;
  currency?: string;
  quorumPct?: number;
  voterKey: string | null;
  hideIfVoted: boolean;
}) {
  const myVote = useVoteStatus(decision.id, voterKey);
  if (hideIfVoted && myVote) return null;

  const kind = filterOf(decision);
  const chip: { kind: StatusKind; label: string } =
    decision.lifecycleStage === 'tied'
      ? { kind: 'hold', label: 'Tied' }
      : kind === 'open' && !isVotingOpen(decision)
        ? { kind: 'stale', label: 'Closed' }
        : CHIP[kind];
  const voted = participationPct(decision);
  const quorumMet = voted >= (quorumPct ?? 51);
  const meta = kind === 'open'
    ? `${formatMajor(decision.fundingAmount, currency)} · ${voteTimeLabel(decision)} · ${voted}% voted${quorumMet ? ', quorum met' : ''}`
    : `${formatMajor(decision.fundingAmount, currency)} · ${decision.votesFor} yes, ${decision.votesAgainst} no`;

  return (
    <ListRow
      title={decision.title}
      to={`/dashboard/${communityId}/votes/${decision.id}`}
      leading={<VoteIcon className="h-5 w-5 text-muted-foreground" aria-hidden />}
      meta={meta}
      trailing={
        <>
          {myVote ? <StatusChip kind="info" icon={null} label={myVote === 'for' ? 'You Supported' : 'You Objected'} /> : null}
          <StatusChip kind={chip.kind} label={chip.label} />
        </>
      }
    />
  );
}
