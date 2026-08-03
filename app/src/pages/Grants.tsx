import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sprout,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { listGrants, filterGrants, type Grant, type GrantStatus, type GrantType } from '@/lib/grants';
import { checkGrantEligibility, DEFAULT_GRANT_REQUIREMENTS } from '@/lib/tokens/umbrella';
import { useCommunities } from '@/hooks/useCommunities';

type ViewMode = 'grid' | 'list';

const STATUS_OPTIONS: { value: GrantStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'closing_soon', label: 'Closing soon' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS: { value: GrantType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'protocol', label: 'Protocol grants' },
  { value: 'ecosystem', label: 'Ecosystem grants' },
  { value: 'external', label: 'External grants' },
];

const STATUS_STYLE: Record<GrantStatus, string> = {
  open: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
  closing_soon: 'border-accent/40 bg-accent/10 text-accent',
  upcoming: 'border-primary/40 bg-primary/10 text-primary',
  closed: 'border-muted/40 bg-muted/10 text-muted-foreground',
};

const STATUS_LABEL: Record<GrantStatus, string> = {
  open: 'Open',
  closing_soon: 'Closing soon',
  upcoming: 'Upcoming',
  closed: 'Closed',
};

const TYPE_STYLE: Record<GrantType, string> = {
  protocol: 'border-primary/30 bg-primary/10 text-primary',
  ecosystem: 'border-secondary/30 bg-secondary/10 text-secondary',
  external: 'border-accent/30 bg-accent/10 text-accent',
};

