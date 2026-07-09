import { useParams } from "react-router-dom";
import { Download, ExternalLink, ReceiptText, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";
import { formatRailAmountFromKes } from "@/lib/utils";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";
import { useChain } from "@/hooks/useChain";
import {
  canExportTreasuryReceipt,
  createTreasuryReceiptExport,
  downloadTreasuryReceipt,
  type TreasuryPayoutRecord,
} from "@/lib/treasuryReceipts";

const attestations = [
  ["MPESA-XJ9L2B", "PaymentAttestation", 50000, "Confirmed"],
  ["MPESA-KL4M8P", "PaymentAttestation", 12500, "Confirmed"],
  ["ORD-8841B", "Mint job", "Membership credential", "Queued"],
];

const releases: TreasuryPayoutRecord[] = [
  {
    proposalId: "PROP-039",
    purpose: "Q4 welfare payout",
    amountKes: 150000,
    status: "approved",
    reviewer: "Amara N.",
    txReference: "4xkL...p9Qr",
    approvedAt: "2026-07-02T10:30:00.000Z",
  },
  {
    proposalId: "PROP-038",
    purpose: "Audit bounty",
    amountKes: 62500,
    status: "approved",
    reviewer: "Kofi M.",
    txReference: "8mPz...x2Vy",
    approvedAt: "2026-06-28T15:45:00.000Z",
  },
  {
    proposalId: "PROP-035",
    purpose: "Training workshop",
    amountKes: 30000,
    status: "pending",
    reviewer: "Nia O.",
    approvedAt: "2026-06-24T08:15:00.000Z",
  },
];

export default function TreasuryDetail() {
  const { id } = useParams<{ id: string }>();
  const { community } = useCommunity(id);
  const { chainMeta } = useChain();
  const completedReceiptCount = releases.filter((release) => canExportTreasuryReceipt(release)).length;
  const exportableSummary = {
    community: community?.name ?? "Community",
    generatedAt: new Date().toISOString(),
    receipts: releases
      .map((release) => createTreasuryReceiptExport(release, chainMeta))
      .filter((receipt): receipt is NonNullable<typeof receipt> => Boolean(receipt))
      .map((receipt) => JSON.parse(receipt.content)),
  };

  function handleExportAllReceipts() {
    const blob = new Blob([`${JSON.stringify(exportableSummary, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(community?.name ?? "community").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-payout-receipts.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useSeo({
    title: community ? `${community.name} treasury` : "Treasury",
    description: "Treasury attestations, payment confirmations, and rule-governed releases.",
    path: id ? `/dashboard/${id}/treasury` : undefined,
    noIndex: true,
  });

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <CommunityBanner type={community?.type} className="mb-8 p-5 md:p-6">
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Treasury</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{community?.name ?? "Community"} Treasury</h1>
              <p className="mt-2 text-sm text-muted-foreground">Inflows, releases, payment attestations, and public audit trail.</p>
            </div>
            <button
              type="button"
              onClick={handleExportAllReceipts}
              disabled={completedReceiptCount === 0}
              aria-disabled={completedReceiptCount === 0}
              className="btn-ghost gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export receipts
            </button>
          </header>
          </CommunityBanner>

          <div className="baraza-card mb-6 overflow-hidden p-5 md:p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Treasury balance</p>
                <p className="mt-2 font-display text-4xl font-bold text-primary">
                  {formatRailAmountFromKes(community?.fundBalance ?? 1248500, chainMeta)}
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
                      <p className="text-sm font-semibold text-foreground">
                        {typeof amount === 'number' ? `+ ${formatRailAmountFromKes(amount, chainMeta)}` : amount}
                      </p>
                      <p className={status === "Confirmed" ? "text-xs text-confirmed" : "text-xs text-primary"}>{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="baraza-card p-5">
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-primary">Treasury Release Queue</h2>
              <div className="space-y-3">
                {releases.filter((release) => release.status !== "approved").map((release) => (
                  <div key={release.proposalId} className="rounded-lg border border-primary/20 bg-primary/8 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{release.proposalId}: {release.purpose}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Ready after quorum and approval threshold.</p>
                      </div>
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        title="Receipt export becomes available after approval and transaction reference."
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold opacity-50"
                      >
                        <ReceiptText className="h-3.5 w-3.5" />
                        Receipt pending
                      </button>
                    </div>
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
                  <th className="pb-3 font-normal">Reviewer</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 text-right font-normal">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.proposalId} className="border-b border-border/70 last:border-b-0">
                    <td className="py-4 font-mono text-foreground">{release.proposalId}</td>
                    <td className="py-4 text-muted-foreground">{release.purpose}</td>
                    <td className="py-4 text-destructive">- {formatRailAmountFromKes(release.amountKes, chainMeta)}</td>
                    <td className="py-4 text-muted-foreground">{release.reviewer}</td>
                    <td className="py-4">
                      <span className={release.status === "approved" ? "text-confirmed" : "text-muted-foreground"}>
                        {release.status === "approved" ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {canExportTreasuryReceipt(release) ? (
                        <button
                          type="button"
                          onClick={() => downloadTreasuryReceipt(release, chainMeta)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {release.txReference}
                        </button>
                      ) : (
                        <span
                          aria-disabled="true"
                          title="Receipt export becomes available after approval and transaction reference."
                          className="inline-flex cursor-not-allowed items-center gap-1 font-mono text-network/60"
                        >
                          Missing receipt data
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Audit trail
            </h2>
            <p className="text-sm text-muted-foreground">Payment confirmations, proposal outcomes, and treasury releases are represented here as safe public summaries.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
