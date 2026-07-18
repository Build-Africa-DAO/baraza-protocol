import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  Loader2,
  Send,
  ShieldCheck,
  Trophy,
  UsersRound,
} from 'lucide-react';
import Layout from '@/components/Layout';
import CommunityBanner from '@/components/CommunityBanner';
import {
  getBounty,
  getBountyAsync,
  listBountySubmissionsAsync,
  submitBountyWorkAsync,
  type Bounty,
  type BountyStatus,
  type BountySubmission,
} from '@/lib/bounties';
import { useCommunities } from '@/hooks/useCommunities';
import { cn, formatKSh, formatRailDate } from '@/lib/utils';
import { useSeo } from '@/lib/seo';
import AkiliSecurityReview from '@/akili/AkiliSecurityReview';
import { reviewBounty } from '@/lib/securityReview';
import { useChain } from '@/hooks/useChain';

const statusLabel: Record<BountyStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  in_review: 'Under review',
  awarded: 'Approved',
  paid: 'Approved',
};

const statusClass: Record<BountyStatus, string> = {
  open: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
  in_progress: 'border-primary/40 bg-primary/10 text-primary',
  in_review: 'border-accent/40 bg-accent/10 text-accent',
  awarded: 'border-secondary/40 bg-secondary/10 text-secondary',
  paid: 'border-confirmed/50 bg-confirmed/15 text-confirmed',
};

