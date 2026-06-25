"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { getCommunity } from "@/app/lib/mock/communities";
import { getCommunityStats } from "@/app/lib/mock/community-stats";
import { getContributors } from "@/app/lib/mock/contributors";
import { getBounties, getOpenBounties } from "@/app/lib/mock/bounties";
import { PROPOSALS } from "@/app/lib/mock/proposals";
import { CURRENT_USER_ID, getMember } from "@/app/lib/mock/members";
import type { Bounty, Choice } from "@/app/lib/mock/types";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Avatar({
  initials,
  color,
  size = 36,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-display text-xs font-bold text-coord-canvas"
      style={{ width: size, height: size, background: color }}
    >
      {initials || "?"}
    </span>
  );
}

/* KPI tile — counts up to its value on mount, staggered by index. */
function Kpi({
  value,
  label,
  index,
}: {
  value: number;
  label: string;
  index: number;
}) {
  const numRef = useRef<HTMLSpanElement | null>(null);
  const tileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const num = numRef.current;
    const tile = tileRef.current;
    if (!num || !tile) return;

    if (prefersReduced()) {
      num.textContent = String(value);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(tile, {
        y: 12,
        opacity: 0,
        duration: 0.32,
        ease: "power2.out",
        delay: index * 0.08,
      });
      const obj = { v: 0 };
      gsap.to(obj, {
        v: value,
        duration: 0.36,
        ease: "power1.out",
        delay: index * 0.08,
        onUpdate: () => {
          num.textContent = String(Math.round(obj.v));
        },
      });
    }, tile);
    return () => ctx.revert();
  }, [value, index]);

  return (
    <div
      ref={tileRef}
      className="rounded-2xl border border-coord-border bg-coord-surface p-5"
    >
      <span
        ref={numRef}
        className="block font-display text-3xl font-bold tabular-nums tracking-tight text-coord-cream sm:text-4xl"
      >
        0
      </span>
      <span className="mt-1 block text-[13px] font-medium uppercase tracking-wide text-coord-muted">
        {label}
      </span>
    </div>
  );
}