function daysLeft(deadline: string): string {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function nextDeadline(grants: Grant[]): string {
  const open = grants
    .filter((g) => g.status === 'open' || g.status === 'closing_soon')
    .map((g) => g.deadline)
    .sort();
  if (open.length === 0) return '—';
  const d = new Date(`${open[0]}T00:00:00`);
  return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface EligibilityPanelProps {
  grant: Grant;
  communities: ReturnType<typeof useCommunities>['communities'];
}

function EligibilityPanel({ grant, communities }: EligibilityPanelProps) {
  const [communityId, setCommunityId] = useState('');

  const result = useMemo(() => {
    if (!communityId) return null;
    const community = communities.find((c) => c.id === communityId);
    if (!community) return null;
    return checkGrantEligibility({
      communityId,
      memberCount: community.memberCount ?? 0,
      // On-chain analytics not yet synced to community records — defaulting to 0.
      // These will be wired when community stats indexing is complete.
      votesCast: 0,
      transactions: 0,
      tvlKes: 0,
      passedProposals: 0,
      activeDays: 0,
      communityTreasuryKes: community.treasuryBalanceKes ?? 0,
    });
  }, [communityId, communities]);

  if (!grant.requiresEligibilityCheck) return null;

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-surface/40 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Check eligibility
      </p>
      <select
        value={communityId}
        onChange={(e) => setCommunityId(e.target.value)}
        className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      >
        <option value="">Select your community</option>
        {communities.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {result && (
        <div className="mt-3">
          {result.eligible ? (
            <div className="flex items-start gap-2 rounded-lg border border-confirmed/40 bg-confirmed/10 p-3 text-confirmed">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm font-semibold">Your community meets all eligibility criteria.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-accent">
                <CircleAlert className="h-4 w-4 shrink-0" />
                <p className="text-sm font-semibold">Not yet eligible. Requirements outstanding:</p>
              </div>
              <ul className="ml-6 list-disc space-y-1 text-xs text-muted-foreground">
                {result.notes.map((note) => (
                  <li key={note}>
                    {note === 'minimumMemberCount' && `${DEFAULT_GRANT_REQUIREMENTS.memberCount}+ active members`}
                    {note === 'minimumVotesCast' && `${DEFAULT_GRANT_REQUIREMENTS.votesCast}+ votes cast`}
                    {note === 'minimumTransactions' && `${DEFAULT_GRANT_REQUIREMENTS.transactions}+ treasury transactions`}
                    {note === 'minimumTvl' && `KSh ${DEFAULT_GRANT_REQUIREMENTS.tvlKes.toLocaleString()}+ TVL`}
                    {note === 'minimumPassedProposals' && `${DEFAULT_GRANT_REQUIREMENTS.passedProposals}+ passed proposals`}
                    {note === 'minimumActiveDuration' && `${DEFAULT_GRANT_REQUIREMENTS.activeDays}+ days active`}
                    {note === 'treasuryAboveFloor' && `Treasury above KSh ${DEFAULT_GRANT_REQUIREMENTS.treasuryFloorKes.toLocaleString()} floor`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {communities.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          No communities loaded. Join or create a community first.
        </p>
      )}
    </div>
  );
}

interface GrantCardProps {
  grant: Grant;
  communities: ReturnType<typeof useCommunities>['communities'];
  viewMode: ViewMode;
}

function GrantCard({ grant, communities, viewMode }: GrantCardProps) {
  const [showEligibility, setShowEligibility] = useState(false);
  const days = daysLeft(grant.deadline);
  const isDeadlineNear = days !== 'Closed' && parseInt(days) <= 14;

  if (viewMode === 'list') {
    return (
      <article className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_0.7fr_0.55fr_0.6fr_0.65fr] md:items-center md:gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', TYPE_STYLE[grant.type])}>
              {grant.type}
            </span>
          </div>
          <p className="font-display text-sm font-bold leading-snug">{grant.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{grant.funder}</p>
        </div>
        <span className="text-xs font-semibold text-accent">{grant.amountLabel}</span>
        <span className={cn('w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', STATUS_STYLE[grant.status])}>
          {STATUS_LABEL[grant.status]}
        </span>
        <span className={cn('inline-flex items-center gap-1 text-xs', isDeadlineNear ? 'font-semibold text-accent' : 'text-muted-foreground')}>
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {days}
        </span>
        <div className="flex items-center justify-end">
          {grant.requiresEligibilityCheck ? (
            <button
              type="button"
              onClick={() => setShowEligibility((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
            >
              Check eligibility
            </button>
          ) : (
            grant.applyUrl && (
              <a
                href={grant.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Apply <ExternalLink className="h-3 w-3" />
              </a>
            )
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="baraza-card flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', STATUS_STYLE[grant.status])}>
              {STATUS_LABEL[grant.status]}
            </span>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', TYPE_STYLE[grant.type])}>
              {grant.type}
            </span>
          </div>
          <h3 className="font-display text-lg font-bold leading-snug">{grant.title}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{grant.funder}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-base font-bold text-accent">{grant.amountLabel}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{grant.currency}</p>
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-muted-foreground">{grant.summary}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {grant.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      <div className="mb-4 rounded-lg border border-border/50 bg-surface/30 p-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Eligibility</p>
        <ul className="space-y-1">
          {grant.eligibility.map((item) => (
            <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-confirmed/70" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        <span className={cn('inline-flex items-center gap-1 text-xs', isDeadlineNear ? 'font-semibold text-accent' : 'text-muted-foreground')}>
          <CalendarDays className="h-3.5 w-3.5" />
          {days}
        </span>
        {grant.requiresEligibilityCheck ? (
          <button
            type="button"
            onClick={() => setShowEligibility((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
          >
            {showEligibility ? 'Hide checker' : 'Check eligibility'}
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          grant.applyUrl ? (
            <a
              href={grant.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-confirmed/40 bg-confirmed/10 px-3 py-2 text-xs font-bold text-confirmed transition-colors hover:bg-confirmed/15"
            >
              Apply now
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Applications open soon</span>
          )
        )}
      </div>

      {showEligibility && (
        <EligibilityPanel grant={grant} communities={communities} />
      )}
    </article>
  );
}

export default function Grants() {
  useSeo({
    title: 'Active grants',
    description:
      'Discover active grant opportunities for African DAOs, SACCOs, cooperatives, and chamas — from the Baraza protocol and ecosystem partners.',
    path: '/grants',
  });

  const { communities } = useCommunities();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<GrantType | 'all'>('all');
  const [status, setStatus] = useState<GrantStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const allGrants = useMemo(() => listGrants(), []);
  const filtered = useMemo(() => filterGrants(allGrants, { search, type, status }), [allGrants, search, type, status]);

  const openCount = allGrants.filter((g) => g.status === 'open' || g.status === 'closing_soon').length;
  const nextDeadlineLabel = nextDeadline(allGrants);

  return (
    <Layout>
      <section className="relative pt-24 pb-10 sm:pt-28">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Hero */}
          <div className="relative mb-8 overflow-hidden rounded-lg border border-border/70 bg-card shadow-[var(--shadow-card)]">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=80"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/88 via-transparent to-transparent" />

            <div className="relative grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,30rem)] md:items-center md:p-7">
              <div className="max-w-[38rem]">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                  Funding opportunities
                </p>
                <h1 className="font-display text-3xl font-black leading-tight md:text-4xl">
                  Active grants
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                  Protocol grants from Baraza and external funding for African DAOs, SACCOs, cooperatives, and chamas. Check your community's eligibility and apply directly.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/58 p-3 backdrop-blur">
                  <p className="font-display text-xl font-bold">{openCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Open grants</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/58 p-3 backdrop-blur">
                  <p className="font-display text-xl font-bold text-primary">{allGrants.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total listings</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/58 p-3 backdrop-blur">
                  <p className="font-display truncate text-base font-bold">{nextDeadlineLabel}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Next deadline</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search grants, funders, eligibility..."
                className="w-full rounded-xl border bg-card px-4 py-3 pl-10 text-sm outline-none"
                aria-label="Search grants"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GrantType | 'all')}
                className="min-w-40 appearance-none rounded-xl border bg-card py-3 pl-10 pr-8 text-sm outline-none"
                aria-label="Filter by grant type"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GrantStatus | 'all')}
                className="min-w-40 appearance-none rounded-xl border bg-card py-3 pl-10 pr-8 text-sm outline-none"
                aria-label="Filter by grant status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex rounded-xl border bg-card p-1" aria-label="Grant view mode">
              {([
                ['grid', LayoutGrid, 'Grid'],
                ['list', List, 'List'],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  title={`${label} view`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
                    viewMode === mode
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Results header */}
          {filtered.length > 0 && (
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold">
                {status === 'all' && type === 'all' ? 'All grants' : 'Filtered grants'}
              </h2>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'grant' : 'grants'}
              </span>
            </div>
          )}

          {/* Grid view */}
          {viewMode === 'grid' && filtered.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-2">
              {filtered.map((grant) => (
                <GrantCard key={grant.id} grant={grant} communities={communities} viewMode="grid" />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && filtered.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="hidden grid-cols-[1.4fr_0.7fr_0.55fr_0.6fr_0.65fr] gap-4 border-b px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:grid">
                <span>Grant</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Deadline</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y">
                {filtered.map((grant) => (
                  <GrantCard key={grant.id} grant={grant} communities={communities} viewMode="list" />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="baraza-card mt-8 p-10 text-center">
              <Sprout className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="font-display text-base font-semibold">No grants match that filter</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different type, status, or search term.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
