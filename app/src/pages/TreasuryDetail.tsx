import { ArrowLeft, Check, ChevronRight, Clock3, LockKeyhole, ShieldCheck, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import CommunityBanner from '@/components/CommunityBanner';
import { useCommunity } from '@/hooks/useCommunities';
import { useTreasuryApprovals } from '@/hooks/useTreasuryApprovals';
import { useChain } from '@/hooks/useChain';
import { formatKSh } from '@/lib/utils';
import { withdrawalStatusLabel } from '@/lib/treasuryApprovals';
import { useSeo } from '@/lib/seo';
import { CHAINS } from '@/lib/chain';

const statusTone = {
  'needs-approval': 'bg-accent/10 text-accent',
  'approved-paused': 'bg-muted text-muted-foreground',
  paid: 'bg-confirmed/10 text-confirmed',
} as const;

export default function TreasuryDetail() {
  const { id } = useParams<{ id: string }>();
  const { community } = useCommunity(id);
  const approvals = useTreasuryApprovals(community);
  const { chain, chainMeta } = useChain();
  const accountMeta = CHAINS[community?.chain ?? chain] ?? chainMeta;

  useSeo({
    title: community ? `${community.name} group account` : 'Group account',
    description: 'Group funds, withdrawal approvers, and payment status for community members.',
    path: id ? `/dashboard/${id}/treasury` : undefined,
    noIndex: true,
  });

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <Link to={`/dashboard/${id ?? ''}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to community home
          </Link>

          <CommunityBanner type={community?.type} className="mb-8 p-5 md:p-7">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-primary">Group account</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">{community?.name ?? 'Community'} funds</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  See the balance, who must approve a withdrawal, and where each request stands.
                </p>
              </div>
              <button type="button" disabled title="Withdrawals remain paused during safety setup" className="btn-ghost cursor-not-allowed gap-2 text-sm opacity-55">
                <LockKeyhole className="h-4 w-4" /> Request withdrawal
              </button>
            </div>
          </CommunityBanner>

          <div className="mb-8 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
            <section aria-labelledby="funds-heading" className="rounded-2xl border border-border/70 bg-card p-6">
              <p id="funds-heading" className="text-sm text-muted-foreground">Group funds available</p>
              <p className="mt-2 font-display text-4xl font-semibold text-foreground">{formatKSh(community?.fundBalance ?? 0)}</p>
              <p className="mt-4 text-sm text-muted-foreground">All amounts are shown in Kenya shillings for members.</p>
            </section>
            <section aria-labelledby="safety-heading" className="rounded-2xl bg-muted/45 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 id="safety-heading" className="font-display text-lg font-semibold">Withdrawals are paused</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Approvers can review the setup and requests, but no group money can be released yet.
              </p>
            </section>
          </div>

          <section aria-labelledby="approvers-heading" className="mb-10">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Safety before money moves</p>
              <h2 id="approvers-heading" className="mt-1 font-display text-2xl font-semibold">Who can approve group withdrawals</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {approvals?.requiredApprovals ?? 2} of the named officers must approve before an eligible withdrawal can move forward.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {approvals?.approvers.map((approver) => (
                <div key={approver.role} className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-muted"><Users className="h-4 w-4" /></span>
                      <div>
                        <p className="font-semibold">{approver.role}</p>
                        <p className="text-xs text-muted-foreground">Withdrawal approver</p>
                      </div>
                    </div>
                    {approver.status === 'ready' ? <Check className="h-4 w-4 text-confirmed" /> : <Clock3 className="h-4 w-4 text-accent" />}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{approver.status === 'ready' ? 'Ready to review requests' : 'Invitation still pending'}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="requests-heading" className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Clear next steps</p>
                <h2 id="requests-heading" className="mt-1 font-display text-2xl font-semibold">Withdrawal status</h2>
              </div>
              <span className="text-sm text-muted-foreground">{approvals?.requests.length ?? 0} requests</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              {approvals?.requests.map((request) => (
                <article key={request.id} className="flex flex-col gap-4 border-b border-border/60 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{request.purpose}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{request.approvals} of {request.requiredApprovals} approvals recorded</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="font-display text-lg font-semibold">{formatKSh(request.amountKes)}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[request.status]}`}>{withdrawalStatusLabel(request)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <details className="rounded-xl border border-border/60 bg-muted/20 p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
              Account setup and troubleshooting
              <ChevronRight className="ml-auto h-4 w-4" />
            </summary>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p><span className="font-semibold text-foreground">Account rail:</span> {accountMeta.label}</p>
              <p><span className="font-semibold text-foreground">Community reference:</span> {community?.id ?? id}</p>
              <p className="sm:col-span-2">Technical account details are kept here for an administrator troubleshooting setup. Members do not need them to discuss, approve, or track a withdrawal.</p>
            </div>
          </details>
        </div>
      </section>
    </Layout>
  );
}
