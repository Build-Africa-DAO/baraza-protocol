"use client";

import { useState } from "react";

const NETWORKS = ["All", "Stellar"];

const DAOS = [
  {
    id: 1,
    name: "Kibera Youth Collective",
    tagline: "A savings group for young entrepreneurs in Kibera. We pool resources monthly and create other's business delivery.",
    members: 34,
    fund: "KSh 104,200",
    decisions: 5,
    tags: ["Youth business poster kit"],
    network: "Stellar",
    coverColor: "#1a2744",
    logoColor: "#f59e0b",
    logo: "KY",
    featured: false,
  },
  {
    id: 2,
    name: "Mwarzo Housing Sacco",
    tagline: "Community housing initiative. Members contribute monthly toward land purchase and construction.",
    members: 14,
    fund: "KSh 1,480,000",
    decisions: 3,
    tags: ["Housing", "Sacco"],
    network: "Stellar",
    coverColor: "#0e3a2f",
    logoColor: "#10b981",
    logo: "MH",
    featured: true,
  },
  {
    id: 3,
    name: "Mama Mboga Association",
    tagline: "Market vendors cooperative for bulk purchasing, shared transport, and collective bargaining.",
    members: 103,
    fund: "KSh 88,400",
    decisions: 2,
    tags: ["Market", "Trade"],
    network: "Stellar",
    coverColor: "#2d1a00",
    logoColor: "#f97316",
    logo: "MM",
    featured: false,
  },
  {
    id: 4,
    name: "TechBridge Nairobi",
    tagline: "Professional network for tech workers. Monthly contributions for direct content audit more.",
    members: 29,
    fund: "KSh 210,500",
    decisions: 4,
    tags: ["Tech", "Professional"],
    network: "Stellar",
    coverColor: "#0a1628",
    logoColor: "#6366f1",
    logo: "TB",
    featured: false,
  },
  {
    id: 5,
    name: "Westlands Traders Circle",
    tagline: "Import-export business coalition funding shared logistics and trade finance.",
    members: 47,
    fund: "KSh 560,000",
    decisions: 6,
    tags: ["Trade", "Logistics"],
    network: "Stellar",
    coverColor: "#1a0a2e",
    logoColor: "#8b5cf6",
    logo: "WT",
    featured: false,
  },
  {
    id: 6,
    name: "Kakamega Farmers Circle",
    tagline: "Smallholder farmers pooling for inputs, equipment hire, and collective market access.",
    members: 88,
    fund: "KSh 145,300",
    decisions: 3,
    tags: ["Agriculture", "Rural"],
    network: "Stellar",
    coverColor: "#0d2b0d",
    logoColor: "#16a34a",
    logo: "KF",
    featured: false,
  },
];

export default function TopDAOs() {
  const [search, setSearch] = useState("");
  const [activeNetwork, setActiveNetwork] = useState("All");

  const filtered = DAOS.filter((d) => {
    const matchNetwork = activeNetwork === "All" || d.network === activeNetwork;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tagline.toLowerCase().includes(search.toLowerCase());
    return matchNetwork && matchSearch;
  });

  const featured = filtered.find((d) => d.featured);
  const rest = filtered.filter((d) => !d.featured);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Network filter */}
        <div className="flex flex-wrap gap-2">
          {NETWORKS.map((n) => (
            <button
              key={n}
              onClick={() => setActiveNetwork(n)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                activeNetwork === n
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Search + Launch */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 w-52"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start a group
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
              <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">Featured Community</span>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{featured.tagline}</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xl font-bold text-gray-900">{featured.members}</p>
                  <p className="text-xs text-gray-400">Members</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{featured.fund}</p>
                  <p className="text-xs text-gray-400">Community fund</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{featured.decisions}</p>
                  <p className="text-xs text-gray-400">Decisions</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                Become a member
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
        {filtered.length} groups found
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((dao) => (
          <div
            key={dao.id}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
          >
            {/* Cover */}
            <div
              className="h-28 flex items-end p-4"
              style={{ background: `linear-gradient(135deg, ${dao.coverColor}, #111)` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                style={{ background: dao.logoColor }}
              >
                {dao.logo}
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{dao.name}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap flex-shrink-0">{dao.network}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{dao.tagline}</p>

              <div className="flex gap-4 mb-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{dao.members}</p>
                  <p className="text-[11px] text-gray-400">Members</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{dao.fund}</p>
                  <p className="text-[11px] text-gray-400">Community fund</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                  Become a member
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
        <div className="text-center text-gray-400 py-20">No groups match your search.</div>
      )}
    </div>
  );
}
