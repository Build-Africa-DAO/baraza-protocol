import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, RefreshCw, UserRound } from 'lucide-react';
import Layout from '@/components/Layout';
import {
  listGithubBounties,
  type GithubBounty,
  type GithubBountyStatus,
} from '@/lib/githubBounties';
import { cn } from '@/lib/utils';
import { useSeo } from '@/lib/seo';

const FILTERS: Array<{ value: GithubBountyStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'in_review', label: 'In review' },
  { value: 'paid', label: 'Paid' },
];

const STATUS_LABELS: Record<GithubBountyStatus, string> = {
  open: 'Open',
  claimed: 'Claimed',
  in_review: 'In review',
  paid: 'Paid',
};

const STATUS_STYLES: Record<GithubBountyStatus, string> = {
  open: 'border-[#72D59A]/35 bg-[#72D59A]/10 text-[#9DE6B8]',
  claimed: 'border-[#F97316]/45 bg-[#F97316]/10 text-[#FFAA70]',
  in_review: 'border-[#7DB7FF]/35 bg-[#7DB7FF]/10 text-[#A9CEFF]',
  paid: 'border-[#FFE083]/35 bg-[#FFE083]/10 text-[#FFE083]',
};

function formatPayout(amount: number | null): string {
  if (amount === null) return 'TBD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${deadline}T00:00:00Z`));
}

function BountySkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-44 animate-pulse rounded-lg border border-[#FFE083]/10 bg-[#2F2410] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

function BountyCard({ bounty }: { bounty: GithubBounty }) {
  return (
    <article className="rounded-lg border border-[#FFE083]/12 bg-[#2F2410] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.18)] sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[#CDBF98]">Issue #{bounty.issueNumber}</span>
        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS_STYLES[bounty.status])}>
          {STATUS_LABELS[bounty.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_9rem_12rem] md:items-center">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-6 text-[#FFE083] sm:text-xl">{bounty.title}</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#E8DDBD]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
              {formatDeadline(bounty.deadline)}
            </span>
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
              {bounty.reviewer || 'Reviewer unassigned'}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[#CDBF98]">Payout</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[#FFE083]">{formatPayout(bounty.amountUsd)}</p>
        </div>

        <a
          href={bounty.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#F97316] px-4 py-2.5 text-sm font-bold text-[#181303] transition-colors hover:bg-[#FF8A33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE083] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2F2410]"
        >
          Claim on GitHub
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export default function Bounties() {
  useSeo({
    title: 'Bounties',
    description: 'Claim public Baraza work through the linked GitHub issue.',
    path: '/bounties',
  });

  const [selectedStatus, setSelectedStatus] = useState<GithubBountyStatus>('open');
  const [bounties, setBounties] = useState<GithubBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBounties = async () => {
    setLoading(true);
    setError(null);
    try {
      setBounties(await listGithubBounties());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load bounties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBounties();
  }, []);

  const filteredBounties = useMemo(
    () => bounties.filter((bounty) => bounty.status === selectedStatus),
    [bounties, selectedStatus],
  );

  const statusCounts = useMemo(() => {
    return bounties.reduce<Record<GithubBountyStatus, number>>((counts, bounty) => {
      counts[bounty.status] += 1;
      return counts;
    }, { open: 0, claimed: 0, in_review: 0, paid: 0 });
  }, [bounties]);

  return (
    <Layout>
      <section className="min-h-screen bg-[#181303] pb-28 pt-24 text-[#F6EDCF] sm:pt-28">
        <div className="container mx-auto max-w-5xl px-4">
          <header className="border-b border-[#FFE083]/15 pb-6">
            <h1 className="text-3xl font-black text-[#FFE083] sm:text-4xl">Bounty board</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D8CCAA] sm:text-base">
              Public Baraza work mirrored from Supabase. Open the linked issue to claim a task and coordinate delivery on GitHub.
            </p>
          </header>

          <div className="mt-6 overflow-x-auto pb-1">
            <div className="inline-flex min-w-full gap-1 rounded-lg border border-[#FFE083]/15 bg-[#211A09] p-1 sm:min-w-0" role="tablist" aria-label="Bounty status">
              {FILTERS.map((filter) => {
                const active = selectedStatus === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedStatus(filter.value)}
                    className={cn(
                      'min-h-10 flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE083]',
                      active ? 'bg-[#F97316] text-[#181303]' : 'text-[#D8CCAA] hover:bg-[#2F2410] hover:text-[#FFE083]',
                    )}
                  >
                    {filter.label}
                    <span className={cn('ml-2 text-xs tabular-nums', active ? 'text-[#181303]/75' : 'text-[#AFA27F]')}>
                      {statusCounts[filter.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5" role="tabpanel">
            {loading ? (
              <BountySkeleton />
            ) : error ? (
              <div className="rounded-lg border border-[#F97316]/35 bg-[#2F2410] px-5 py-8 text-center">
                <p className="font-semibold text-[#FFE083]">Bounties could not be loaded.</p>
                <p className="mt-2 text-sm text-[#D8CCAA]">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadBounties()}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#F97316] px-4 py-2 text-sm font-bold text-[#FFAA70] hover:bg-[#F97316]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE083]"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            ) : filteredBounties.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#FFE083]/25 bg-[#2F2410]/70 px-6 py-16 text-center">
                <p className="mx-auto max-w-md text-lg font-bold text-[#FFE083]">
                  Bounties open after our public launch. Watch this space.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBounties.map((bounty) => (
                  <BountyCard key={bounty.issueNumber} bounty={bounty} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
