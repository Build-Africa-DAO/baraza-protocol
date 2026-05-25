import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarDays, Columns3, LayoutGrid, List, PlusCircle, Search, Send, SlidersHorizontal, Trophy } from 'lucide-react';
import Layout from '@/components/Layout';
import CommunityBanner from '@/components/CommunityBanner';
import {
  createBountyRecordAsync,
  listBounties,
  listBountiesAsync,
  listBountySubmissionsAsync,
  submitBountyWorkAsync,
  type BountySubmission,
  type BountyStatus,
} from '@/lib/bounties';
import { useCommunities } from '@/hooks/useCommunities';
import { formatKSh, cn } from '@/lib/utils';
import { useSeo } from '@/lib/seo';

const STATUS_OPTIONS: { value: BountyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All bounties' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'Under review' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'paid', label: 'Approved' },
];

const statusLabel: Record<BountyStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  in_review: 'Under review',
  awarded: 'Awarded',
  paid: 'Approved',
};

const statusClass: Record<BountyStatus, string> = {
  open: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
  in_progress: 'border-primary/40 bg-primary/10 text-primary',
  in_review: 'border-accent/40 bg-accent/10 text-accent',
  awarded: 'border-secondary/40 bg-secondary/10 text-secondary',
  paid: 'border-confirmed/50 bg-confirmed/15 text-confirmed',
};

