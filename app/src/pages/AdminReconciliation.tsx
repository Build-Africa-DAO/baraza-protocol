import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileWarning,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Network,
  Users,
  Vote,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { cn, formatRailAmountFromKes, truncateAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/lib/seo";
import { getAdminWallets, isAdminWallet } from "@/lib/access";
import { useChain } from "@/hooks/useChain";
import { useCommunities } from "@/hooks/useCommunities";
import { listBounties, type BountyStatus } from "@/lib/bounties";
import { reviewCommunity, type SecurityReviewLevel } from "@/lib/securityReview";
import {
  buildKnowledgeGraph,
  buildLiveKnowledgeGraph,
  summarizeKnowledgeGraph,
  type KnowledgeGraph,
} from "@/lib/knowledgeGraph";

const ADMIN_WALLETS = getAdminWallets();
const ADMIN_NFT_THRESHOLD = Number(import.meta.env.VITE_ADMIN_NFT_THRESHOLD ?? 0);
const ADMIN_NFT_COUNT = Number(import.meta.env.VITE_ADMIN_NFT_COUNT ?? 0);

const paymentOrders = [
  ["ORD-8942A", "Kibera Youth Collective", "KES 15,000", "PAYMENT_PENDING", "2026-05-13 08:02 UTC", "Reconcile proof"],
  ["ORD-8941B", "Mama Mboga Association", "KES 5,000", "PAYMENT_CONFIRMED", "2026-05-13 07:45 UTC", "-"],
  ["ORD-8939X", "Mwanzo Housing Sacco", "KES 100,000", "MANUAL_REVIEW", "2026-05-13 06:20 UTC", "Approve refund"],
];

const mintJobs = [
  ["MNT-1029", "Membership credential", "MINT_QUEUED", "-"],
  ["MNT-1028", "Bounty approval record", "MINT_FAILED_RETRYABLE", "Retry mint"],
  ["MNT-1027", "Vote receipt", "MINT_CONFIRMED", "-"],
];

const riskClass: Record<SecurityReviewLevel, string> = {
  pass: "border-confirmed/40 bg-confirmed/10 text-confirmed",
  watch: "border-accent/40 bg-accent/10 text-accent",
  risk: "border-destructive/40 bg-destructive/10 text-destructive",
};

const statusClass: Record<BountyStatus, string> = {
  open: "border-confirmed/40 bg-confirmed/10 text-confirmed",
  in_progress: "border-primary/40 bg-primary/10 text-primary",
  in_review: "border-accent/40 bg-accent/10 text-accent",
  awarded: "border-confirmed/50 bg-confirmed/15 text-confirmed",
  paid: "border-confirmed/50 bg-confirmed/15 text-confirmed",
};

function StatusChip({ value }: { value: string }) {
  return (
    <span className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide">
      {value}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="baraza-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

export default function AdminReconciliation() {
  useSeo({
    title: "Admin dashboard",
    description: "Operator console for community review, bounty moderation, payment reconciliation, and security checks.",
    path: "/admin",
    noIndex: true,
  });

  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const { chainMeta } = useChain();
  const { communities, isLoading } = useCommunities();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BountyStatus>("all");
  const [liveGraph, setLiveGraph] = useState<KnowledgeGraph | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  const allowlistConfigured = ADMIN_WALLETS.length > 0;
  const nftGateConfigured = ADMIN_NFT_THRESHOLD > 0;
  const nftGatePassed = !nftGateConfigured || ADMIN_NFT_COUNT >= ADMIN_NFT_THRESHOLD;
  const isAdmin = connected && isAdminWallet(publicKey?.toBase58(), ADMIN_WALLETS) && nftGatePassed;

  const bounties = useMemo(() => listBounties(), []);
  const reviews = useMemo(
    () => communities.map((community) => ({ community, review: reviewCommunity(community) })),
    [communities],
  );
  const flaggedReviews = reviews.filter((item) => item.review.level !== "pass");
  const openBounties = bounties.filter((bounty) => bounty.status === "open");
  const reviewBounties = bounties.filter((bounty) => bounty.status === "in_review");
  const rewardPool = openBounties.reduce((sum, bounty) => sum + bounty.rewardKes, 0);
  const fallbackGraph = useMemo(
    () => buildKnowledgeGraph({ communities, bounties, source: "local" }),
    [bounties, communities],
  );
  const knowledgeGraph = liveGraph ?? fallbackGraph;
  const graphSummary = useMemo(() => summarizeKnowledgeGraph(knowledgeGraph), [knowledgeGraph]);

  useEffect(() => {
    let cancelled = false;
    buildLiveKnowledgeGraph()
      .then((graph) => {
        if (cancelled) return;
        setLiveGraph(graph);
        setGraphError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLiveGraph(null);
        setGraphError(error instanceof Error ? error.message : "Knowledge graph sync failed.");
      });
    return () => { cancelled = true; };
  }, []);

  const filteredOrders = paymentOrders.filter(([id, group, amount, status]) =>
    `${id} ${group} ${amount} ${status}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredBounties = bounties
    .filter((bounty) => statusFilter === "all" || bounty.status === statusFilter)
    .slice(0, 8);

  const notifyNotWired = (action: string) =>
    toast({
      title: `${action} is in preview mode`,
      description: "The operator UI is ready. This action will connect when admin endpoints ship.",
    });

  if (!isAdmin) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border">
              <ShieldOff className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin access restricted</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Connect with an authorised Baraza operator account to review communities, payments, bounties, and security flags.
            </p>
            {connected && publicKey ? (
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                Signed in as {truncateAddress(publicKey.toBase58())}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="btn-warm mt-6 inline-flex items-center gap-2 text-sm"
              >
                Connect {chainMeta.label}
              </button>
            )}
            {!allowlistConfigured && (
              <p className="mt-4 text-[11px] text-muted-foreground">
                Operators: set <code className="font-mono">VITE_ADMIN_WALLETS</code> to enable this dashboard.
              </p>
            )}
            {allowlistConfigured && nftGateConfigured && !nftGatePassed && (
              <p className="mt-4 text-[11px] text-muted-foreground">
                Admin NFT gate requires {ADMIN_NFT_THRESHOLD} credential{ADMIN_NFT_THRESHOLD === 1 ? "" : "s"}.
                Current configured count: {ADMIN_NFT_COUNT}.
              </p>
            )}
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <header className="mb-8 flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Admin dashboard</p>
              <h1 className="mt-2 font-display text-3xl font-bold">Baraza operator console</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Review group health, bounty workflow, payment reconciliation, mint jobs, and Asha security flags from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => notifyNotWired("Export CSV")} className="btn-ghost gap-2 text-sm">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button type="button" onClick={() => notifyNotWired("Sync state")} className="btn-ghost gap-2 text-sm">
                <RefreshCw className="h-4 w-4" /> Sync state
              </button>
            </div>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} label="Communities" value={isLoading ? "..." : communities.length.toString()} note="Groups visible to the registry" />
            <MetricCard icon={BriefcaseBusiness} label="Open bounty pool" value={formatRailAmountFromKes(rewardPool, chainMeta)} note={`${openBounties.length} open tasks`} />
            <MetricCard icon={FileWarning} label="Needs review" value={(flaggedReviews.length + reviewBounties.length).toString()} note="Security flags and submitted bounty work" />
            <MetricCard icon={ShieldCheck} label="Admin rail" value={chainMeta.label} note="Selected account and review rail" />
            <MetricCard
              icon={Network}
              label="Knowledge graph"
              value={`${graphSummary.nodeCount}/${graphSummary.edgeCount}`}
              note={`${graphSummary.source === "supabase" ? "Live Supabase" : "Local"} nodes and relationships`}
            />
            {nftGateConfigured && (
              <MetricCard icon={ShieldCheck} label="NFT admin gate" value={`${ADMIN_NFT_COUNT}/${ADMIN_NFT_THRESHOLD}`} note="Credential threshold for operator access" />
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
            <section className="baraza-card p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Community review queue</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Asha security checks for treasury, dues, quorum, and governance rules.</p>
                </div>
                <Link to="/communities" className="btn-ghost inline-flex items-center gap-2 text-sm">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {reviews.slice(0, 6).map(({ community, review }) => (
                  <article key={community.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link to={`/dashboard/${community.id}`} className="font-display text-sm font-bold hover:text-primary">
                          {community.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {community.memberCount} members · {formatRailAmountFromKes(community.fundBalance, chainMeta)} treasury · {community.type}
                        </p>
                      </div>
                      <span className={cn("w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", riskClass[review.level])}>
                        {review.score} · {review.level === "pass" ? "cleared" : review.level === "watch" ? "review" : "risk"}
                      </span>
                    </div>
                    {review.level !== "pass" && (
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">{review.nextSteps[0]}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="baraza-card p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">Security flags</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Items Asha recommends reviewing before members act.</p>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              {flaggedReviews.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-confirmed" />
                  <p className="font-display text-sm font-semibold">No community security flags</p>
                  <p className="mt-1 text-xs text-muted-foreground">Asha has cleared the current community rules.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flaggedReviews.slice(0, 4).map(({ community, review }) => (
                    <div key={community.id} className="rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <div>
                          <p className="font-display text-sm font-bold">{community.name}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{review.nextSteps[0]}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.48fr_0.52fr]">
            <section className="baraza-card overflow-hidden p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Bounty moderation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Open work, review states, and owner-approved tasks.</p>
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                  className="rounded-lg border bg-card px-3 py-2 text-sm outline-none"
                  aria-label="Filter bounties by status"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="in_review">Under review</option>
                  <option value="paid">Approved</option>
                </select>
              </div>
              <div className="space-y-3">
                {filteredBounties.map((bounty) => (
                  <article key={bounty.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link to={`/bounties/${bounty.id}`} className="font-display text-sm font-bold hover:text-primary">
                          {bounty.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{bounty.postedBy} · {formatRailAmountFromKes(bounty.rewardKes, chainMeta)}</p>
                      </div>
                      <span className={cn("w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", statusClass[bounty.status])}>
                        {bounty.status === "paid" || bounty.status === "awarded" ? "Approved" : bounty.status.replace("_", " ")}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="baraza-card overflow-x-auto p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="font-display text-xl font-semibold">Payment reconciliation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Orders needing proof checks, refunds, and membership activation follow-up.</p>
                </div>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="rounded-lg border bg-card px-3 py-2 text-sm outline-none"
                  placeholder="Search order, group, status"
                />
              </div>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-normal">Order</th>
                    <th className="pb-3 font-normal">Group</th>
                    <th className="pb-3 font-normal">Amount</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(([id, group, amount, status, _time, action]) => (
                    <tr key={id} className="border-b last:border-b-0">
                      <td className="py-4 font-mono">{id}</td>
                      <td className="py-4">{group}</td>
                      <td className="py-4">{amount}</td>
                      <td className="py-4"><StatusChip value={status} /></td>
                      <td className="py-4 text-right">
                        {action === "-" ? (
                          <span className="text-muted-foreground">Cleared</span>
                        ) : (
                          <button type="button" onClick={() => notifyNotWired(action)} className="font-semibold text-primary hover:underline">
                            {action}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section className="baraza-card mt-6 overflow-x-auto p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">Mint and record jobs</h2>
                <p className="mt-1 text-sm text-muted-foreground">Membership credentials, vote receipts, bounty approvals, and treasury records.</p>
              </div>
              <Vote className="h-5 w-5 text-primary" />
            </div>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">Job</th>
                  <th className="pb-3 font-normal">Record</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {mintJobs.map(([id, record, status, action]) => (
                  <tr key={id} className="border-b last:border-b-0">
                    <td className="py-4 font-mono">{id}</td>
                    <td className="py-4">{record}</td>
                    <td className="py-4"><StatusChip value={status} /></td>
                    <td className="py-4 text-right">
                      {action === "-" ? (
                        <span className="text-muted-foreground">No action</span>
                      ) : (
                        <button type="button" onClick={() => notifyNotWired(action)} className="font-semibold text-primary hover:underline">
                          {action}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="baraza-card mt-6 p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  <Network className="h-3.5 w-3.5 text-primary" />
                  Knowledge graph
                </div>
                <h2 className="font-display text-xl font-semibold">Shared source of truth</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Communities, proposals, bounties, chain rails, Asha checks, and readiness tasks are linked so admins can see what still blocks testnet.
                </p>
                {graphError && (
                  <p className="mt-2 text-xs text-accent">
                    Live graph sync failed. Showing local graph: {graphError}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="rounded-lg border p-3">
                  <p className="font-display text-xl font-bold">{graphSummary.riskCount}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risks</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-display text-xl font-bold">{graphSummary.watchCount}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Watch</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data source</p>
                <p className="mt-2 text-sm font-semibold capitalize">{graphSummary.source}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Members tracked</p>
                <p className="mt-2 text-sm font-semibold">{graphSummary.membershipCount}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment orders</p>
                <p className="mt-2 text-sm font-semibold">{graphSummary.paymentOrderCount}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Testnet ready</p>
                <p className="mt-2 text-sm font-semibold">
                  {graphSummary.testnetReadyChains.length ? graphSummary.testnetReadyChains.join(", ") : "No rails marked ready"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coming soon</p>
                <p className="mt-2 text-sm font-semibold">
                  {graphSummary.comingSoonChains.length ? graphSummary.comingSoonChains.join(", ") : "No coming-soon rails"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next task</p>
                <p className="mt-2 text-sm font-semibold">{graphSummary.topTasks[0]?.label ?? "No readiness task"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {graphSummary.topTasks.slice(0, 4).map((task) => (
                <article key={task.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold">{task.label}</p>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{task.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
}