function daysLeft(deadline: string) {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

function BountyNotFound() {
  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <div className="baraza-card p-8">
            <Trophy className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold">Bounty not found</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This bounty may have been removed or the link may be incomplete.
            </p>
            <Link to="/bounties" className="btn-warm mt-6 inline-flex items-center gap-2 text-sm">
              Back to bounty board
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default function BountyDetail() {
  const { bountyId = '' } = useParams();
  const { chainMeta } = useChain();
  const { communities } = useCommunities();
  const [bounty, setBounty] = useState<Bounty | null>(() => getBounty(bountyId));
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submission, setSubmission] = useState({
    contributor: '',
    workUrl: '',
    note: '',
  });

  const community = useMemo(
    () => communities.find((item) => item.id === bounty?.communityId),
    [bounty?.communityId, communities],
  );

  useSeo({
    title: bounty ? `${bounty.title} bounty` : 'Bounty detail',
    description: bounty?.summary ?? 'Review a Baraza bounty and send a work update.',
    path: bountyId ? `/bounties/${bountyId}` : '/bounties',
  });

  const refresh = useCallback(async () => {
    const nextBounty = await getBountyAsync(bountyId);
    setBounty(nextBounty);
    if (nextBounty) {
      setSubmissions(await listBountySubmissionsAsync(nextBounty.id));
    } else {
      setSubmissions([]);
    }
  }, [bountyId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    refresh()
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof Error ? err.message : 'Bounty details could not load. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [bountyId, refresh]);

  const handleSubmitWork = async () => {
    if (!bounty) return;
    setIsSending(true);
    setMessage(null);
    try {
      await submitBountyWorkAsync({
        bountyId: bounty.id,
        contributor: submission.contributor,
        workUrl: submission.workUrl,
        note: submission.note,
      });
      setSubmission({ contributor: '', workUrl: '', note: '' });
      setMessage('Work update recorded for review.');
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Work update failed. Check the details and try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoading && !bounty) return <BountyNotFound />;
  const canSendWorkUpdate = bounty?.status === 'open' || bounty?.status === 'in_progress';
  const securityReview = bounty ? reviewBounty(bounty) : null;

  return (
    <Layout>
      <section className="relative pt-28 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/bounties" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to bounty board
          </Link>

          <CommunityBanner
            className="mb-6 min-h-[18rem] p-6 md:p-8"
            imageUrl="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
          >
            {bounty ? (
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
                    {statusLabel[bounty.status]}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest">{bounty.category}</span>
                </div>
                <h1 className="font-display text-3xl font-bold md:text-5xl">{bounty.title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6">{bounty.summary}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={`/dashboard/${bounty.communityId}`} className="btn-ghost inline-flex items-center gap-2 text-sm">
                    Open group
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {canSendWorkUpdate ? (
                    <a href="#work-update" className="btn-warm inline-flex items-center gap-2 text-sm">
                      Send work update
                      <Send className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-lg border border-confirmed/30 bg-confirmed/5 px-4 py-2 text-sm font-semibold text-confirmed">
                      {bounty.status === 'paid' ? 'Approved by owner' : statusLabel[bounty.status]}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading bounty details...
              </div>
            )}
          </CommunityBanner>

          {bounty && (
            <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
              <main className="space-y-6">
                <section className="baraza-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold">Bounty brief</h2>
                    <span className="font-display text-xl font-bold text-accent">{formatKSh(bounty.rewardKes)}</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{bounty.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {bounty.skills.map((skill) => (
                      <span key={skill} className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                {canSendWorkUpdate ? (
                  <section id="work-update" className="baraza-card p-5">
                    <h2 className="font-display text-lg font-semibold">Send work update</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Share your delivery link and a short note so the group can review the work.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input
                        value={submission.contributor}
                        onChange={(event) => setSubmission((current) => ({ ...current, contributor: event.target.value }))}
                        className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                        placeholder="e.g. Wanjiru M."
                      />
                      <input
                        value={submission.workUrl}
                        onChange={(event) => setSubmission((current) => ({ ...current, workUrl: event.target.value }))}
                        className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                        placeholder="https://..."
                      />
                      <textarea
                        value={submission.note}
                        onChange={(event) => setSubmission((current) => ({ ...current, note: event.target.value }))}
                        className="min-h-24 rounded-lg border px-3 py-2.5 text-sm outline-none sm:col-span-2"
                        placeholder="e.g. First draft is ready for member review."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSubmitWork()}
                      disabled={isSending}
                      className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Record work update
                    </button>
                    {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
                  </section>
                ) : (
                  <section className="baraza-card p-5">
                    <h2 className="font-display text-lg font-semibold">{statusLabel[bounty.status]}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bounty.status === 'paid'
                        ? 'This bounty has been approved. New work updates stay closed unless the owner reopens it for review.'
                        : 'This bounty is not accepting new work updates right now.'}
                    </p>
                  </section>
                )}

                <section className="baraza-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold">Work updates</h2>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {submissions.length} records
                    </span>
                  </div>
                  {submissions.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <BriefcaseBusiness className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                      <p className="font-display text-sm font-semibold">No work updates yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        The first contributor update will appear here for group review.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((item) => (
                        <article key={item.id} className="rounded-lg border p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-display text-sm font-semibold">{item.contributor}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatRailDate(item.submittedAt, chainMeta, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <a
                              href={item.workUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              View work
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {item.note && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.note}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </main>

              <aside className="space-y-6">
                {securityReview && <AkiliSecurityReview review={securityReview} />}

                <section className="baraza-card p-5">
                  <h2 className="font-display text-lg font-semibold">Bounty details</h2>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        Deadline
                      </span>
                      <span className="font-semibold">{daysLeft(bounty.deadline)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <UsersRound className="h-4 w-4" />
                        Submissions
                      </span>
                      <span className="font-semibold">{Math.max(bounty.submissions, submissions.length)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        Access
                      </span>
                      <span className="font-semibold">{bounty.roleGated ? 'Members only' : 'Open'}</span>
                    </div>
                  </div>
                </section>

                <section className="baraza-card p-5">
                  <h2 className="font-display text-lg font-semibold">Group</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {community?.name ?? bounty.postedBy}
                  </p>
                  {community && (
                    <Link to={`/dashboard/${community.id}`} className="btn-ghost mt-4 inline-flex items-center gap-2 text-sm">
                      Open group dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </section>
              </aside>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
