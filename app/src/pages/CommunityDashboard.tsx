import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, ReceiptText, UserPlus, Vote as VoteIcon } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ListRow } from '@/components/app/ListRow';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusChip } from '@/components/ui/status-chip';
import { useCommunityActivity, useProposals } from '@/hooks/useProposals';
import type { GroupMembership } from '@/hooks/useGroupMembership';
import { formatMajor, formatMoney } from '@/lib/money';
import { proposalBucket } from '@/lib/proposalStatus';
import { formatAccountDate } from '@/lib/accountLocale';
import { isVotingOpen, participationPct, voteTimeLabel } from '@/lib/voteCopy';
import type { ActivityEvent, Decision } from '@/lib/dataStore';

/**
 * §13.12 Group Home.
 *
 * Same URL for a visitor, a pending member, an active member and an officer —
 * the composition changes, not the route. The page answers one question first:
 * what do I do now? Then, only if there is data: open votes, money, movement.
 */
export default function CommunityDashboard() {
  return (
    <GroupWorkspace hideJoinCta>
      {({ community, membership, isOfficer }) => (
        <HomePanel
          communityId={community.id}
          currency={community.currency}
          memberCount={community.memberCount}
          fundBalance={community.fundBalance}
          quorumPct={community.quorumPct}
          membership={membership}
          isOfficer={isOfficer}
        />
      )}
    </GroupWorkspace>
  );
}

