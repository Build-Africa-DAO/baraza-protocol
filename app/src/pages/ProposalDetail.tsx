import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { useCastVote, useDecision, useVoteStatus } from '@/hooks/useBarazaData';
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
  const proposal = useDecision(decisionId);
  const voterKey = account.accountId;
  const existingVote = useVoteStatus(decisionId, voterKey);
  const { vote: submitVote, isLoading: isPending } = useCastVote();
  const [ballot, setBallot] = useState<BallotStage>('idle');
  const [ballotError, setBallotError] = useState<string | null>(null);
  const [choice, setChoice] = useState<'for' | 'against' | null>(null);

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
  const voted = participationPct(proposal);
  const support = supportPct(proposal);
  const quorum = community.quorumPct ?? 51;
  const quorumMet = voted >= quorum;
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
    setBallot('sending');
    setBallotError(null);
    const outcome = await submitVote(proposal!.id, voterKey, voteType);
    if (!outcome.ok) {
      setBallot('idle');
      setChoice(null);
      setBallotError(outcome.reason ?? 'The vote was not recorded. Try again.');
      return;
    }
    setBallot(outcome.stage === 'confirmed' ? 'confirmed' : 'recorded');
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
        <h1 className="mt-3 font-display text-2xl font-black tracking-tight md:text-3xl">{proposal.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proposed by {proposal.proposedBy} · {open ? voteTimeLabel(proposal) : `Closed ${formatAccountDate(proposal.endsAt)}`}
        </p>
      </header>

      <section className="baraza-card p-5">
        <AmountBlock label="Amount" amountMajor={proposal.fundingAmount} currency={community.currency} />
        <p className="mt-4 text-sm leading-6 text-foreground">{proposal.description}</p>
      </section>

      <section className="baraza-card p-5" aria-labelledby="vote-tally">
        <h2 id="vote-tally" className="font-display text-base font-bold">
          The Vote
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {rulesSentence({ quorumPct: community.quorumPct, approvalThresholdPct: community.approvalThresholdPct })}
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              {voted}% voted{quorumMet ? ' · quorum met' : ` · needs ${quorum}%`}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {proposal.votesFor} yes · {proposal.votesAgainst} no
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={voted}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${voted} percent of members have voted`}
          >
            <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(100, voted)}%` }} />
          </div>
          {proposal.votesFor + proposal.votesAgainst > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{support}% of those who voted said yes.</p>
          ) : null}
        </div>

        {ballotError ? <InlineError className="mt-4" message={ballotError} /> : null}

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
