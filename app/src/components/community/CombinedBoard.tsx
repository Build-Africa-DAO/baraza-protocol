import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarDays, CircleDot, Clock, Layers, Vote } from 'lucide-react';
import { getBountiesForCommunity } from '@/lib/bounties';
import { formatKSh, cn } from '@/lib/utils';
import type { Decision } from '@/lib/dataStore';

interface FeedItem {
  id: string;
  kind: 'bounty' | 'proposal';
  title: string;
  meta: string;
  badge: string;
  badgeClass: string;
  deadline: string;
  reward?: string;
  href: string;
}

function daysLeft(deadline: string) {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

interface Props {
  communityId: string;
  decisions: Decision[];
}

export default function CombinedBoard({ communityId, decisions }: Props) {
  const bounties = getBountiesForCommunity(communityId);

  const items: FeedItem[] = [
    // Active bounties
    ...bounties
      .filter((b) => b.status === 'open' || b.status === 'in_progress' || b.status === 'in_review')
      .map((b): FeedItem => ({
        id: b.id,
        kind: 'bounty',
        title: b.title,
        meta: `${b.category} - ${b.submissions} applicants`,
        badge: b.status === 'open' ? 'Open' : b.status === 'in_progress' ? 'In Progress' : 'In Review',
        badgeClass:
          b.status === 'open' ? 'border-confirmed/40 bg-confirmed/10 text-confirmed' :
          b.status === 'in_progress' ? 'border-primary/40 bg-primary/10 text-primary' :
          'border-accent/40 bg-accent/10 text-accent',
        deadline: b.deadline,
        reward: formatKSh(b.rewardKes),
        href: `/bounties/${b.id}`,
      })),

    // Active proposals
    ...decisions
      .filter((d) => d.status === 'active')
      .map((d): FeedItem => ({
        id: d.id,
        kind: 'proposal',
        title: d.title,
        meta: `${d.votesFor + d.votesAgainst} votes cast`,
        badge: 'Voting',
        badgeClass: 'border-secondary/40 bg-secondary/10 text-secondary',
        deadline: d.endsAt,
        href: `/dashboard/${communityId}`,
      })),
  ].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div className="space-y-4">
      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Combined board</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          All active bounties and live governance proposals, sorted by deadline.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="baraza-card p-10 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-display text-sm font-semibold">No active items</p>
          <p className="mt-1 text-xs text-muted-foreground">Open bounties and active proposals will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="baraza-card flex items-center gap-3 p-4 transition-colors hover:border-primary/30"
            >
              {/* Kind icon */}
              <div className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border',
                item.kind === 'bounty'
                  ? 'border-confirmed/30 bg-confirmed/10'
                  : 'border-secondary/30 bg-secondary/10',
              )}>
                {item.kind === 'bounty'
                  ? <BriefcaseBusiness className="h-4 w-4 text-confirmed" />
                  : <Vote className="h-4 w-4 text-secondary" />
                }
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    item.badgeClass,
                  )}>
                    {item.kind === 'bounty' ? <CircleDot className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.meta}</span>
                </div>
                <p className="font-display text-sm font-semibold leading-snug truncate">{item.title}</p>
              </div>

              {/* Right side */}
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5 text-right">
                {item.reward && (
                  <span className="font-display text-sm font-bold text-accent">{item.reward}</span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CalendarDays className="h-2.5 w-2.5" />
                  {daysLeft(item.deadline)}
                </span>
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BriefcaseBusiness className="h-3 w-3 text-confirmed" />
          Bounty
        </span>
        <span className="flex items-center gap-1.5">
          <Vote className="h-3 w-3 text-secondary" />
          Governance proposal
        </span>
      </div>
    </div>
  );
}
