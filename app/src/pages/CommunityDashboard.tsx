import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Lightbulb, ReceiptText, UserPlus, Vote as VoteIcon } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ListRow } from '@/components/app/ListRow';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusChip } from '@/components/ui/status-chip';
import { useCommunityActivity, useProposals } from '@/hooks/useProposals';
import type { GroupMembership } from '@/hooks/useGroupMembership';
import type { Community } from '@/lib/constants';
import { formatMajor, formatMoney } from '@/lib/money';
import { proposalBucket } from '@/lib/proposalStatus';
import { formatAccountDate } from '@/lib/accountLocale';
import { isVotingOpen, participationPct, voteTimeLabel } from '@/lib/voteCopy';
import type { ActivityEvent, Decision } from '@/lib/dataStore';

/**
 * §13.12 Group and Community Home — Identity-First Architecture.
 *
 * Answers the core identity questions:
 * 1. Who are we? (Logo, Name, Mission, About)
 * 2. What are we doing? (Community Goals, Latest Updates, Events)
 * 3. How can I participate? (Make a Proposal CTA, Open Votes, Active Discussions)
 * 4. Financial transparency (Ledger, Treasury, only where applicable)
 */
export default function CommunityDashboard() {
  return (
    <GroupWorkspace hideJoinCta>
      {({ community, membership, isOfficer }) => (
        <HomePanel
          community={community}
          communityId={community.id}
          currency={community.currency}
          memberCount={community.memberCount}
          fundBalance={community.fundBalance}
          liquidVaultBalanceMinor={community.liquidVaultBalanceMinor ?? null}
          encumberedBalanceMinor={community.encumberedBalanceMinor ?? null}
          quorumPct={community.quorumPct}
          membership={membership}
          isOfficer={isOfficer}
        />
      )}
    </GroupWorkspace>
  );
}

function getGoalsForType(type: string): string[] {
  switch (type) {
    case 'creative':
      return [
        'Showcase and elevate local creative talent and cultural artifacts.',
        'Fund community-voted design, music, and multimedia projects.',
        'Retain sovereign collective ownership of all creative assets.',
      ];
    case 'savings':
      return [
        'Cultivate disciplined group savings and table banking capital.',
        'Provide instant, low-friction emergency micro-credit for members.',
        'Distribute transparent dividends and pooled returns annually.',
      ];
    case 'welfare':
      return [
        'Support member families during medical and bereavement emergencies.',
        'Ensure rapid, transparent disbursement of emergency benevolence funds.',
        'Keep an indisputable, tamper-proof record of all contributions.',
      ];
    case 'investment':
      return [
        'Pool collective capital for high-yield ventures, equities, and real estate.',
        'Conduct rigorous group due diligence on all investment proposals.',
        'Distribute returns proportionally based on member equity stakes.',
      ];
    case 'cooperative':
      return [
        'Strengthen collective bargaining power for shared produce and supplies.',
        'Pool resources to invest in communal equipment and logistics.',
        'Ensure fair member dividends and democratic representation.',
      ];
    default:
      return [
        'Foster collaboration, mutual aid, and active member participation.',
        'Propose and vote on community initiatives with transparent quorum.',
        'Coordinate shared treasury resources with zero central gatekeepers.',
      ];
  }
}

