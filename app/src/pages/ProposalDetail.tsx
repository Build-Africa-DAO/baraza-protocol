import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CircleMinus, Languages, Loader2, MessageCircle, Reply, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import Layout from "@/components/Layout";
import { DEFAULT_GOVERNANCE } from "@/lib/constants";
import { useCastVote, useDecision, useVoteStatus } from "@/hooks/useBarazaData";
import { daysRemaining, formatRailAmountFromKes, formatRailDate } from "@/lib/utils";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { useCommunity } from "@/hooks/useCommunities";
import { useToast } from "@/hooks/use-toast";
import { STAGE_META, inferStage } from "@/lib/proposalStatus";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";
import { useChain } from "@/hooks/useChain";
import {
  addProposalAuditEntry,
  listProposalAuditTrail,
  voteOptionLabel,
} from "@/lib/governance";
import type { VoteOption } from "@/types";
import { useProposalThread } from "@/hooks/useProposalThread";
import { useAkiliChat } from "@/akili/useAkiliChat";

export default function ProposalDetail() {
  const { id, decisionId } = useParams<{ id: string; decisionId: string }>();
  const proposal = useDecision(decisionId ?? '');
  const { community } = useCommunity(proposal?.communityId);
  const { requireWallet, address } = useWalletGuard({ action: "vote on this proposal" });
  const { vote: submitVote, isLoading: isPending } = useCastVote();
  const existingVote = useVoteStatus(decisionId ?? '', address);
  const { toast } = useToast();
  const { chainMeta } = useChain();
  const { open: openAkili } = useAkiliChat();
  const [commentBody, setCommentBody] = useState("");
  const [commentVersion, setCommentVersion] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | undefined>();
  const { messages: comments, addMessage, facilitatorExcerpt } = useProposalThread(decisionId ?? '');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const auditTrail = useMemo(() => proposal ? listProposalAuditTrail(proposal.id) : [], [proposal?.id, commentVersion]);

  useSeo({
    title: proposal && community
      ? `${proposal.title} — ${community.name}`
      : proposal?.title ?? "Proposal",
    description: proposal?.description ?? "Review a community proposal, discuss it with members, and vote on Baraza.",
    path: id && decisionId ? `/dashboard/${id}/decisions/${decisionId}` : undefined,
    noIndex: true,
  });

  if (!proposal) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <h1 className="font-display text-2xl font-bold">Decision not found</h1>
            <p className="mt-3 text-sm">
              This decision doesn&apos;t exist or has been removed.
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

  const abstainVotes = proposal.votesAbstain ?? 0;
  const decidedVotes = proposal.votesFor + proposal.votesAgainst;
  // Abstaining counts toward quorum (participation) but not toward approval.
  const totalVotes = decidedVotes + abstainVotes;
  const support = decidedVotes > 0
    ? Math.round((proposal.votesFor / decidedVotes) * 100)
    : 0;
  // Unrounded: segment widths must sum to exactly 100.
  const forPct = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  const abstainPct = totalVotes > 0 ? 100 - forPct - againstPct : 0;
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

  const handleVote = (vote: VoteOption) => async () => {
    await requireWallet(async () => {
      // requireWallet only runs the callback when connected, so address is set.
      const voterKey = address;
      if (!voterKey) return;
      const voteType = vote === 'yes' ? 'for' : vote === 'no' ? 'against' : 'abstain';
      const success = await submitVote(proposal.id, voterKey, voteType);
      if (success) {
        toast({
          title: `${voteOptionLabel(vote)} vote recorded`,
          description: "Your vote has been counted in this group's tally.",
        });
      } else {
        toast({
          title: "Vote could not be cast",
          description: existingVote
            ? "You already voted on this proposal."
            : "This proposal is not open for voting.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddComment = () => {
    try {
      addMessage({
        authorId: address ?? "local-member",
        authorName: address ? `Member ${address.slice(0, 4)}` : "Local member",
        body: commentBody,
        parentId: replyingTo,
      });
      addProposalAuditEntry({ proposalId: proposal.id, actor: address ?? 'local-member', action: 'discussion.message-added' });
      setCommentBody("");
      setReplyingTo(undefined);
      setCommentVersion((value) => value + 1);
    } catch (err) {
      toast({
        title: "Message not posted",
        description: err instanceof Error ? err.message : "Could not add your message.",
        variant: "destructive",
      });
    }
  };

  const askFacilitator = (translation = false) => {
    const task = translation
      ? 'Translate the discussion between English and Kiswahili. Preserve each speaker, question, and source message ID.'
      : 'Summarise the opinions in this discussion. Link every point to its source message ID, list unanswered questions, and preserve minority views. Do not recommend or cast a vote.';
    openAkili(`${task}\n\nProposal: ${proposal.title}\n\nSource messages:\n${facilitatorExcerpt}`, 'facilitator');
  };

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <Link to={`/dashboard/${id ?? proposal.communityId}`} className="mb-6 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to decisions
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
                  ["Amount requested", formatRailAmountFromKes(proposal.fundingAmount, 'mpesa')],
                  ["Share of group funds", treasuryImpactPct !== null ? `${treasuryImpactPct}%` : "—"],
                  ["Members needed to take part", `${quorumRequiredPct}%`],
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
                  <div className="flex flex-wrap justify-between gap-x-3 text-sm">
                    <span>Support ({proposal.votesFor})</span>
                    <span>Object ({proposal.votesAgainst})</span>
                    <span className="text-muted-foreground">Abstain ({abstainVotes})</span>
                  </div>
                  <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                    <div className="bg-primary transition-all" style={{ width: `${forPct}%` }} />
                    <div className="bg-destructive/70 transition-all" style={{ width: `${againstPct}%` }} />
                    <div className="bg-muted-foreground/35 transition-all" style={{ width: `${abstainPct}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span>{support}% approval of decided votes</span>
                    <span>{quorum}% member participation</span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleVote("yes")}
                    disabled={isPending || !isVotable || !!existingVote}
                    className="btn-warm justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    Vote yes
                  </button>
                  <button
                    type="button"
                    onClick={handleVote("no")}
                    disabled={isPending || !isVotable || !!existingVote}
                    className="btn-ghost justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                    Vote no
                  </button>
                  <button
                    type="button"
                    onClick={handleVote("abstain")}
                    disabled={isPending || !isVotable || !!existingVote}
                    className="btn-ghost justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleMinus className="h-4 w-4" />}
                    Abstain
                  </button>
                </div>
                <p className="mt-3 text-xs">
                  {existingVote
                    ? `You voted ${existingVote === 'for' ? 'yes' : existingVote === 'against' ? 'no' : 'abstain'} on this proposal.`
                    : "One vote per member. Your choice is recorded with the group tally."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-5 md:p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <h2 className="font-display text-xl font-semibold">Community discussion</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Ask a question, reply to a member, or mention someone with @name.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => askFacilitator(false)} className="btn-ghost gap-2 text-xs">
                      <Sparkles className="h-3.5 w-3.5" /> Summarise discussion
                    </button>
                    <button type="button" onClick={() => askFacilitator(true)} className="btn-ghost gap-2 text-xs">
                      <Languages className="h-3.5 w-3.5" /> English / Kiswahili
                    </button>
                  </div>
                </div>
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
                    <span>Replying to message #{replyingTo.slice(-6)}</span>
                    <button type="button" onClick={() => setReplyingTo(undefined)} className="font-semibold text-primary">Cancel</button>
                  </div>
                )}
                <textarea
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Share your view or type @name to invite a member..."
                  className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button type="button" onClick={handleAddComment} className="btn-warm mt-3 text-sm">
                  Post message
                </button>
                <div className="mt-5 space-y-3">
                  {comments.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No messages yet. Start with a question other members can answer before voting.
                    </p>
                  ) : comments.map((comment) => {
                    const parent = comment.parentId ? comments.find((message) => message.id === comment.parentId) : undefined;
                    return (
                    <article id={comment.id} key={comment.id} className={comment.parentId ? "ml-6 rounded-lg border-l-2 border-primary/30 bg-muted/25 p-4" : "rounded-lg border p-4"}>
                      {parent && <p className="mb-2 text-xs text-muted-foreground">Reply to {parent.authorName}: “{parent.body.slice(0, 80)}{parent.body.length > 80 ? '…' : ''}”</p>}
                      <p className="text-sm leading-6">{comment.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{comment.authorName} · {formatRailDate(comment.createdAt, chainMeta, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <a href={`#${comment.id}`} className="font-mono text-[10px]">#{comment.id.slice(-6)}</a>
                        <button type="button" onClick={() => setReplyingTo(comment.id)} className="inline-flex items-center gap-1 font-semibold text-primary">
                          <Reply className="h-3 w-3" /> Reply
                        </button>
                      </div>
                    </article>
                  )})}
                </div>
              </div>
            </main>

            <aside className="space-y-6">
              <div className="baraza-card p-5">
                <h3 className="font-display text-base font-semibold">Decision timeline</h3>
                <div className="mt-5 space-y-4 border-l pl-5">
                  <div className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm">Opened for member review</p>
                    <p className="text-xs">
                      {formatRailDate(proposal.createdAt, chainMeta, { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm">
                      {isVotable ? "Voting closes" : "Voting closed"}
                    </p>
                    <p className="text-xs">
                      {formatRailDate(proposal.endsAt, chainMeta, { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="relative">
                      <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-accent" />
                      <p className="text-sm">{entry.action === 'discussion.message-added' ? 'Member added to the discussion' : entry.action.replace(/\./g, ' ')}</p>
                      <p className="text-xs">
                        {formatRailDate(entry.createdAt, chainMeta, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
