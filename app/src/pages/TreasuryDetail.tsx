import { useParams } from "react-router-dom";
import { Download, ReceiptText, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { StatusScreen } from "@/components/StatusPage";
import PageLoader from "@/components/PageLoader";
import { useCommunity } from "@/hooks/useCommunities";
import { formatRailAmountFromKes } from "@/lib/utils";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";
import { useChain } from "@/hooks/useChain";

export default function TreasuryDetail() {
  const { id } = useParams<{ id: string }>();
  const { community, isLoading, error, reload } = useCommunity(id);
  const { chainMeta } = useChain();

  useSeo({
    title: community ? `${community.name} group funds` : "Group funds",
    description: "Group fund confirmations, payment records, and rule-governed releases.",
    path: id ? `/dashboard/${id}/treasury` : undefined,
    noIndex: true,
  });

  const gate = { title: 'Sign in to view group funds', description: 'Log in to see contributions, releases, and the shared record.' };

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
            <button
              type="button"
              disabled
              title="Not yet available"
              aria-disabled="true"
              className="btn-ghost gap-2 text-sm opacity-50 cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </header>
          </CommunityBanner>

          <div className="baraza-card mb-6 overflow-hidden p-5 md:p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Group funds</p>
                <p className="mt-2 font-display text-4xl font-bold text-primary tabular-nums">
                  {hasBalance ? formatRailAmountFromKes(community.fundBalance, chainMeta) : 'Not available yet'}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Available and reserved balances will appear when the group statement is connected.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:min-w-[22rem]">
                <div className="rounded-lg border border-border bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Release queue</p>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">Not available yet</p>
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
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-foreground">No pending releases</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Approved spending that still needs a payout will appear here.
                </p>
              </div>
            </div>
          </div>

          <div className="baraza-card p-5">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Completed fund releases</h2>
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm text-foreground">No completed releases</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Settled payouts will list proposal, amount, and a receipt reference.
              </p>
            </div>
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
