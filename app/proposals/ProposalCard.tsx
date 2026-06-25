"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Choice } from "@/app/lib/mock/types";

export type { Choice };

export type ProposalVM = {
  id: string;
  title: string;
  body: string | null;
  communityName: string;
  communityType: string;
  authorName: string;
  authorInitials: string;
  authorColor: string | null;
  isOpen: boolean;
  statusLabel: string; // "Open", "Passed", "Rejected", "Closed", "Draft"
  closesLabel: string | null;
  tally: Record<Choice, number>;
  total: number;
  myChoice: Choice | null;
  myComment: string | null;
  comments: {
    voter: string;
    initials: string;
    color: string | null;
    choice: Choice;
    choiceLabel: string;
    comment: string;
    atLabel: string;
    isMe: boolean;
  }[];
  index: number;
};

const CHOICE_META: Record<Choice, { label: string; bar: string }> = {
  for: { label: "For", bar: "#ffe083" }, // positive -> yellow
  against: { label: "Against", bar: "#b3a06f" }, // muted cream
  abstain: { label: "Abstain", bar: "#5a4f2e" }, // dim
};

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Avatar({
  initials,
  color,
  size = 32,
}: {
  initials: string;
  color: string | null;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-grid place-items-center rounded-full font-display text-xs font-bold text-coord-canvas"
      style={{ width: size, height: size, background: color ?? "#b3a06f" }}
    >
      {initials || "?"}
    </span>
  );
}

