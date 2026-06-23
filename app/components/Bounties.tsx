"use client";

import { useState } from "react";

const SKILLS = ["Development", "Design", "Translation", "Writing", "Marketing", "Community", "Research", "Operations", "Legal", "Data Analytics"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "reward", label: "Highest reward" },
  { value: "deadline", label: "Closing soon" },
];

const BOUNTIES = [
  {
    id: 1,
    title: "Youth business poster kit",
    org: "Kibera Youth Collective",
    orgType: "Group",
    daysLeft: 5,
    reward: "KSh 26,000",
    rewardNum: 26000,
    submissions: 4,
    tags: ["Design"],
    status: "Open",
    logoColor: "#f59e0b",
    logo: "KY",
    createdDaysAgo: 3,
  },
  {
    id: 2,
    title: "Financial literacy facilitator",
    org: "Umoja Savings Circle",
    orgType: "Chama",
    daysLeft: 30,
    reward: "KSh 42,000",
    rewardNum: 42000,
    submissions: 2,
    tags: ["Community", "Operations"],
    status: "Open",
    logoColor: "#d97706",
    logo: "US",
    createdDaysAgo: 5,
  },
  {
    id: 3,
    title: "Community fund audit",
    org: "TechBridge Nairobi",
    orgType: "Group",
    daysLeft: 7,
    reward: "KSh 85,000",
    rewardNum: 85000,
    submissions: 1,
    tags: ["Development", "Research"],
    status: "Open",
    logoColor: "#6366f1",
    logo: "TB",
    createdDaysAgo: 1,
  },
  {
    id: 4,
    title: "Monthly newsletter — market update",
    org: "Mama Mboga Association",
    orgType: "Chama",
    daysLeft: 10,
    reward: "KSh 8,500",
    rewardNum: 8500,
    submissions: 6,
    tags: ["Writing", "Marketing"],
    status: "Open",
    logoColor: "#f97316",
    logo: "MM",
    createdDaysAgo: 7,
  },
  {
    id: 5,
    title: "Swahili translation of decisions handbook",
    org: "Westlands Traders Circle",
    orgType: "Group",
    daysLeft: 20,
    reward: "KSh 14,000",
    rewardNum: 14000,
    submissions: 3,
    tags: ["Translation", "Writing"],
    status: "Open",
    logoColor: "#8b5cf6",
    logo: "WT",
    createdDaysAgo: 4,
  },
  {
    id: 6,
    title: "Soil analysis report — Kakamega region",
    org: "Kakamega Farmers Circle",
    orgType: "Group",
    daysLeft: 25,
    reward: "KSh 32,000",
    rewardNum: 32000,
    submissions: 0,
    tags: ["Research", "Data Analytics"],
    status: "Open",
    logoColor: "#16a34a",
    logo: "KF",
    createdDaysAgo: 2,
  },
];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Design: { bg: "#eff6ff", text: "#1d4ed8" },
  Development: { bg: "#f0fdf4", text: "#15803d" },
  Community: { bg: "#fef9c3", text: "#854d0e" },
  Operations: { bg: "#fdf4ff", text: "#7e22ce" },
  Research: { bg: "#fff7ed", text: "#c2410c" },
  Writing: { bg: "#f0fdfa", text: "#0f766e" },
  Marketing: { bg: "#fef2f2", text: "#b91c1c" },
  Translation: { bg: "#f5f3ff", text: "#6d28d9" },
  "Data Analytics": { bg: "#eff6ff", text: "#1e40af" },
  Legal: { bg: "#fff1f2", text: "#be123c" },
};

function deadlineStyle(daysLeft: number): { color: string; label: string } {
  if (daysLeft <= 7) return { color: "#ef4444", label: `${daysLeft}d left` };
  if (daysLeft <= 14) return { color: "#f59e0b", label: `${daysLeft}d left` };
  return { color: "#6b7280", label: `${daysLeft}d left` };
}

export default function Bounties() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const toggleSkill = (s: string) =>
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtered = BOUNTIES.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.org.toLowerCase().includes(search.toLowerCase());
    const matchSkill = selectedSkills.length === 0 || b.tags.some((t) => selectedSkills.includes(t));
    return matchSearch && matchSkill;
  }).sort((a, b) => {
    if (sort === "reward") return b.rewardNum - a.rewardNum;
    if (sort === "deadline") return a.daysLeft - b.daysLeft;
    return a.createdDaysAgo - b.createdDaysAgo;
  });

  const totalRewards = filtered.reduce((sum, b) => sum + b.rewardNum, 0);
  const avgReward = filtered.length > 0 ? Math.round(totalRewards / filtered.length) : 0;
  const uniqueSkills = new Set(filtered.flatMap((b) => b.tags)).size;
  const urgentCount = filtered.filter((b) => b.daysLeft <= 7).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Open bounties", value: filtered.length.toString(), accent: "#f97316" },
          { label: "Total rewards", value: `KSh ${totalRewards.toLocaleString()}`, accent: "#10b981" },
          { label: "Avg reward", value: `KSh ${avgReward.toLocaleString()}`, accent: "#6366f1" },
          { label: urgentCount > 0 ? `${urgentCount} closing soon` : "Skills needed", value: urgentCount > 0 ? "Urgent" : `${uniqueSkills} categories`, accent: urgentCount > 0 ? "#ef4444" : "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex flex-col gap-0.5">
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
            <div className="h-0.5 mt-2 rounded-full" style={{ background: s.accent, width: "32px" }} />
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 hidden md:block">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-20">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Filters</h2>

            <div className="mb-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Sort</p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Skills</p>
              {selectedSkills.length > 0 && (
                <button
                  onClick={() => setSelectedSkills([])}
                  className="text-xs text-orange-500 mb-3 hover:underline"
                >
                  Clear ({selectedSkills.length})
                </button>
              )}
              {!selectedSkills.length && (
                <p className="text-xs text-gray-400 mb-3">Click to filter by skill</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedSkills.includes(s)
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Open Bounties</h1>
              <p className="text-sm text-gray-500">
                {filtered.length} bounties · KSh {totalRewards.toLocaleString()} in rewards
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search bounties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 w-52"
                />
              </div>
              <button className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post bounty
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            {filtered.map((b) => {
              const dl = deadlineStyle(b.daysLeft);
              const isHot = b.rewardNum >= 50000;
              const isUrgent = b.daysLeft <= 7;
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Urgency stripe */}
                  {isUrgent && (
                    <div className="h-0.5 bg-gradient-to-r from-red-400 to-orange-400" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                        style={{ background: b.logoColor }}
                      >
                        {b.logo}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                {b.status}
                              </span>
                              {isHot && (
                                <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                  🔥 Hot
                                </span>
                              )}
                              {b.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: TAG_COLORS[tag]?.bg ?? "#f3f4f6", color: TAG_COLORS[tag]?.text ?? "#374151" }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <h3 className="font-semibold text-gray-900">{b.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {b.createdDaysAgo === 1 ? "1 day" : `${b.createdDaysAgo} days`} ago · {b.org}
                              <span className="ml-1.5 text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{b.orgType}</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-orange-500">{b.reward}</p>
                            <p className="text-xs text-gray-400">{b.submissions} submission{b.submissions !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs font-medium" style={{ color: dl.color }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dl.label}
                      </div>
                      <button className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-1.5 rounded-lg transition-colors">
                        Submit work →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-300 text-4xl mb-4">🎯</p>
                <p className="text-gray-500 font-medium">No bounties match your filters.</p>
                <button
                  onClick={() => { setSearch(""); setSelectedSkills([]); }}
                  className="mt-3 text-xs text-orange-500 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
