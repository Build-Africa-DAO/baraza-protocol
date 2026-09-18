import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';
import { SkeletonList } from '@/components/ui/skeletons';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { useCastVote, useVoteStatus } from '@/hooks/useBarazaData';
import { useProposal } from '@/hooks/useProposals';
import { formatAccountDate } from '@/lib/accountLocale';
import { proposalBucket } from '@/lib/proposalStatus';
import { isVotingOpen, participationPct, rulesSentence, supportPct, voteTimeLabel } from '@/lib/voteCopy';
import type { Community } from '@/lib/constants';
import type { GroupMembership } from '@/hooks/useGroupMembership';

/**
 * §13.16 One Vote.
 *
 * On the group workspace like every other group screen. Amount, who proposed,
 * time left, the rules in one sentence, one black quorum bar, then Support or
 * Object. After a tap the ballot is "Recorded" until the server confirms it.
 * Visitors read everything and get the workspace's sticky Join bar. Nothing
 * here executes money; officers approve sends on Money.
 */
export default function ProposalDetail() {
  const { decisionId } = useParams<{ id: string; decisionId: string }>();
  return (
    <GroupWorkspace hideBanner seoPath={undefined}>
      {({ community, membership, isMember, isOfficer }) => (
        <VotePanel
          decisionId={decisionId ?? ''}
          community={community}
          membership={membership}
          isMember={isMember}
          isOfficer={isOfficer}
        />
      )}
    </GroupWorkspace>
  );
}

type BallotStage = 'idle' | 'sending' | 'recorded' | 'confirmed';

