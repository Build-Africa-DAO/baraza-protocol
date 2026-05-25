import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import Layout from "@/components/Layout";
import { DEFAULT_GOVERNANCE } from "@/lib/constants";
import { useDecision } from "@/hooks/useBarazaData";
import { daysRemaining, formatKSh } from "@/lib/utils";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { useBarazaContract } from "@/hooks/useBarazaContract";
import { useCommunity } from "@/hooks/useCommunities";
import { useToast } from "@/hooks/use-toast";
import { STAGE_META, inferStage } from "@/lib/proposalStatus";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";

export default function ProposalDetail() {
  const { id, decisionId } = useParams<{ id: string; decisionId: string }>();
  const proposal = useDecision(decisionId ?? '');
  const { community } = useCommunity(proposal?.communityId);
  const { requireWallet } = useWalletGuard({ action: "vote on this proposal" });
  const { castVote, isPending } = useBarazaContract();
  const { toast } = useToast();

  useSeo({
    title: proposal && community
      ? `${proposal.title} — ${community.name}`
      : proposal?.title ?? "Proposal",
    description: proposal?.description ?? "View proposal details, vote, and track quorum on Baraza.",
    path: id && decisionId ? `/dashboard/${id}/decisions/${decisionId}` : undefined,
    noIndex: true,
  });

  if (!proposal) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <h1 className="font-display text-2xl font-bold">Proposal not found</h1>
            <p className="mt-3 text-sm">
              This governance proposal doesn&apos;t exist or has been removed.
            </p>
            <Link to={id ? `/dashboard/${id}` : "/communities"} className="btn-warm mt-6 inline-flex items-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const support = totalVotes > 0
    ? Math.round((proposal.votesFor / totalVotes) * 100)
    : 0;
  const object = totalVotes > 0 ? 100 - support : 0;
  const quorum = proposal.totalMembers > 0
    ? Math.round((totalVotes / proposal.totalMembers) * 100)
    : 0;
  const days = daysRemaining(proposal.endsAt);
  const stage = inferStage(proposal.status);
  const stageMeta = STAGE_META[stage];
  const StageIcon = stageMeta.icon;
  const isVotable = stageMeta.votable;
  const endsLabel = !isVotable
    ? "Voting closed"
    : days === 0
      ? "Closes today"
      : `Ends in ${days} day${days === 1 ? "" : "s"}`;
  const treasuryImpactPct = community?.fundBalance
    ? Math.round((proposal.fundingAmount / community.fundBalance) * 1000) / 10
    : null;
  const quorumRequiredPct = community?.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct;

  const handleVote = (vote: boolean) => async () => {
    await requireWallet(async () => {
      const success = await castVote(proposal.id, proposal.communityId, vote);
      if (success) {
        toast({
          title: vote ? "Support recorded" : "Objection recorded",
          description: "Your signed vote is queued for the next governance tally.",
        });
      } else {
        toast({
          title: "Vote could not be cast",
          description: "Voting is in preview mode until the governance program is deployed.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <Link to={`/dashboard/${id ?? proposal.communityId}`} className="mb-6 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to proposals
          </Link>

          <div className="grid gap-6 xl:grid-cols-[0.68fr_0.32fr]">
            <main className="space-y-6">
              <CommunityBanner className="p-5 md:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${stageMeta.className}`}
                    aria-label={`Stage: ${stageMeta.label}`}
                  >
                    <StageIcon className="h-3 w-3" />
                    {stageMeta.label}
                  </span>
                  <span className="text-xs">#{proposal.id.padStart(3, "0")}</span>
                </div>
                <h1 className="font-display text-3xl font-bold">{proposal.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6">{proposal.description}</p>
              </CommunityBanner>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["Requested funding", formatKSh(proposal.fundingAmount)],
                  ["Treasury impact", treasuryImpactPct !== null ? `-${treasuryImpactPct}%` : "—"],
                  ["Quorum required", `${quorumRequiredPct}%`],
                  ["Current approval", totalVotes > 0 ? `${support}%` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="baraza-card p-4">
                    <p className="font-mono text-xs uppercase tracking-widest">{label}</p>
                    <p className="mt-2 font-display text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="baraza-card p-5 md:p-6">
                <div className="mb-5 flex items-center justify-between gap-4 border-b pb-4">
                  <h2 className="font-display text-xl font-semibold">Member voting</h2>
                  <span className="text-sm">{endsLabel}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Support ({proposal.votesFor})</span>
                    <span>Object ({proposal.votesAgainst})</span>
                  </div>
                  <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                    <div className="bg-primary transition-all" style={{ width: `${support}%` }} />
                    <div className="bg-destructive/70 transition-all" style={{ width: `${object}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span>{support}% support</span>
                    <span>{quorum}% quorum progress</span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleVote(true)}
                    disabled={isPending || !isVotable}
                    className="btn-warm justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    Cast support vote
                  </button>
                  <button
                    type="button"
                    onClick={handleVote(false)}
                    disabled={isPending || !isVotable}
                    className="btn-ghost justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                    Cast objection vote
                  </button>
                </div>
                <p className="mt-3 text-xs">
                  Your vote is recorded after account approval.
                </p>
              </div>
            </main>

            <aside className="space-y-6">
              <div className="baraza-card p-5">
                <h3 className="font-mono text-xs uppercase tracking-widest">Proposal activity</h3>
                <div className="mt-5 space-y-4 border-l pl-5">
                  <div className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm">Proposal opened for voting</p>
                    <p className="text-xs">
                      {new Date(proposal.createdAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm">
                      {isVotable ? "Voting closes" : "Voting closed"}
                    </p>
                    <p className="text-xs">
                      {new Date(proposal.endsAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