export default function ProposalCard({
  vm,
  onCast,
  onWithdraw,
}: {
  vm: ProposalVM;
  onCast: (proposalId: string, choice: Choice, comment: string) => void;
  onWithdraw: (proposalId: string) => void;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  const barRefs = useRef<Record<Choice, HTMLDivElement | null>>({
    for: null,
    against: null,
    abstain: null,
  });
  const countRefs = useRef<Record<Choice, HTMLSpanElement | null>>({
    for: null,
    against: null,
    abstain: null,
  });

  // Entrance once; bar fills + count-ups re-run whenever the tally changes
  // (i.e. after a vote). All <400ms, reduced-motion safe.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const pct = (n: number) => (vm.total > 0 ? (n / vm.total) * 100 : 0);
    const choices: Choice[] = ["for", "against", "abstain"];

    if (prefersReduced()) {
      choices.forEach((c) => {
        const bar = barRefs.current[c];
        if (bar) bar.style.width = `${pct(vm.tally[c])}%`;
        const count = countRefs.current[c];
        if (count) count.textContent = String(vm.tally[c]);
      });
      return;
    }

    const ctx = gsap.context(() => {
      choices.forEach((c) => {
        const bar = barRefs.current[c];
        if (bar) {
          gsap.fromTo(
            bar,
            { width: "0%" },
            { width: `${pct(vm.tally[c])}%`, duration: 0.36, ease: "power2.out" },
          );
        }
        const count = countRefs.current[c];
        if (count) {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: vm.tally[c],
            duration: 0.36,
            ease: "power1.out",
            onUpdate: () => {
              count.textContent = String(Math.round(obj.v));
            },
          });
        }
      });
    }, card);

    return () => ctx.revert();
  }, [vm.total, vm.tally]);

  // Entrance stagger — runs once on mount.
  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(card, {
        y: 12,
        opacity: 0,
        duration: 0.32,
        ease: "power2.out",
        delay: Math.min(vm.index, 6) * 0.06,
      });
    }, card);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outcomeTone =
    vm.statusLabel === "Passed"
      ? "text-coord-yellow border-coord-yellow/40"
      : "text-coord-muted border-coord-border";

  return (
    <article
      ref={cardRef}
      className="rounded-2xl border border-coord-border bg-coord-surface p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-coord-muted/30 sm:p-7"
    >
      {/* Header: community + status */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-coord-muted">
          {vm.communityName} · {vm.communityType}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            vm.isOpen ? "border-coord-orange/40 text-coord-orange" : outcomeTone
          }`}
        >
          {vm.statusLabel}
        </span>
      </div>

      {/* Title + body */}
      <h2 className="font-display text-xl font-bold leading-snug tracking-[-0.01em] text-coord-cream sm:text-2xl">
        {vm.title}
      </h2>
      {vm.body && (
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-coord-cream/80">
          {vm.body}
        </p>
      )}

      {/* Proposer — a named person, never an address */}
      <div className="mt-4 flex items-center gap-2.5">
        <Avatar initials={vm.authorInitials} color={vm.authorColor} size={28} />
        <span className="text-sm text-coord-muted">
          Proposed by{" "}
          <span className="font-medium text-coord-cream">{vm.authorName}</span>
        </span>
        {vm.closesLabel && (
          <span className="ml-auto text-xs text-coord-muted">{vm.closesLabel}</span>
        )}
      </div>

      {/* Tally bars */}
      <div className="mt-6 space-y-3">
        {(["for", "against", "abstain"] as Choice[]).map((c) => {
          const meta = CHOICE_META[c];
          const isMine = vm.myChoice === c;
          return (
            <div key={c}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-coord-cream">
                  {meta.label}
                  {isMine && (
                    <span className="rounded-full bg-coord-orange/15 px-2 py-0.5 text-[11px] font-semibold text-coord-orange">
                      Your vote
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-coord-muted">
                  <span ref={(el) => { countRefs.current[c] = el; }}>0</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-coord-surface-3">
                <div
                  ref={(el) => { barRefs.current[c] = el; }}
                  className="h-full rounded-full"
                  style={{ width: "0%", background: meta.bar }}
                />
              </div>
            </div>
          );
        })}
        <p className="pt-1 text-xs text-coord-muted">
          {vm.total === 1 ? "1 vote" : `${vm.total} votes`} · one member, one vote
        </p>
      </div>

      {/* Voting controls (open) or closed notice */}
      {vm.isOpen ? (
        <div className="mt-6">
          <label
            htmlFor={`comment-${vm.id}`}
            className="mb-2 block text-sm font-medium text-coord-cream"
          >
            {vm.myChoice ? "Update your vote" : "Cast your vote"}
            <span className="ml-1 font-normal text-coord-muted">
              — add a comment if you like
            </span>
          </label>
          <textarea
            id={`comment-${vm.id}`}
            ref={commentRef}
            rows={2}
            defaultValue={vm.myComment ?? ""}
            placeholder="Why are you voting this way? (optional)"
            className="w-full resize-none rounded-xl border border-coord-border bg-coord-surface-2 px-4 py-3 text-[15px] text-coord-cream placeholder:text-coord-muted/60 outline-none transition focus:border-coord-orange/60 focus:ring-2 focus:ring-coord-orange/20"
          />

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {(["for", "against", "abstain"] as Choice[]).map((c) => {
              const selected = vm.myChoice === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onCast(vm.id, c, commentRef.current?.value ?? "")
                  }
                  className={`min-h-[48px] rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? "border-coord-orange bg-coord-orange text-coord-canvas"
                      : "border-coord-border bg-coord-surface-2 text-coord-cream hover:border-coord-orange/50 hover:bg-coord-surface-3"
                  }`}
                >
                  {CHOICE_META[c].label}
                </button>
              );
            })}
          </div>

          {vm.myChoice && (
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-coord-muted">
                You voted{" "}
                <span className="font-medium text-coord-cream">
                  {CHOICE_META[vm.myChoice].label}
                </span>
                . You can change it until voting closes.
              </span>
              <button
                type="button"
                onClick={() => onWithdraw(vm.id)}
                className="shrink-0 text-xs text-coord-muted underline underline-offset-2 transition hover:text-coord-cream"
              >
                Withdraw
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-coord-border bg-coord-surface-2 px-4 py-3 text-sm text-coord-muted">
          Voting is closed — these results are final.
        </div>
      )}

      {/* Comment thread (per-vote comments = the deliberation) */}
      {vm.comments.length > 0 && (
        <div className="mt-6 border-t border-coord-border pt-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-coord-muted">
            Discussion · {vm.comments.length}
          </h3>
          <ul className="space-y-4">
            {vm.comments.map((c, i) => (
              <li key={i} className="flex gap-3">
                <Avatar initials={c.initials} color={c.color} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-coord-cream">
                      {c.isMe ? "You" : c.voter}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        c.choice === "for"
                          ? "bg-coord-yellow/15 text-coord-yellow"
                          : "bg-coord-surface-3 text-coord-muted"
                      }`}
                    >
                      {c.choiceLabel}
                    </span>
                    <span className="text-xs text-coord-muted">{c.atLabel}</span>
                  </div>
                  <p className="mt-1 text-[15px] leading-relaxed text-coord-cream/85">
                    {c.comment}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