function HomePanel({
  community,
  communityId,
  currency,
  memberCount,
  fundBalance,
  liquidVaultBalanceMinor,
  encumberedBalanceMinor,
  quorumPct,
  membership,
  isOfficer,
}: {
  community: Community;
  communityId: string;
  currency?: string;
  memberCount: number;
  fundBalance: number | undefined;
  liquidVaultBalanceMinor: number | null;
  encumberedBalanceMinor: number | null;
  quorumPct?: number;
  membership: GroupMembership;
  isOfficer: boolean;
}) {
  const { all } = useProposals(communityId);
  const openVotes = all.filter((decision) => proposalBucket(decision) === 'active' && isVotingOpen(decision));
  const awaitingSend = all.filter((decision) => proposalBucket(decision) === 'passed');
  const { events: activities } = useCommunityActivity(communityId);
  const hasBalance = typeof fundBalance === 'number';
  const goals = getGoalsForType(community.type);

  return (
    <div className="space-y-6">
      {/* 1. Next Action Banner / Urgent Notice */}
      <NextAction
        communityId={communityId}
        currency={membership.currency ?? currency}
        membership={membership}
        isOfficer={isOfficer}
        openVotes={openVotes}
        awaitingSendCount={awaitingSend.length}
        memberCount={memberCount}
      />

      {/* 2. About the Community */}
      <section className="baraza-card p-6 space-y-3" aria-labelledby="home-about">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About Community</span>
          <span className="text-xs text-muted-foreground">{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
        </div>
        <h2 id="home-about" className="font-display text-xl font-bold">
          {community.name}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {community.description || 'A community operating on Baraza Protocol.'}
        </p>
      </section>

      {/* 3. Community Goals */}
      <section className="baraza-card p-6 space-y-4" aria-labelledby="home-goals">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mission & Pillars</span>
          <h2 id="home-goals" className="mt-1 font-display text-lg font-bold">
            Community Goals
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {goals.map((goal, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-surface p-4 text-xs space-y-1.5">
              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                0{idx + 1}
              </span>
              <p className="font-medium text-foreground leading-snug">{goal}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Latest Updates & Upcoming Events */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="baraza-card p-5 space-y-3" aria-labelledby="home-updates">
          <div className="flex items-center justify-between">
            <h2 id="home-updates" className="font-display text-base font-bold">
              Latest Updates
            </h2>
            <span className="text-xs text-muted-foreground">Live Feed</span>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface/50 p-3.5 text-xs space-y-1">
            <p className="font-semibold text-foreground">Welcome to {community.name}</p>
            <p className="text-muted-foreground">
              Official community space on Baraza. Propose initiatives, coordinate projects, and vote democratically.
            </p>
          </div>
        </section>

        <section className="baraza-card p-5 space-y-3" aria-labelledby="home-events">
          <div className="flex items-center justify-between">
            <h2 id="home-events" className="font-display text-base font-bold">
              Upcoming Events
            </h2>
            <span className="text-xs text-muted-foreground">Schedule</span>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface/50 p-3.5 text-xs space-y-1">
            <p className="font-semibold text-foreground">Weekly Community Gathering</p>
            <p className="text-muted-foreground">
              Every Saturday · Open member session for new proposals and project updates.
            </p>
          </div>
        </section>
      </div>

      {/* 5. Prominent Make a Proposal CTA (Issue 9) */}
      <section className="baraza-card border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5" aria-labelledby="home-proposal-cta">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Have an Idea?</span>
          </div>
          <h2 id="home-proposal-cta" className="font-display text-xl font-bold text-foreground">
            Make a Proposal for {community.name}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Members can propose new initiatives, spending requests, or rule updates. Everything passes through transparent quorum voting.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 font-semibold shadow-md sm:w-auto">
          <Link to={`/dashboard/${communityId}/votes/new`}>
            Make a Proposal
          </Link>
        </Button>
      </section>

      {/* 6. Open Votes */}
      {openVotes.length > 0 && (
        <section aria-labelledby="home-open-votes">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="home-open-votes" className="font-display text-base font-bold">
              Open Votes
            </h2>
            <Link
              to={`/dashboard/${communityId}/votes`}
              className="inline-flex min-h-12 items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
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

      {/* 7. Money & Financial Information */}
      <section className="baraza-card p-5 text-center" aria-labelledby="home-money">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="text-center">
            <h2 id="home-money" className="font-display text-base font-bold text-center">
              Money
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              What this group holds, and what has moved.
            </p>
          </div>
          {isOfficer ? (
            <div className="absolute right-0 top-0">
              <Button asChild variant="outline" size="sm">
                <Link to={`/dashboard/${communityId}/money`}>Open Money</Link>
              </Button>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 text-center sm:grid-cols-3">
          <AmountBlock className="text-center" label="Total" amountMajor={hasBalance ? fundBalance : null} currency={currency} />
          <AmountBlock className="text-center" label="Reserved" amountMinor={encumberedBalanceMinor ?? null} currency={currency} size="md" />
          <AmountBlock className="text-center" label="Available" amountMinor={liquidVaultBalanceMinor ?? null} currency={currency} size="md" />
        </div>
      </section>

      {/* 8. Recent Movement */}
      <section aria-labelledby="home-movement">
        <div className="relative mb-3 flex items-center justify-center">
          <h2 id="home-movement" className="font-display text-base font-bold text-center">
            Recent Movement
          </h2>
          {activities.length > 5 ? (
            <Link
              to={`/dashboard/${communityId}/money`}
              className="absolute right-0 inline-flex min-h-12 items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
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
    <div className="baraza-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-4 sm:items-center min-w-0">
        <Icon className="h-10 w-10 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      <Button asChild className="w-full sm:w-auto shrink-0 sm:ml-4">
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}
