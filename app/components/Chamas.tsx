"use client";

import { useState } from "react";

const TYPES = ["All", "Savings", "Housing", "Trade", "Agriculture", "Youth", "Women"];

const CHAMAS = [
  {
    id: 1,
    name: "Nairobi Women's Investment Group",
    tagline: "Empowering women through collective monthly savings and micro-investments in local businesses.",
    members: 45,
    treasury: "KSh 234,500",
    meetingCycle: "Monthly",
    type: "Women",
    coverColor: "#3b0a1e",
    logoColor: "#e11d48",
    logo: "NW",
    featured: true,
  },
  {
    id: 2,
    name: "Umoja Savings Circle",
    tagline: "Unity is strength — weekly contributions rotating among members for lump-sum payouts.",
    members: 32,
    treasury: "KSh 78,400",
    meetingCycle: "Weekly",
    type: "Savings",
    coverColor: "#1a1000",
    logoColor: "#d97706",
    logo: "US",
    featured: false,
  },
  {
    id: 3,
    name: "Pamoja Traders Chama",
    tagline: "Small business owners funding shared bulk purchases and market stall expansions together.",
    members: 58,
    treasury: "KSh 312,000",
    meetingCycle: "Bi-weekly",
    type: "Trade",
    coverColor: "#001a1f",
    logoColor: "#0891b2",
    logo: "PT",
    featured: false,
  },
  {
    id: 4,
    name: "Kilimo Bora Group",
    tagline: "Agricultural investments for smallholder farmers — seeds, fertilizer, and equipment hire.",
    members: 24,
    treasury: "KSh 95,700",
    meetingCycle: "Monthly",
    type: "Agriculture",
    coverColor: "#0a1a0a",
    logoColor: "#16a34a",
    logo: "KB",
    featured: false,
  },
  {
    id: 5,
    name: "Karibu Housing Cooperative",
    tagline: "Pooling resources for affordable plot purchases and home construction in the outskirts.",
    members: 88,
    treasury: "KSh 1,240,000",
    meetingCycle: "Monthly",
    type: "Housing",
    coverColor: "#1a1000",
    logoColor: "#ca8a04",
    logo: "KH",
    featured: false,
  },
  {
    id: 6,
    name: "Teknolojia Vijana",
    tagline: "Tech-savvy youth building digital skills and co-investing in tools, courses, and projects.",
    members: 22,
    treasury: "KSh 42,800",
    meetingCycle: "Weekly",
    type: "Youth",
    coverColor: "#100a28",
    logoColor: "#6d28d9",
    logo: "TV",
    featured: false,
  },
];

export default function Chamas() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");

  const filtered = CHAMAS.filter((c) => {
    const matchType = activeType === "All" || c.type === activeType;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tagline.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const featured = filtered.find((c) => c.featured);
  const rest = filtered.filter((c) => !c.featured);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                activeType === t
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search + Create */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search chamas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 w-52"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start a Chama
          </button>
        </div>
      </div>

      {/* Featured card */}
      {featured && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-gray-200 bg-white flex flex-col md:flex-row shadow-sm">
          <div
            className="md:w-72 h-48 md:h-auto flex-shrink-0 flex items-end p-5"
            style={{ background: `linear-gradient(135deg, ${featured.coverColor}, #000)` }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm mb-2"
                style={{ background: featured.logoColor }}
              >
                {featured.logo}
              </div>
              <p className="text-white font-bold text-lg leading-tight">{featured.name}</p>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">Featured Chama</span>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{featured.tagline}</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xl font-bold text-gray-900">{featured.members}</p>
                  <p className="text-xs text-gray-400">Members</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{featured.treasury}</p>
                  <p className="text-xs text-gray-400">Treasury</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{featured.meetingCycle}</p>
                  <p className="text-xs text-gray-400">Meetings</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                Join this chama
              </button>
              <button className="border border-gray-200 hover:border-gray-400 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                View profile →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-medium">
        {filtered.length} Chamas found
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((chama) => (
          <div
            key={chama.id}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
          >
            {/* Cover */}
            <div
              className="h-28 flex items-end p-4"
              style={{ background: `linear-gradient(135deg, ${chama.coverColor}, #111)` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                style={{ background: chama.logoColor }}
              >
                {chama.logo}
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{chama.name}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap flex-shrink-0">{chama.type}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{chama.tagline}</p>

              <div className="flex gap-4 mb-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{chama.members}</p>
                  <p className="text-[11px] text-gray-400">Members</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{chama.treasury}</p>
                  <p className="text-[11px] text-gray-400">Treasury</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{chama.meetingCycle}</p>
                  <p className="text-[11px] text-gray-400">Cycle</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                  Join this chama
                </button>
                <button className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors">
                  View profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-400 py-20">No chamas match your search.</div>
      )}
    </div>
  );
}