const BOARD_COLUMNS: BountyStatus[] = ['open', 'in_progress', 'in_review', 'awarded', 'paid'];
type ViewMode = 'board' | 'grid' | 'list';

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [bounties, setBounties] = useState(() => listBounties());
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [showPostForm, setShowPostForm] = useState(false);
  const [submitFor, setSubmitFor] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [newBounty, setNewBounty] = useState({
    communityId: '',
    title: '',
    category: 'General',
    rewardKes: '',
    deadline: '',
    summary: '',
    skills: '',
  });
  const [submission, setSubmission] = useState({
    contributor: '',
    workUrl: '',
    note: '',
  });
  const refreshBounties = async () => {
    const nextBounties = await listBountiesAsync();
    setBounties(nextBounties);
    const entries = await Promise.all(
      nextBounties.map(async (bounty): Promise<[string, BountySubmission[]]> => [
        bounty.id,
        await listBountySubmissionsAsync(bounty.id),
      ]),
    );
    setSubmissionCounts(Object.fromEntries(entries.map(([id, submissions]) => [id, submissions.length])));
  };

  useEffect(() => {
    void refreshBounties().catch((err) => {
      setFormMessage(err instanceof Error ? err.message : 'Could not load bounties.');
    });
  }, []);

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

  const visibleColumns = BOARD_COLUMNS
    .map((columnStatus) => ({
      status: columnStatus,
      bounties: filtered.filter((bounty) => bounty.status === columnStatus),
    }))
    .filter((column) => status === 'all' || column.status === status || column.bounties.length > 0);

  const openRewardPool = bounties
    .filter((bounty) => bounty.status === 'open')
    .reduce((sum, bounty) => sum + bounty.rewardKes, 0);

  const handleCreateBounty = async () => {
    const community = communityById.get(newBounty.communityId);
    try {
      await createBountyRecordAsync({
        communityId: newBounty.communityId,
        postedBy: community?.name ?? 'Baraza community',
        title: newBounty.title,
        category: newBounty.category,
        rewardKes: Number(newBounty.rewardKes),
        deadline: newBounty.deadline,
        summary: newBounty.summary,
        skills: newBounty.skills.split(','),
      });
      setNewBounty({
        communityId: '',
        title: '',
        category: 'General',
        rewardKes: '',
        deadline: '',
        summary: '',
        skills: '',
      });
      setShowPostForm(false);
      setFormMessage('Bounty posted to Baraza.');
      await refreshBounties();
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Could not post bounty.');
    }
  };

  const handleSubmitWork = async (bountyId: string) => {
    try {
      await submitBountyWorkAsync({
        bountyId,
        contributor: submission.contributor,
        workUrl: submission.workUrl,
        note: submission.note,
      });
      setSubmission({ contributor: '', workUrl: '', note: '' });
      setSubmitFor(null);
      setFormMessage('Submission recorded in Baraza.');
      await refreshBounties();
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Could not submit work.');
    }
  };

  return (
    <Layout>
      <section className="relative pt-28 pb-12">
        <div className="container mx-auto px-4">
          <CommunityBanner
            className="mb-8 min-h-[18rem] p-6 md:p-8"
            imageUrl="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80"
          >
            <div className="max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest">Baraza marketplace</p>
              <h1 className="font-display text-3xl font-bold md:text-5xl">Bounty board</h1>
              <p className="mt-3 max-w-xl text-sm leading-6">
                Paid community work across events, integrations, creative tasks, research, and operations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowPostForm((value) => !value);
                  setFormMessage(null);
                }}
                className="btn-warm mt-5 inline-flex items-center gap-2 text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Post bounty
              </button>
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

          {showPostForm && (
            <div className="baraza-card mb-6 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold">Community</label>
                  <select
                    value={newBounty.communityId}
                    onChange={(event) => setNewBounty((current) => ({ ...current, communityId: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="">Select community</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>{community.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Title</label>
                  <input
                    value={newBounty.title}
                    onChange={(event) => setNewBounty((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="e.g. Website landing page"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Category</label>
                  <input
                    value={newBounty.category}
                    onChange={(event) => setNewBounty((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="Design, Dev, Events"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Reward KES</label>
                  <input
                    value={newBounty.rewardKes}
                    onChange={(event) => setNewBounty((current) => ({ ...current, rewardKes: event.target.value }))}
                    type="number"
                    min="1"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Deadline</label>
                  <input
                    value={newBounty.deadline}
                    onChange={(event) => setNewBounty((current) => ({ ...current, deadline: event.target.value }))}
                    type="date"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Skills</label>
                  <input
                    value={newBounty.skills}
                    onChange={(event) => setNewBounty((current) => ({ ...current, skills: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="React, Design, Research"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold">Brief</label>
                  <textarea
                    value={newBounty.summary}
                    onChange={(event) => setNewBounty((current) => ({ ...current, summary: event.target.value }))}
                    className="min-h-24 w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="Describe the work, deliverables, and review expectations."
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateBounty()}
                className="btn-primary mt-4 gap-2 px-4 py-2 text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Publish bounty
              </button>
            </div>
          )}

          {formMessage && (
            <div className="mb-6 rounded-lg border px-4 py-3 text-sm">
              {formMessage}
            </div>
          )}

          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
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

            <div className="flex rounded-xl border bg-card p-1" aria-label="Bounty board view">
              {([
                ['board', Columns3, 'Board'],
                ['grid', LayoutGrid, 'Grid'],
                ['list', List, 'List'],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
                    viewMode === mode
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-pressed={viewMode === mode}
                  title={`${label} view`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'board' && filtered.length > 0 && (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4">
                {visibleColumns.map((column) => (
                  <section key={column.status} className="w-[min(19rem,82vw)] rounded-xl border bg-card/70 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[column.status])}>
                        {statusLabel[column.status]}
                      </span>
                      <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {column.bounties.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {column.bounties.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                          No {statusLabel[column.status].toLowerCase()} bounties match this search.
                        </div>
                      ) : column.bounties.map((bounty) => {
                        const community = communityById.get(bounty.communityId);
                        return (
                          <article key={bounty.id} className="rounded-lg border bg-background/45 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <Link to={`/bounties/${bounty.id}`} className="font-display text-sm font-bold leading-snug hover:text-primary">
                                {bounty.title}
                              </Link>
                              <span className="shrink-0 text-xs font-bold text-accent">{formatKSh(bounty.rewardKes)}</span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{bounty.summary}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {bounty.skills.slice(0, 3).map((skill) => (
                                <span key={skill} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{skill}</span>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                              <span className="truncate">{community?.name ?? bounty.postedBy}</span>
                              <span>{daysLeft(bounty.deadline)}</span>
                            </div>
                            <Link to={`/bounties/${bounty.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                              Open bounty
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'list' && filtered.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="hidden grid-cols-[1.3fr_0.8fr_0.5fr_0.55fr_0.65fr] gap-4 border-b px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:grid">
                <span>Bounty</span>
                <span>Group</span>
                <span>Status</span>
                <span>Deadline</span>
                <span className="text-right">Reward</span>
              </div>
              <div className="divide-y">
                {filtered.map((bounty) => {
                  const community = communityById.get(bounty.communityId);
                  return (
                    <article key={bounty.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_0.8fr_0.5fr_0.55fr_0.65fr] md:items-center md:gap-4">
                      <div className="min-w-0">
                        <Link to={`/bounties/${bounty.id}`} className="font-display text-sm font-bold hover:text-primary">
                          {bounty.title}
                        </Link>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{bounty.summary}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{community?.name ?? bounty.postedBy}</span>
                      <span className={cn('w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
                        {statusLabel[bounty.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {daysLeft(bounty.deadline)}
                      </span>
                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <span className="font-display text-sm font-bold text-accent">{formatKSh(bounty.rewardKes)}</span>
                        <Link to={`/bounties/${bounty.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                          Open
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'grid' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((bounty) => {
              const community = communityById.get(bounty.communityId);
              const canSendWorkUpdate = bounty.status === 'open' || bounty.status === 'in_progress';
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
                      <Link
                        to={`/bounties/${bounty.id}`}
                        className="font-display text-xl font-bold transition-colors hover:text-primary"
                      >
                        {bounty.title}
                      </Link>
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
                      <Link to={`/bounties/${bounty.id}`} className="btn-ghost justify-center gap-2 px-3 py-2 text-xs font-bold">
                        Open bounty
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link to={`/dashboard/${bounty.communityId}`} className="btn-ghost justify-center gap-2 px-3 py-2 text-xs font-bold">
                        Open group
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {canSendWorkUpdate ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitFor(submitFor === bounty.id ? null : bounty.id);
                            setFormMessage(null);
                          }}
                          className="btn-primary justify-center gap-2 px-3 py-2 text-xs font-bold"
                        >
                          Send work update
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-lg border border-confirmed/30 bg-confirmed/5 px-3 py-2 text-xs font-bold text-confirmed">
                          {bounty.status === 'paid' ? 'Approved' : statusLabel[bounty.status]}
                        </span>
                      )}
                    </div>
                  </div>

                  {canSendWorkUpdate && submitFor === bounty.id && (
                    <div className="mt-4 grid gap-3 border-t pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={submission.contributor}
                          onChange={(event) => setSubmission((current) => ({ ...current, contributor: event.target.value }))}
                          className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                          placeholder="Contributor name"
                        />
                        <input
                          value={submission.workUrl}
                          onChange={(event) => setSubmission((current) => ({ ...current, workUrl: event.target.value }))}
                          className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                          placeholder="Work URL"
                        />
                      </div>
                      <textarea
                        value={submission.note}
                        onChange={(event) => setSubmission((current) => ({ ...current, note: event.target.value }))}
                        className="min-h-20 rounded-lg border px-3 py-2.5 text-sm outline-none"
                        placeholder="Add a note for reviewers"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSubmitWork(bounty.id)}
                        className="btn-warm w-fit gap-2 px-4 py-2 text-sm"
                      >
                        <Send className="h-4 w-4" />
                        Record submission
                      </button>
                      {(submissionCounts[bounty.id] ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {submissionCounts[bounty.id]} Baraza submission records stored for review.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          )}

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