function VotePanel({
  decisionId,
  community,
  membership,
  isMember,
  isOfficer,
}: {
  decisionId: string;
  community: Community;
  membership: GroupMembership;
  isMember: boolean;
  isOfficer: boolean;
}) {
  const account = useAccount();
  const { toast } = useToast();
  const { decision: proposal, isLoading: proposalLoading, reload: reloadProposal } = useProposal(decisionId);
  const voterKey = account.accountId;
  const existingVote = useVoteStatus(decisionId, voterKey);
  const { vote: submitVote, isLoading: isPending } = useCastVote();
  const [ballot, setBallot] = useState<BallotStage>('idle');
  const [ballotError, setBallotError] = useState<string | null>(null);
  const [choice, setChoice] = useState<'for' | 'against' | null>(null);
  const [optimistic, setOptimistic] = useState<'for' | 'against' | null>(null);
  const [lastAttempt, setLastAttempt] = useState<'for' | 'against' | null>(null);

  if (proposalLoading) {
    return <SkeletonList count={3} />;
  }

  if (!proposal) {
    return (
      <EmptyState
        title="This Vote Isn't Here"
        body="It may have been removed, or the link is incomplete."
        primary={{ label: 'See All Votes', to: `/dashboard/${community.id}/votes` }}
      />
    );
  }

  const open = isVotingOpen(proposal);
  const bucket = proposalBucket(proposal);
  const tied = proposal.lifecycleStage === 'tied' || proposal.lifecycleStage === 'tied_extended';
  // While a ballot is in flight the tally shows it already counted; the server
  // reload replaces this the moment it answers, and a failure rolls it back.
  const shown = optimistic && ballot === 'sending'
    ? { ...proposal, votesFor: proposal.votesFor + (optimistic === 'for' ? 1 : 0), votesAgainst: proposal.votesAgainst + (optimistic === 'against' ? 1 : 0) }
    : proposal;
  const voted = participationPct(shown);
  const support = supportPct(shown);
  const quorum = community.quorumPct ?? 51;
  const quorumMet = voted >= quorum;
  const totalMembers = Math.max(shown.totalMembers, shown.votesFor + shown.votesAgainst, 1);
  const forPct = Math.round((shown.votesFor / totalMembers) * 100);
  const againstPct = Math.round((shown.votesAgainst / totalMembers) * 100);
  const canVote = isMember && membership.status !== 'pending' && open && !existingVote && ballot === 'idle';

  const outcomeChip: { kind: StatusKind; label: string } = tied
    ? { kind: 'hold', label: 'Tied — Not Sent' }
    : bucket === 'active'
      ? { kind: 'pending', label: open ? 'Open' : 'Closed' }
      : bucket === 'passed'
        ? { kind: 'confirmed', label: 'Passed' }
        : bucket === 'executed'
          ? { kind: 'confirmed', label: 'Sent' }
          : { kind: 'stale', label: 'Did Not Pass' };

  async function cast(voteType: 'for' | 'against') {
    if (!account.authenticated || !voterKey) {
      account.login();
      return;
    }
    setChoice(voteType);
    setOptimistic(voteType);
    setLastAttempt(voteType);
    setBallot('sending');
    setBallotError(null);
    const outcome = await submitVote(proposal!.id, voterKey, voteType);
    if (!outcome.ok) {
      // Roll the optimistic count back and offer one tap to try again.
      setOptimistic(null);
      setBallot('idle');
      setChoice(null);
      setBallotError(outcome.reason ?? 'The vote was not recorded. Try again.');
      toast({ title: 'Vote Not Recorded', description: outcome.reason ?? 'Nothing was counted. Try again.', variant: 'destructive' });
      return;
    }
    setOptimistic(null);
    setBallot(outcome.stage === 'confirmed' ? 'confirmed' : 'recorded');
    reloadProposal();
    toast({
      title: outcome.stage === 'confirmed' ? 'Vote Confirmed' : 'Vote Recorded',
      description:
        outcome.stage === 'confirmed'
          ? "Your vote is in this group's tally."
          : outcome.reason ?? 'Recorded on Baraza. It shows as confirmed once the group record has it.',
    });
  }

  const myChoice = existingVote === 'for' || existingVote === 'against' ? existingVote : choice;

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip kind={outcomeChip.kind} label={outcomeChip.label} />
          {myChoice ? (
            <StatusChip kind="info" icon={null} label={myChoice === 'for' ? 'You Supported' : 'You Objected'} />
          ) : null}
        </div>
        <h1 className="mt-3 font-display text-2xl font-black tracking-tight md:text-3xl break-words [overflow-wrap:anywhere]">{proposal.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proposed by {proposal.proposedBy} · {open ? voteTimeLabel(proposal) : `Closed ${formatAccountDate(proposal.endsAt)}`}
        </p>
      </header>

      <section className="baraza-card p-5">
        <AmountBlock label="Amount" amountMajor={proposal.fundingAmount} currency={community.currency} />
        <p className="mt-4 text-sm leading-6 text-foreground break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{proposal.description}</p>
      </section>

      <section className="baraza-card p-5" aria-labelledby="vote-tally">
        <h2 id="vote-tally" className="font-display text-base font-bold">
          The Vote
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {rulesSentence({ quorumPct: community.quorumPct, approvalThresholdPct: community.approvalThresholdPct })}
        </p>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <StatusChip
              kind={quorumMet ? 'confirmed' : 'pending'}
              label={quorumMet ? `Quorum Reached (${voted}%)` : `Quorum Pending (${voted}% of ${quorum}% needed)`}
              data-testid="quorum-pill"
            />
            <span className="tabular-nums text-muted-foreground">
              {shown.votesFor} support · {shown.votesAgainst} object
            </span>
          </div>
          <div
            className={`relative mt-3 h-3 overflow-hidden rounded-full bg-muted ${ballot === 'sending' ? 'animate-pulse' : ''}`}
            role="img"
            aria-label={`${forPct} percent of members support, ${againstPct} percent object, quorum at ${quorum} percent`}
            data-testid="tally-bar"
          >
            <div className="absolute inset-y-0 left-0 bg-confirmed" style={{ width: `${Math.min(100, forPct)}%` }} />
            <div className="absolute inset-y-0 bg-destructive" style={{ left: `${Math.min(100, forPct)}%`, width: `${Math.min(100 - forPct, againstPct)}%` }} />
            <div
              className="absolute inset-y-0 w-0 border-l-2 border-dashed border-foreground/70"
              style={{ left: `${Math.min(100, quorum)}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-confirmed" aria-hidden /> Support {forPct}%</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-destructive" aria-hidden /> Object {againstPct}%</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-0 border-l-2 border-dashed border-foreground/70" aria-hidden /> Quorum {quorum}%</span>
          </div>
          {shown.votesFor + shown.votesAgainst > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{support}% of those who voted said yes.</p>
          ) : null}
        </div>

        {ballotError ? (
          <InlineError
            className="mt-4"
            message={ballotError}
            retryLabel={lastAttempt === 'for' ? 'Try Support Again' : 'Try Object Again'}
            onRetry={lastAttempt && canVote ? () => void cast(lastAttempt) : undefined}
          />
        ) : null}

        {ballot !== 'idle' && !ballotError ? (
          <div className="mt-4 flex items-center gap-2 text-sm">
            {ballot === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            <StatusChip
              kind={ballot === 'confirmed' ? 'confirmed' : 'pending'}
              label={ballot === 'sending' ? 'Sending' : ballot === 'confirmed' ? 'Vote Confirmed' : 'Vote Recorded'}
            />
          </div>
        ) : null}

        {canVote ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button type="button" onClick={() => void cast('for')} disabled={isPending}>
              <ThumbsUp className="h-4 w-4" aria-hidden />
              Support
            </Button>
            <Button type="button" variant="outline" onClick={() => void cast('against')} disabled={isPending}>
              <ThumbsDown className="h-4 w-4" aria-hidden />
              Object
            </Button>
          </div>
        ) : null}

        {isMember && membership.status === 'pending' && open ? (
          <p className="mt-4 text-sm text-muted-foreground">You can vote once your membership is confirmed.</p>
        ) : null}
        {isMember && !open && !existingVote && bucket === 'active' ? (
          <p className="mt-4 text-sm text-muted-foreground">Voting has closed. The result is being recorded.</p>
        ) : null}
      </section>

      {isOfficer && bucket === 'passed' ? (
        <section className="baraza-card p-5">
          <h2 className="font-display text-base font-bold">Ready to Send</h2>
          <p className="mt-1 text-sm text-muted-foreground">This vote passed. Officers approve and send the money from Money.</p>
          <Button asChild className="mt-4">
            <Link to={`/dashboard/${community.id}/money`}>Approve Send</Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}