/* Compact open-proposal row with a segmented tally bar that fills on mount. */
function GovernanceRow({
  title,
  closesLabel,
  tally,
  total,
  index,
}: {
  title: string;
  closesLabel: string | null;
  tally: Record<Choice, number>;
  total: number;
  index: number;
}) {
  const barRefs = useRef<Record<Choice, HTMLDivElement | null>>({
    for: null,
    against: null,
    abstain: null,
  });

  useEffect(() => {
    const choices: Choice[] = ["for", "against", "abstain"];
    const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

    if (prefersReduced()) {
      choices.forEach((c) => {
        const bar = barRefs.current[c];
        if (bar) bar.style.width = `${pct(tally[c])}%`;
      });
      return;
    }

    const ctx = gsap.context(() => {
      choices.forEach((c) => {
        const bar = barRefs.current[c];
        if (bar)
          gsap.fromTo(
            bar,
            { width: "0%" },
            {
              width: `${pct(tally[c])}%`,
              duration: 0.36,
              ease: "power2.out",
              delay: 0.1 + index * 0.06,
            },
          );
      });
    });
    return () => ctx.revert();
  }, [tally, total, index]);

  const seg: Record<Choice, string> = {
    for: "#ffe083",
    against: "#b3a06f",
    abstain: "#5a4f2e",
  };

  return (
    <Link
      href="/proposals"
      className="block rounded-xl border border-coord-border bg-coord-surface-2 p-4 transition hover:border-coord-muted/30 hover:bg-coord-surface-3"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[15px] font-medium leading-snug text-coord-cream">
          {title}
        </span>
        {closesLabel && (
          <span className="shrink-0 text-xs text-coord-muted">
            {closesLabel}
          </span>
        )}
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-coord-surface-3">
        {(["for", "against", "abstain"] as Choice[]).map((c) => (
          <div
            key={c}
            ref={(el) => {
              barRefs.current[c] = el;
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: "0%", background: seg[c] }}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-coord-muted">
        {total === 1 ? "1 vote" : `${total} votes`} · {tally.for} for ·{" "}
        {tally.against} against · {tally.abstain} abstain
      </p>
    </Link>
  );
}

const BOUNTY_STATUS_META: Record<
  Bounty["status"],
  { label: string; cls: string }
> = {
  open: { label: "Open", cls: "border-coord-orange/40 text-coord-orange" },
  in_review: {
    label: "In review",
    cls: "border-coord-border text-coord-muted",
  },
  awarded: {
    label: "Awarded",
    cls: "border-coord-yellow/40 text-coord-yellow",
  },
  closed: { label: "Closed", cls: "border-coord-border text-coord-muted" },
};

export default function CommunityDashboardClient({
  communityId,
}: {
  communityId: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const community = getCommunity(communityId);
  const stats = getCommunityStats(communityId);
  const contributors = getContributors(communityId);
  const openBounties = getOpenBounties(communityId);
  const totalBounties = getBounties(communityId).length;
  const openProposals = PROPOSALS.filter(
    (p) => p.communityId === communityId && p.status === "open",
  );

  // Section entrance — gentle stagger, runs once.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-section]", {
        y: 16,
        opacity: 0,
        duration: 0.34,
        ease: "power2.out",
        stagger: 0.08,
        delay: 0.1,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  if (!community) return null;

  const typeLabel =
    community.type.charAt(0).toUpperCase() + community.type.slice(1);

  const kpis = [
    { value: stats?.memberCount ?? 0, label: "Members" },
    { value: openProposals.length, label: "Open proposals" },
    { value: openBounties.length, label: "Open bounties" },
    { value: stats?.decisionsToDate ?? 0, label: "Decisions to date" },
  ];

  return (
    <main className="min-h-dvh bg-coord-canvas text-coord-cream">
      <header className="border-b border-coord-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-coord-border bg-coord-surface-3 text-sm font-bold text-coord-cream">
              B
            </span>
            <span className="font-display text-base font-bold tracking-tight">
              Baraza
            </span>
          </Link>
          <span className="text-sm text-coord-muted">{community.name}</span>
        </div>
      </header>

      <div ref={rootRef} className="mx-auto max-w-5xl px-5 py-8">
        {/* Hero */}
        <section data-section className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-coord-muted">
            {typeLabel}
            {community.meetingCycle ? ` · ${community.meetingCycle} meetings` : ""}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
                {community.name}
              </h1>
              <p className="mt-2 max-w-xl text-[15px] text-coord-muted">
                {community.tagline}
              </p>
            </div>
            <Link
              href="/proposals"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-coord-orange px-5 py-2.5 text-sm font-semibold text-coord-canvas transition hover:brightness-110"
            >
              New proposal
            </Link>
          </div>
        </section>

        {/* KPI row */}
        <section
          data-section
          className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {kpis.map((k, i) => (
            <Kpi key={k.label} value={k.value} label={k.label} index={i} />
          ))}
        </section>

        {/* Treasury — display only, never actionable */}
        <section
          data-section
          className="mb-8 rounded-2xl border border-coord-border bg-coord-surface p-6 sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-coord-muted">
              Treasury
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-coord-border bg-coord-surface-2 px-3 py-1 text-xs font-medium text-coord-muted">
              <span aria-hidden>●</span> Read-only · stated balance
            </span>
          </div>
          <p className="mt-4 font-display text-4xl font-bold tracking-tight text-coord-cream sm:text-5xl">
            {community.fundDisplay}
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-coord-muted">
            Reported by the committee. Baraza shows this figure for transparency —
            it never holds, moves, or settles the community&apos;s money.
          </p>
        </section>

        {/* Governance + contributors */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Active governance */}
          <section
            data-section
            className="rounded-2xl border border-coord-border bg-coord-surface p-6 lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Active governance
              </h2>
              <Link
                href="/proposals"
                className="text-sm text-coord-muted underline underline-offset-2 transition hover:text-coord-cream"
              >
                View all
              </Link>
            </div>
            {openProposals.length > 0 ? (
              <div className="space-y-3">
                {openProposals.map((p, i) => {
                  const tally: Record<Choice, number> = {
                    for: 0,
                    against: 0,
                    abstain: 0,
                  };
                  for (const v of p.votes) tally[v.choice] += 1;
                  return (
                    <GovernanceRow
                      key={p.id}
                      title={p.title}
                      closesLabel={p.closesLabel}
                      tally={tally}
                      total={p.votes.length}
                      index={i}
                    />
                  );
                })}
                <p className="pt-1 text-xs text-coord-muted">
                  One member, one vote.
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-coord-border bg-coord-surface-2 px-4 py-6 text-center text-sm text-coord-muted">
                No open votes right now. New proposals will appear here.
              </p>
            )}
          </section>

          {/* Top contributors */}
          <section
            data-section
            className="rounded-2xl border border-coord-border bg-coord-surface p-6"
          >
            <h2 className="mb-1 font-display text-lg font-bold tracking-tight">
              Top contributors
            </h2>
            <p className="mb-4 text-xs text-coord-muted">
              Reputation reflects participation — not money.
            </p>
            <ul className="space-y-4">
              {contributors.map((c) => {
                const m = getMember(c.memberId);
                const isMe = c.memberId === CURRENT_USER_ID;
                return (
                  <li key={c.memberId} className="flex items-center gap-3">
                    <Avatar initials={m.initials} color={m.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-coord-cream">
                        {isMe ? "You" : m.name}
                      </p>
                      <p className="truncate text-xs text-coord-muted">
                        {c.role} · {c.decisions} decisions
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-display text-base font-bold tabular-nums text-coord-cream">
                        {c.reputation}
                      </span>
                      <span className="block text-[11px] uppercase tracking-wide text-coord-muted">
                        rep
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Open bounties */}
        <section data-section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Open bounties
            </h2>
            <span className="text-sm text-coord-muted">
              {openBounties.length} open of {totalBounties}
            </span>
          </div>
          {openBounties.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openBounties.map((b) => {
                const poster = getMember(b.postedById);
                const meta = BOUNTY_STATUS_META[b.status];
                return (
                  <article
                    key={b.id}
                    className="flex flex-col rounded-2xl border border-coord-border bg-coord-surface p-5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-coord-muted">
                        {b.applicants}{" "}
                        {b.applicants === 1 ? "applicant" : "applicants"}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold leading-snug text-coord-cream">
                      {b.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-coord-muted">
                      {b.summary}
                    </p>
                    <div className="mt-4 border-t border-coord-border pt-3">
                      <p className="font-display text-lg font-bold text-coord-cream">
                        {b.rewardDisplay}
                      </p>
                      <p className="mt-0.5 text-xs text-coord-muted">
                        Settles via partner · posted by{" "}
                        <span className="text-coord-cream/80">
                          {b.postedById === CURRENT_USER_ID
                            ? "you"
                            : poster.name}
                        </span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-coord-border bg-coord-surface-2 px-4 py-6 text-center text-sm text-coord-muted">
              No open bounties. Posted work will appear here.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
