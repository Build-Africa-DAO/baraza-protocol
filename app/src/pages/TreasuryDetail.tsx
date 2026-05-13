import { useParams } from "react-router-dom";
import { Download, ExternalLink, ReceiptText, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";
import { formatKSh } from "@/lib/utils";
import CommunityBanner from "@/components/CommunityBanner";

const attestations = [
  ["MPESA-XJ9L2B", "PaymentAttestation", "+ KSh 50,000", "Confirmed"],
  ["MPESA-KL4M8P", "PaymentAttestation", "+ KSh 12,500", "Confirmed"],
  ["ORD-8841B", "Mint job", "Membership credential", "Queued"],
];

const releases = [
  ["PROP-039", "Q4 welfare payout", "- KSh 150,000", "4xkL...p9Qr"],
  ["PROP-038", "Audit bounty", "- KSh 62,500", "8mPz...x2Vy"],
  ["PROP-035", "Training workshop", "- KSh 30,000", "2jRt...k8Mw"],
];

export default function TreasuryDetail() {
  const { id } = useParams<{ id: string }>();
  const { community } = useCommunity(id);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <CommunityBanner type={community?.type} className="mb-8 p-5 md:p-6">
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">DAO Treasury</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{community?.name ?? "Community"} Treasury</h1>
              <p className="mt-2 text-sm text-muted-foreground">Inflows, releases, payment attestations, and on-chain audit trail.</p>
            </div>
            <button
              type="button"
              disabled
              title="Coming soon"
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
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Treasury balance</p>
                <p className="mt-2 font-display text-4xl font-bold text-primary">
                  {formatKSh(community?.fundBalance ?? 1248500)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:min-w-[22rem]">
                <div className="rounded-lg border border-border bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Release queue</p>
                  <p className="mt-1 font-mono text-sm text-primary">3 pending</p>
                </div>
                <div className="rounded-lg border border-border bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {community?.memberCount ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
            <div className="baraza-card p-5">
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Inflows and Payment Attestations</h2>
              <div className="space-y-3">
                {attestations.map(([ref, type, amount, status]) => (
                  <div key={ref} className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-background/45 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <ReceiptText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-mono text-sm text-foreground">{ref}</p>
                        <p className="text-xs text-muted-foreground">{type}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-foreground">{amount}</p>
                      <p className={status === "Confirmed" ? "text-xs text-confirmed" : "text-xs text-primary"}>{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="baraza-card p-5">
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-primary">Treasury Release Queue</h2>
              <div className="space-y-3">
                {["PROP-042: Q4 Welfare Payout", "PROP-044: Contract Audit", "PROP-045: Member Emergency"].map((item) => (
                  <div key={item} className="rounded-lg border border-primary/20 bg-primary/8 p-4">
                    <p className="text-sm font-medium text-foreground">{item}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Ready after quorum and approval threshold.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="baraza-card overflow-x-auto p-5">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Executed Treasury Releases</h2>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">Proposal</th>
                  <th className="pb-3 font-normal">Purpose</th>
                  <th className="pb-3 font-normal">Amount</th>
                  <th className="pb-3 text-right font-normal">Tx Signature</th>
                </tr>
              </thead>
              <tbody>
                {releases.map(([ref, purpose, amount, tx]) => (
                  <tr key={ref} className="border-b border-border/70 last:border-b-0">
                    <td className="py-4 font-mono text-foreground">{ref}</td>
                    <td className="py-4 text-muted-foreground">{purpose}</td>
                    <td className="py-4 text-destructive">{amount}</td>
                    <td className="py-4 text-right">
                      <span
                        aria-disabled="true"
                        title="Explorer link available once on-chain"
                        className="inline-flex cursor-not-allowed items-center gap-1 font-mono text-network/60"
                      >
                        {tx}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              DAO Audit Trail
            </h2>
            <p className="text-sm text-muted-foreground">Payment confirmations, proposal outcomes, and treasury releases are represented here as safe public summaries.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
