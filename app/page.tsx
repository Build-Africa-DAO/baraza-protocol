"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import TopDAOs from "./components/TopDAOs";
import Chamas from "./components/Chamas";
import Bounties from "./components/Bounties";
import Contributors from "./components/Contributors";
import NotificationBell from "./components/NotificationBell";

type Tab = "daos" | "chamas" | "bounties" | "contributors";

const VALID_TABS: Tab[] = ["daos", "chamas", "bounties", "contributors"];

const ROTATING_WORDS = ["DAO", "SACCO", "treasury"];

const FEATURES = [
  { title: "Govern", sub: "On-chain voting" },
  { title: "Treasury", sub: "Shared funds" },
  { title: "Bounties", sub: "Paid tasks" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "daos", label: "DAOs" },
  { id: "chamas", label: "Chamas" },
  { id: "bounties", label: "Bounties" },
  { id: "contributors", label: "Contributors" },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as Tab | null;
  const initial: Tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "daos";
  const [activeTab, setActiveTab] = useState<Tab>(initial);
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 280);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f3ef", color: "#1a1a1a" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-bold text-white">B</div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Baraza</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleTabChange("daos")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleTabChange("daos")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Explore
            </button>
            <button
              onClick={() => handleTabChange("bounties")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Bounties
            </button>
            <button
              onClick={() => handleTabChange("contributors")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Evaluate
            </button>
            <button
              onClick={() => handleTabChange("daos")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Launch
            </button>
            <button
              onClick={() => handleTabChange("contributors")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Profile
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/inbox" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
              Inbox
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Solana
            </div>
            <button className="text-sm font-semibold bg-gray-900 hover:bg-gray-700 text-white px-4 py-1.5 rounded-full transition-colors">
              Connect
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "#0d0d0d" }} className="px-6 pt-16 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-4">Baraza Protocol</p>

          {/* Animated headline */}
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 leading-tight tracking-tight">
            The operating layer for your
          </h1>
          <div className="h-14 sm:h-16 flex items-center justify-center mb-4 overflow-hidden">
            <span
              className="text-4xl sm:text-5xl font-black tracking-tight"
              style={{
                background: "linear-gradient(90deg, #f97316, #fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(0.4em)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
              {ROTATING_WORDS[wordIndex]}
            </span>
          </div>

          <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Launch a DAO, post bounties, run on-chain votes, and keep your treasury transparent — built for communities across Africa.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-3">
            <button
              onClick={() => handleTabChange("daos")}
              className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold px-8 py-3.5 rounded-xl text-sm tracking-widest uppercase transition-colors"
            >
              Browse DAOs →
            </button>
            <button
              onClick={() => handleTabChange("daos")}
              className="bg-orange-500 hover:bg-orange-400 text-white font-extrabold px-8 py-3.5 rounded-xl text-sm tracking-widest uppercase transition-colors"
            >
              Launch a DAO
            </button>
            <button
              onClick={() => handleTabChange("bounties")}
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-8 py-3.5 rounded-xl text-sm tracking-widest uppercase transition-colors"
            >
              View Bounties
            </button>
          </div>

          {/* Chama — subtle secondary link */}
          <p className="text-xs text-white/30 mt-4 mb-12">
            Looking for a{" "}
            <button
              onClick={() => handleTabChange("chamas")}
              className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
            >
              Chama
            </button>
            {" "}instead? We have those too.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-left"
              >
                <p className="font-bold text-white text-base">{f.title}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page subheader + tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-0">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Discover</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">DAOs & Chamas</h2>
          <p className="text-gray-500 text-sm mb-5">
            Find a DAO to join, or explore Chamas — they are different communities on Baraza
          </p>

          {/* Tabs */}
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        {activeTab === "daos" && <TopDAOs />}
        {activeTab === "chamas" && <Chamas />}
        {activeTab === "bounties" && <Bounties />}
        {activeTab === "contributors" && <Contributors />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-bold text-white">B</div>
              <span className="font-bold text-gray-900">Baraza</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              A treasury layer for groups that collect dues, take on proposals, and move funds with shared governance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-1 text-sm text-gray-500">
            <button onClick={() => handleTabChange("daos")} className="text-left hover:text-gray-800 transition-colors">Browse DAOs</button>
            <button onClick={() => handleTabChange("chamas")} className="text-left hover:text-gray-800 transition-colors">Browse Chamas</button>
            <button onClick={() => handleTabChange("daos")} className="text-left hover:text-gray-800 transition-colors">Launch a DAO</button>
            <button onClick={() => handleTabChange("chamas")} className="text-left hover:text-gray-800 transition-colors">Start a Chama</button>
            <button onClick={() => handleTabChange("contributors")} className="text-left hover:text-gray-800 transition-colors">Evaluate Best Practice</button>
            <button onClick={() => handleTabChange("daos")} className="text-left hover:text-gray-800 transition-colors">How it Works</button>
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 py-3 max-w-7xl mx-auto flex justify-between text-xs text-gray-400">
          <span>© 2025 Baraza Protocol. All rights reserved.</span>
          <span>Built for communities in Africa</span>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