function HomePanel({
  communityId,
  currency,
  memberCount,
  fundBalance,
  quorumPct,
  membership,
  isOfficer,
}: {
  communityId: string;
  currency?: string;
  memberCount: number;
  fundBalance: number | undefined;
  quorumPct?: number;
  membership: GroupMembership;
  isOfficer: boolean;
}) {
  const { all } = useProposals(communityId);
  const openVotes = all.filter((decision) => proposalBucket(decision) === 'active' && isVotingOpen(decision));
  const awaitingSend = all.filter((decision) => proposalBucket(decision) === 'passed');
  const { events: activities } = useCommunityActivity(communityId);
  const hasBalance = typeof fundBalance === 'number';

  return (
    <div className="space-y-5">
      <NextAction
        communityId={communityId}
        currency={membership.currency ?? currency}
        membership={membership}
        isOfficer={isOfficer}
        openVotes={openVotes}
        awaitingSendCount={awaitingSend.length}
        memberCount={memberCount}
      />

      {openVotes.length > 0 && (
        <section aria-labelledby="home-open-votes">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="home-open-votes" className="font-display text-base font-bold">
              Open Votes
            </h2>
            <Link
              to={`/dashboard/${communityId}/votes`}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              See All Votes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {openVotes.slice(0, 3).map((decision) => (
              <li key={decision.id}>
                <VoteRow decision={decision} communityId={communityId} currency={currency} quorumPct={quorumPct} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="baraza-card p-5" aria-labelledby="home-money">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="home-money" className="font-display text-base font-bold">
            Money
          </h2>
          {isOfficer ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/${communityId}/money`}>Open Money</Link>
            </Button>
          ) : null}
        </div>
        {/* The statement API returns one pooled figure today. Reserved and
            available render as "Not available yet" rather than a guess. */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AmountBlock label="Total" amountMajor={hasBalance ? fundBalance : null} currency={currency} />
          <AmountBlock label="Reserved" amountMajor={null} currency={currency} size="md" />
          <AmountBlock label="Available" amountMajor={null} currency={currency} size="md" />
        </div>
      </section>

      <section aria-labelledby="home-movement">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="home-movement" className="font-display text-base font-bold">
            Recent Movement
          </h2>
          {activities.length > 5 ? (
            <Link
              to={`/dashboard/${communityId}/money`}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              See All
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        {activities.length === 0 ? (
          <EmptyState
            title="No Movements Yet"
            body="Contributions and releases appear here once the first one settles."
          />
        ) : (
          <ul className="space-y-2">
            {activities.slice(0, 5).map((event) => (
              <li key={event.id}>
                <MovementRow event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function VoteRow({
  decision,
  communityId,
  currency,
  quorumPct,
}: {
  decision: Decision;
  communityId: string;
  currency?: string;
  quorumPct?: number;
}) {
  const voted = participationPct(decision);
  const quorumMet = voted >= (quorumPct ?? 51);
  return (
    <ListRow
      title={decision.title}
      to={`/dashboard/${communityId}/votes/${decision.id}`}
      leading={<VoteIcon className="h-5 w-5 text-muted-foreground" aria-hidden />}
      meta={`${formatMajor(decision.fundingAmount, currency)} · ${voteTimeLabel(decision)} · ${voted}% voted${quorumMet ? ', quorum met' : ''}`}
      trailing={<StatusChip kind="pending" label="Open" />}
    />
  );
}

const MOVEMENT_LABEL: Record<ActivityEvent['type'], string> = {
  member_joined: 'Joined',
  decision_created: 'Proposed',
  vote_cast: 'Voted',
  decision_completed: 'Decided',
  fund_deposit: 'Paid in',
  bounty_opened: 'Bounty',
  officer_changed: 'Officers',
  invite_created: 'Invite',
  other: 'Activity',
};

function MovementRow({ event }: { event: ActivityEvent }) {
  return (
    <ListRow
      title={event.message}
      meta={formatAccountDate(event.timestamp, undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
      trailing={<StatusChip kind="info" icon={null} label={MOVEMENT_LABEL[event.type] ?? 'Activity'} />}
    />
  );
}

/**
 * One card, one primary action — the table in §13.12. Order matters: money you
 * owe outranks a vote, and both outrank an empty-group nudge.
 */
function NextAction({
  communityId,
  currency,
  membership,
  isOfficer,
  openVotes,
  awaitingSendCount,
  memberCount,
}: {
  communityId: string;
  currency?: string | null;
  membership: GroupMembership;
  isOfficer: boolean;
  openVotes: Decision[];
  awaitingSendCount: number;
  memberCount: number;
}) {
  if (membership.isLoading) {
    return (
      <div className="baraza-card animate-pulse p-6" aria-hidden>
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="mt-3 h-6 w-56 rounded bg-muted" />
        <div className="mt-4 h-11 w-40 rounded-full bg-muted" />
      </div>
    );
  }

  if (!membership.isMember) {
    return (
      <ActionCard
        heading="Join This Group"
        body="Members pay dues together, vote before money leaves, and can see every movement."
        cta={{ label: 'Join This Group', to: `/join/${communityId}` }}
        icon={CreditCard}
      />
    );
  }

  if (membership.status === 'pending') {
    return (
      <ActionCard
        heading="We Are Confirming Your Payment"
        body="Your membership activates once the payment is confirmed. Nothing else is needed from you."
        cta={{ label: 'See Status', to: `/join/${communityId}/status` }}
        icon={ReceiptText}
      />
    );
  }

  const owes = membership.duesOwedMinor !== null && membership.duesOwedMinor > 0;
  if (owes) {
    return (
      <ActionCard
        heading="Pay This Month's Dues"
        body={`${formatMoney(membership.duesOwedMinor ?? 0, currency)} is outstanding.`}
        cta={{ label: 'Pay Dues', to: `/dashboard/${communityId}/pay` }}
        icon={CreditCard}
      />
    );
  }

  if (openVotes.length > 0) {
    return (
      <ActionCard
        heading="A Vote Needs You"
        body={openVotes[0].title}
        cta={{ label: 'Vote Now', to: `/dashboard/${communityId}/votes/${openVotes[0].id}` }}
        icon={VoteIcon}
      />
    );
  }

  if (isOfficer && awaitingSendCount > 0) {
    return (
      <ActionCard
        heading="A Send Needs You"
        body={`${awaitingSendCount} approved ${awaitingSendCount === 1 ? 'decision is' : 'decisions are'} waiting to be sent.`}
        cta={{ label: 'Open Money', to: `/dashboard/${communityId}/money` }}
        icon={ReceiptText}
      />
    );
  }

  if (memberCount <= 1) {
    return (
      <ActionCard
        heading="Invite Your First Members"
        body="A group works once there are people in it. Share an invite link to get started."
        cta={{ label: 'Invite People', to: `/dashboard/${communityId}/people` }}
        icon={UserPlus}
      />
    );
  }

  return (
    <div className="baraza-card p-6">
      <h2 className="font-display text-lg font-bold">Nothing Needs You</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You are up to date and no vote is open. The record below shows what has moved recently.
      </p>
    </div>
  );
}

function ActionCard({
  heading,
  body,
  cta,
  icon: Icon,
}: {
  heading: string;
  body: string;
  cta: { label: string; to: string };
  icon: React.ElementType;
}) {
  return (
    <div className="baraza-card p-6">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10" aria-hidden>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="font-display text-lg font-bold">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-5 w-full sm:w-auto">
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}
