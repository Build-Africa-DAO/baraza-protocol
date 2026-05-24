import { BriefcaseBusiness, CalendarDays, ExternalLink, Megaphone, Trophy } from 'lucide-react';
import { getBountiesForCommunity, type Bounty } from '@/lib/bounties';
import { formatKSh, cn } from '@/lib/utils';

interface BountyBoardProps {
  communityId: string;
  communityName?: string;
  compact?: boolean;
}

const statusLabel: Record<Bounty['status'], string> = {
  open: 'Open',
  in_review: 'In review',
  awarded: 'Awarded',
};

const statusClass: Record<Bounty['status'], string> = {
  open: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
  in_review: 'border-primary/40 bg-primary/10 text-primary',
  awarded: 'border-secondary/40 bg-secondary/10 text-secondary',
};

function daysLeft(deadline: string) {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

function BountyCard({ bounty, compact = false }: { bounty: Bounty; compact?: boolean }) {
  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
              {statusLabel[bounty.status]}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {bounty.category}
            </span>
          </div>
          <h4 className="font-display text-base font-bold text-foreground">{bounty.title}</h4>
          {!compact && <p className="mt-2 text-sm leading-6 text-muted-foreground">{bounty.summary}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-bold text-accent">{formatKSh(bounty.rewardKes)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{bounty.submissions} submissions</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
          <CalendarDays className="h-3 w-3" />
          {daysLeft(bounty.deadline)}
        </span>
        {bounty.skills.slice(0, compact ? 2 : 3).map((skill) => (
          <span key={skill} className="rounded-full border px-2 py-1 text-muted-foreground">
            {skill}
          </span>
        ))}
      </div>

      <a
        href={bounty.externalUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost mt-4 w-full justify-center gap-2 px-3 py-2 text-xs font-bold"
      >
        Open on Dework
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

export default function BountyBoard({ communityId, communityName = 'this community', compact = false }: BountyBoardProps) {
  const bounties = getBountiesForCommunity(communityId);
  const openCount = bounties.filter((bounty) => bounty.status === 'open').length;
  const rewardPool = bounties
    .filter((bounty) => bounty.status === 'open')
    .reduce((sum, bounty) => sum + bounty.rewardKes, 0);
  const shown = compact ? bounties.slice(0, 2) : bounties;

  if (bounties.length === 0) {
    return (
      <div className="baraza-card p-6 text-center">
        <BriefcaseBusiness className="mx-auto mb-3 h-7 w-7" />
        <p className="font-display text-base font-semibold">No bounties yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Bounty announcements will appear here when {communityName} posts paid work.
        </p>
      </div>
    );
  }

  return (
    <section className="baraza-card p-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            <Megaphone className="h-3.5 w-3.5 text-primary" />
            Bounty board announcement
          </div>
          <h3 className="font-display text-lg font-semibold">Paid work from {communityName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Open tasks, event work, integrations, and member-contributor opportunities.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right sm:min-w-44">
          <div className="rounded-lg border p-3">
            <p className="font-display text-xl font-bold">{openCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-display text-xl font-bold text-accent">{formatKSh(rewardPool)}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rewards</p>
          </div>
        </div>
      </div>

      <div className={cn('grid gap-3', !compact && 'lg:grid-cols-2')}>
        {shown.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} compact={compact} />
        ))}
      </div>

      {compact && bounties.length > shown.length && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-secondary" />
          {bounties.length - shown.length} more bounty announcements in the Bounties tab.
        </div>
      )}
    </section>
  );
}
