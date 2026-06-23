"use client";

import { useState } from "react";

const CONTRIBUTORS = [
  {
    id: 1,
    name: "Amani Kimathi",
    role: "Founder",
    reputation: 11540,
    votes: 29,
    payments: 23,
    bio: "Software Engineer | Community Tech | Podcaster — Fluent in English, Swahili and French",
    color: "#f59e0b",
    initials: "AK",
    joinedAgo: "18mo",
    contributed: "KSh 12,018",
  },
  {
    id: 2,
    name: "Wanjiku Muthoni",
    role: "Admin",
    reputation: 10092,
    votes: 28,
    payments: 21,
    bio: "Community Operations Contributor. Graphics, Content and Template Creator. Data Entry...",
    color: "#10b981",
    initials: "WM",
    joinedAgo: "14mo",
    contributed: "KSh 8,450",
  },
  {
    id: 3,
    name: "Otieno Baraka",
    role: "Member",
    reputation: 8150,
    votes: 22,
    payments: 18,
    bio: "Community Operations & Management | Community Tooling | Content & Communications...",
    color: "#6366f1",
    initials: "OB",
    joinedAgo: "11mo",
    contributed: "KSh 5,200",
  },
  {
    id: 4,
    name: "Fatuma Hassan",
    role: "Member",
    reputation: 4750,
    votes: 15,
    payments: 12,
    bio: "Polyglot fluent in English, Swahili and Arabic. I help community groups and savings circles...",
    color: "#e11d48",
    initials: "FH",
    joinedAgo: "9mo",
    contributed: "KSh 3,800",
  },
  {
    id: 5,
    name: "Kamau Njoroge",
    role: "Member",
    reputation: 4609,
    votes: 14,
    payments: 11,
    bio: "Technical and Content Writing | Content Creation | Analysis | Social Media...",
    color: "#0891b2",
    initials: "KN",
    joinedAgo: "8mo",
    contributed: "KSh 3,100",
  },
  {
    id: 6,
    name: "Achieng Odhiambo",
    role: "Member",
    reputation: 4000,
    votes: 12,
    payments: 9,
    bio: "Data analyst and community organiser with a focus on financial inclusion.",
    color: "#7c3aed",
    initials: "AO",
    joinedAgo: "6mo",
    contributed: "KSh 2,400",
  },
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Founder: { bg: "#fef3c7", text: "#92400e" },
  Admin: { bg: "#dcfce7", text: "#166534" },
  Member: { bg: "#f3f4f6", text: "#374151" },
};

const ROLE_FILTERS = ["All", "Founders", "Admins", "Members"];
const SORT_OPTIONS = ["Contribution", "Join Date", "Name", "Last Active"];

export default function Contributors() {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("All");
  const [activeSort, setActiveSort] = useState("Contribution");

  const filtered = CONTRIBUTORS.filter((c) => {
    const matchRole =
      activeRole === "All" ||
      (activeRole === "Founders" && c.role === "Founder") ||
      (activeRole === "Admins" && c.role === "Admin") ||
      (activeRole === "Members" && c.role === "Member");
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.bio.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalContributed = CONTRIBUTORS.reduce((sum, c) => sum + parseInt(c.contributed.replace(/[^0-9]/g, "")), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Members", value: CONTRIBUTORS.length.toString(), icon: "👥" },
          { label: "Total Contributed", value: `KSh ${totalContributed.toLocaleString()}`, icon: "💰" },
          { label: "Avg per Member", value: `KSh ${Math.round(totalContributed / CONTRIBUTORS.length).toLocaleString()}`, icon: "📊" },
          { label: "Leaders", value: "3", icon: "🏅" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                activeRole === r
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M9 17h6" />
          </svg>
          Sort by:
        </span>
        {SORT_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSort(s)}
            className={`transition-colors ${activeSort === s ? "text-orange-500 font-medium" : "hover:text-gray-900"}`}
          >
            {s}
            {activeSort === s && " ↓"}
          </button>
        ))}
      </div>

      {/* Member rows */}
      <div className="flex flex-col gap-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer px-5 py-4 flex items-center gap-4"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: c.color }}
            >
              {c.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: ROLE_COLORS[c.role]?.bg, color: ROLE_COLORS[c.role]?.text }}
                >
                  {c.role}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Joined {c.joinedAgo} ago · {c.contributed} contributed
              </p>
              {c.bio && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.bio}</p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm text-right flex-shrink-0">
              <div>
                <p className="font-semibold text-gray-900">{c.votes}</p>
                <p className="text-xs text-gray-400">Votes</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.payments}</p>
                <p className="text-xs text-gray-400">Payments</p>
              </div>
              <div>
                <p className="font-semibold text-orange-500">{c.reputation.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Reputation</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-400 py-20">No contributors match your filters.</div>
      )}
    </div>
  );
}
