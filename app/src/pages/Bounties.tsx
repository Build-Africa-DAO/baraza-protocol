import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarDays, ExternalLink, Search, SlidersHorizontal, Trophy } from 'lucide-react';
import Layout from '@/components/Layout';
import CommunityBanner from '@/components/CommunityBanner';
import { listBounties, type BountyStatus } from '@/lib/bounties';
import { useCommunities } from '@/hooks/useCommunities';
import { formatKSh, cn } from '@/lib/utils';
import { useSeo } from '@/lib/seo';

const STATUS_OPTIONS: { value: BountyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All bounties' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'awarded', label: 'Awarded' },
];

const statusLabel: Record<BountyStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  awarded: 'Awarded',
};

const statusClass: Record<BountyStatus, string> = {
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

export default function Bounties() {
  useSeo({
    title: 'Bounty board',
    description: 'Find paid tasks, event work, integrations, and contributor opportunities across Baraza communities.',
    path: '/bounties',
  });

  const { communities } = useCommunities();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BountyStatus | 'all'>('open');
  const bounties = listBounties();

  const communityById = useMemo(
    () => new Map(communities.map((community) => [community.id, community])),
    [communities],
  );

  const filtered = bounties.filter((bounty) => {
    const community = communityById.get(bounty.communityId);
    const haystack = `${bounty.title} ${bounty.category} ${bounty.summary} ${bounty.skills.join(' ')} ${community?.name ?? ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = status === 'all' || bounty.status === status;
    return matchesSearch && matchesStatus;
  });

  const openRewardPool = bounties
    .filter((bounty) => bounty.status === 'open')
    .reduce((sum, bounty) => sum + bounty.rewardKes, 0);

  return (
    <Layout>
      <section className="relative pt-28 pb-12">
        <div className="container mx-auto px-4">
          <CommunityBanner className="mb-8 min-h-[18rem] p-6 md:p-8">
            <div className="max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest">Baraza marketplace</p>
              <h1 className="font-display text-3xl font-bold md:text-5xl">Bounty board</h1>
              <p className="mt-3 max-w-xl text-sm leading-6">
                Paid community work across events, integrations, creative tasks, research, and operations.
              </p>
              <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
                <div className="rounded-lg border bg-background/40 p-3">
                  <p className="font-display text-2xl font-bold">{bounties.filter((b) => b.status === 'open').length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Open bounties</p>
                </div>
                <div className="rounded-lg border bg-background/40 p-3">
                  <p className="font-display text-2xl font-bold text-accent">{formatKSh(openRewardPool)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Reward pool</p>
                </div>
              </div>
            </div>
          </CommunityBanner>

          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search skills, communities, tasks..."
                className="w-full rounded-xl border bg-card px-4 py-3 pl-10 text-sm outline-none"
                aria-label="Search bounties"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BountyStatus | 'all')}
                className="min-w-40 appearance-none rounded-xl border bg-card py-3 pl-10 pr-8 text-sm outline-none"
                aria-label="Filter bounties by status"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((bounty) => {
              const community = communityById.get(bounty.communityId);
              return (
                <article key={bounty.id} className="baraza-card p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
                          {statusLabel[bounty.status]}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{bounty.category}</span>
                      </div>
                      <h2 className="font-display text-xl font-bold">{bounty.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{bounty.summary}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl font-bold text-accent">{formatKSh(bounty.rewardKes)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{bounty.submissions} submissions</p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {bounty.skills.map((skill) => (
                      <span key={skill} className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">{skill}</span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {community?.name ?? bounty.postedBy}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {daysLeft(bounty.deadline)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link to={`/dashboard/${bounty.communityId}`} className="btn-ghost justify-center gap-2 px-3 py-2 text-xs font-bold">
                        Open DAO
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={bounty.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary justify-center gap-2 px-3 py-2 text-xs font-bold"
                      >
                        Open on Dework
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="baraza-card mt-8 p-10 text-center">
              <Trophy className="mx-auto mb-3 h-8 w-8" />
              <p className="font-display text-base font-semibold">No bounties match that filter</p>
              <p className="mt-2 text-sm text-muted-foreground">Try another skill, community, or status.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
