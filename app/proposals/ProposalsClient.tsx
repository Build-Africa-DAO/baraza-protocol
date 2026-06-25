"use client";

import { useState } from "react";
import Link from "next/link";
import ProposalCard, { type ProposalVM } from "./ProposalCard";
import { PROPOSALS } from "@/app/lib/mock/proposals";
import { CURRENT_USER_ID, getMember } from "@/app/lib/mock/members";
import { getCommunity } from "@/app/lib/mock/communities";
import type { Choice, Proposal } from "@/app/lib/mock/types";

const CHOICE_LABEL: Record<Choice, string> = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
};

function buildVM(p: Proposal, index: number): ProposalVM {
  const tally: Record<Choice, number> = { for: 0, against: 0, abstain: 0 };
  for (const v of p.votes) tally[v.choice] += 1;
  const total = p.votes.length;

  const mine = p.votes.find((v) => v.voterId === CURRENT_USER_ID) ?? null;
  const isOpen = p.status === "open";
  const statusLabel =
    p.status === "open"
      ? "Open"
      : p.status.charAt(0).toUpperCase() + p.status.slice(1);

  const author = getMember(p.authorId);
  const community = getCommunity(p.communityId);

  const comments = p.votes
    .filter((v) => v.comment && v.comment.trim())
    .map((v) => {
      const m = getMember(v.voterId);
      return {
        voter: m.name,
        initials: m.initials,
        color: m.color,
        choice: v.choice,
        choiceLabel: CHOICE_LABEL[v.choice],
        comment: v.comment as string,
        atLabel: v.atLabel,
        isMe: v.voterId === CURRENT_USER_ID,
      };
    });

  return {
    id: p.id,
    title: p.title,
    body: p.body,
    communityName: community?.name ?? "Community",
    communityType: community?.type ?? "",
    authorName: p.authorId === CURRENT_USER_ID ? "You" : author.name,
    authorInitials: author.initials,
    authorColor: author.color,
    isOpen,
    statusLabel,
    closesLabel: isOpen ? p.closesLabel : null,
    tally,
    total,
    myChoice: mine?.choice ?? null,
    myComment: mine?.comment ?? null,
    comments,
    index,
  };
}

export default function ProposalsClient() {
  const [proposals, setProposals] = useState<Proposal[]>(PROPOSALS);

  // Optimistic, in-memory vote. One member, one vote: we replace any existing
  // vote from the current user rather than adding a second.
  function cast(proposalId: string, choice: Choice, comment: string) {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId || p.status !== "open") return p;
        const others = p.votes.filter((v) => v.voterId !== CURRENT_USER_ID);
        return {
          ...p,
          votes: [
            ...others,
            {
              voterId: CURRENT_USER_ID,
              choice,
              comment: comment.trim() ? comment.trim() : null,
              atLabel: "Just now",
            },
          ],
        };
      }),
    );
  }

  function withdraw(proposalId: string) {
    setProposals((prev) =>
      prev.map((p) =>
        p.id !== proposalId
          ? p
          : { ...p, votes: p.votes.filter((v) => v.voterId !== CURRENT_USER_ID) },
      ),
    );
  }

  const vms = proposals.map((p, i) => buildVM(p, i));
  const openCount = vms.filter((v) => v.isOpen).length;

  return (
    <main className="min-h-dvh bg-coord-canvas text-coord-cream">
      <header className="border-b border-coord-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-coord-border bg-coord-surface-3 text-sm font-bold text-coord-cream">
              B
            </span>
            <span className="font-display text-base font-bold tracking-tight">
              Baraza
            </span>
          </Link>
          <span className="text-sm text-coord-muted">Tujenge SACCO</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-coord-muted">
            Governance
          </p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
            Proposals
          </h1>
          <p className="mt-2 text-[15px] text-coord-muted">
            {openCount > 0
              ? `${openCount} open for voting · one member, one vote`
              : "No open votes right now · one member, one vote"}
          </p>
        </div>

        <div className="space-y-6">
          {vms.map((vm) => (
            <ProposalCard
              key={vm.id}
              vm={vm}
              onCast={cast}
              onWithdraw={withdraw}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
