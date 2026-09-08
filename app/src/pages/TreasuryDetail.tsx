import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Loader2, ReceiptText, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { StatusScreen } from "@/components/StatusPage";
import PageLoader from "@/components/PageLoader";
import CommunityBanner from "@/components/CommunityBanner";
import { EXECUTE_LOCKED_COPY, TreasuryCircuitBreakerBanner } from "@/components/TreasuryCircuitBreakerBanner";
import { useAccount } from "@/contexts/AccountContext";
import { useToast } from "@/hooks/use-toast";
import { useDecisions } from "@/hooks/useBarazaData";
import { useCommunity } from "@/hooks/useCommunities";
import { useChain } from "@/hooks/useChain";
import { proposalBucket } from "@/lib/proposalStatus";
import { useSeo } from "@/lib/seo";
import { sessionHeaders } from "@/lib/sessionHeaders";
import { formatRailAmountFromKes } from "@/lib/utils";

export default function TreasuryDetail() {
  const { id } = useParams<{ id: string }>();
  const { community, isLoading, error, reload } = useCommunity(id);
  const { chainMeta } = useChain();
  const { all } = useDecisions(id ?? '');
  const account = useAccount();
  const { toast } = useToast();
  const [executingId, setExecutingId] = useState<string | null>(null);

  useSeo({
    title: community ? `${community.name} group funds` : "Group funds",
    description: "Group fund confirmations, payment records, and rule-governed releases.",
    path: id ? `/dashboard/${id}/treasury` : undefined,
    noIndex: true,
  });

  const gate = { title: 'Sign in to view group funds', description: 'Log in to see contributions, releases, and the shared record.' };
  const frozen = Boolean(community?.isPayoutFrozen || community?.communityStatus === 'paused');
  const pending = all.filter((decision) => proposalBucket(decision) === 'passed');
  const executed = all.filter((decision) => proposalBucket(decision) === 'executed');

  async function approvePayout(proposalId: string) {
    if (frozen) return;
    setExecutingId(proposalId);
    try {
      const headers = await sessionHeaders(account.getAccessToken);
      const res = await fetch('/api/governance/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposalId, executorWallet: account.accountId }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; circuitBreaker?: boolean };
      if (!res.ok) {
        toast({
          title: 'Could not approve payout',
          description: data.circuitBreaker ? EXECUTE_LOCKED_COPY : (data.message ?? 'Try again after signing in as an officer.'),
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Payout approved', description: 'The release is recorded for this group.' });
    } finally {
      setExecutingId(null);
    }
  }

  async function exportStatement() {
    if (!id) return;
    const headers = await sessionHeaders(account.getAccessToken);
    const res = await fetch(`/api/communities/statement?communityId=${encodeURIComponent(id)}&format=csv`, { headers });
    if (!res.ok) {
      toast({ title: 'Export not available', description: 'Sign in as an officer to download the ledger.', variant: 'destructive' });
      return;
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `baraza-statement-${id}.csv`;
    a.click();
    URL.revokeObjectURL(href);
  }

  if (isLoading) {
    return (
      <Layout gate={gate}>
        <PageLoader label="Loading group funds" />
      </Layout>
    );
  }

  if (!community) {
    if (error) {
      return <StatusScreen kind="server" gate={gate} onRetry={() => void reload()} />;
    }
    return <StatusScreen kind="community" gate={gate} />;
  }

  const hasBalance = typeof community.fundBalance === 'number';
  const officerCount = 3;
  const approvedCount = pending.length > 0 ? 1 : 0;

  return (
    <Layout gate={gate}>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <CommunityBanner type={community.type} className="mb-8 p-5 md:p-6">
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Group account</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{community.name} group funds</h1>
              <p className="mt-2 text-sm text-muted-foreground">Contributions, approved releases, payment confirmations, and the public record.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/dashboard/${community.id}/disbursements`} className="btn-wipe-outline text-sm">Send payout</Link>
              <button
                type="button"
                onClick={() => void exportStatement()}
                className="btn-ghost gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </header>
          </CommunityBanner>

          <TreasuryCircuitBreakerBanner frozen={frozen} />
          {frozen && (
            <div className="mb-6 rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
              <p className="font-semibold">Officer reconciliation</p>
              <p className="mt-1 text-muted-foreground">
                Variance was detected. Member dues stay safe. Unfreeze is a compliance-desk action, not a member control.
              </p>
              <Link to={`/dashboard/${community.id}/compliance`} className="mt-3 inline-flex text-xs font-semibold text-primary">
                Open compliance review
              </Link>
            </div>
          )}

          <div className="baraza-card mb-6 overflow-hidden p-5 md:p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Group funds (KES)</p>
                <p className="mt-2 font-display text-4xl font-bold text-primary tabular-nums">
                  {hasBalance ? formatRailAmountFromKes(community.fundBalance, chainMeta) : 'Not available yet'}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recorded pool. On-chain Stellar vault conversion appears here when the statement is connected.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:min-w-[22rem]">
                <div className="rounded-lg border border-border bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Multisig threshold</p>
                  <p className="mt-1 font-mono text-sm">{approvedCount} of {officerCount} officers approved</p>
                </div>
                <div className="rounded-lg border border-border bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="mt-1 font-mono text-sm text-foreground tabular-nums">
                    {community.memberCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
            <div className="baraza-card p-5">
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Contributions and payment confirmations</h2>
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <ReceiptText className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-3 text-sm text-foreground">No contribution records yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confirmed payments will show a reference, amount, currency, and status here.
                </p>
              </div>
            </div>

            <div className="baraza-card p-5">
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Pending fund releases</h2>
              {pending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm text-foreground">No pending releases</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Approved spending that still needs a payout will appear here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {pending.map((decision) => (
                    <li key={decision.id} className="rounded-lg border p-3">
                      <p className="text-sm font-semibold">{decision.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRailAmountFromKes(decision.fundingAmount, chainMeta)} · {approvedCount} of {officerCount} officers approved
                      </p>
                      <button
                        type="button"
                        disabled={frozen || executingId === decision.id}
                        title={frozen ? EXECUTE_LOCKED_COPY : undefined}
                        onClick={() => void approvePayout(decision.id)}
                        className="btn-wipe mt-3 w-full justify-center gap-2 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {executingId === decision.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Approve payout
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="baraza-card p-5">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Completed fund releases</h2>
            {executed.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-foreground">No completed releases</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Settled payouts will list proposal, amount, and a receipt reference.
                </p>
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {executed.map((decision) => (
                  <li key={decision.id} className="flex justify-between gap-3 rounded-lg border px-3 py-2">
                    <span>{decision.title}</span>
                    <span className="tabular-nums">{formatRailAmountFromKes(decision.fundingAmount, chainMeta)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Audit trail
            </h2>
            <p className="text-sm text-muted-foreground">
              Payment confirmations, decision outcomes, and fund releases appear here only after they are recorded for this group.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
