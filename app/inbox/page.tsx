"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotifications } from "../lib/NotificationContext";
import { EVENT_ICONS, EventType, timeAgo } from "../lib/notifications";

const TYPE_GROUPS: { label: string; types: EventType[] | "all" | "unread" }[] = [
  { label: "All", types: "all" },
  { label: "Unread", types: "unread" },
  { label: "Bounties", types: ["new_bounty", "new_bid", "bid_accepted", "bid_rejected", "status_changed"] },
  { label: "Payments", types: ["payment_processed"] },
  { label: "Groups", types: ["dao_invitation", "achievement"] },
  { label: "Comments", types: ["comment_reply", "mention"] },
];

const TYPE_ACCENT: Record<EventType, string> = {
  new_bounty:        "#f97316",
  new_bid:           "#8b5cf6",
  bid_accepted:      "#10b981",
  bid_rejected:      "#ef4444",
  status_changed:    "#6b7280",
  payment_processed: "#10b981",
  comment_reply:     "#3b82f6",
  mention:           "#f59e0b",
  achievement:       "#f59e0b",
  dao_invitation:    "#f97316",
  security_alert:    "#ef4444",
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function groupLabel(date: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  if (date >= weekAgo) return "This week";
  return "Earlier";
}

export default function InboxPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = notifications.filter((n) => {
    const group = TYPE_GROUPS.find((g) => g.label === activeFilter);
    if (!group) return true;
    if (group.types === "all") return true;
    if (group.types === "unread") return !n.read;
    return (group.types as EventType[]).includes(n.eventType);
  });

  // Group by date label
  const groups: { label: string; items: typeof notifications }[] = [];
  for (const n of filtered) {
    const label = groupLabel(n.createdAt);
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(n);
    else groups.push({ label, items: [n] });
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#f5f5f5" }}>
      <header className="px-8 py-4 flex items-center gap-3 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-black">B</div>
          <span className="font-semibold text-white text-sm">Baraza</span>
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 text-sm">Inbox</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title row */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-white">
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-semibold bg-orange-500 text-black px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Mark all read
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TYPE_GROUPS.map((g) => {
            const count =
              g.types === "unread"
                ? notifications.filter((n) => !n.read).length
                : g.types === "all"
                ? notifications.length
                : notifications.filter((n) => (g.types as EventType[]).includes(n.eventType)).length;
            return (
              <button
                key={g.label}
                onClick={() => setActiveFilter(g.label)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  activeFilter === g.label
                    ? "bg-orange-500 border-orange-500 text-black"
                    : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
                }`}
              >
                {g.label}
                {count > 0 && (
                  <span className={`ml-1.5 ${activeFilter === g.label ? "text-black/60" : "text-zinc-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grouped notifications */}
        {groups.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-zinc-500 text-sm">Nothing here yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex gap-4 px-5 py-4 rounded-xl border cursor-pointer transition-colors ${
                        !n.read
                          ? "bg-orange-500/5 border-orange-500/15 hover:bg-orange-500/8"
                          : "bg-[#111] border-white/5 hover:bg-white/5"
                      }`}
                    >
                      {/* Left accent */}
                      <div
                        className="w-0.5 rounded-full flex-shrink-0 self-stretch"
                        style={{ background: !n.read ? TYPE_ACCENT[n.eventType] : "transparent" }}
                      />

                      <span className="text-xl flex-shrink-0 mt-0.5">{EVENT_ICONS[n.eventType]}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-sm font-medium leading-snug ${!n.read ? "text-white" : "text-zinc-400"}`}>
                            {n.title}
                          </p>
                          <span className="text-xs text-zinc-600 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{n.body}</p>
                        <div className="flex items-center gap-4 mt-2.5">
                          <Link
                            href={n.actionUrl}
                            onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                            className="text-xs font-medium transition-colors hover:underline"
                            style={{ color: TYPE_ACCENT[n.eventType] }}
                          >
                            {n.actionLabel} →
                          </Link>
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>

                      {!n.read && (
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: TYPE_ACCENT[n.eventType] }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
