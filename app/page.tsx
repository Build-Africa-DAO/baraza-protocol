"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import TopDAOs from "./components/TopDAOs";
import Chamas from "./components/Chamas";
import Bounties from "./components/Bounties";
import Contributors from "./components/Contributors";
import NotificationBell from "./components/NotificationBell";
import { t } from "@/app/lib/i18n";

type Tab = "daos" | "chamas" | "bounties" | "contributors";

const VALID_TABS: Tab[] = ["daos", "chamas", "bounties", "contributors"];

// Rotating words keyed to i18n so Swahili is rendered
const ROTATING_KEYS = [
  "hero.rotating.fund",
  "hero.rotating.sacco",
  "hero.rotating.group",
] as const;

const FEATURE_KEYS = [
  { title: "feature.vote.title", sub: "feature.vote.sub" },
  { title: "feature.save.title", sub: "feature.save.sub" },
  { title: "feature.bounties.title", sub: "feature.bounties.sub" },
] as const;

const TABS: { id: Tab; labelKey: string }[] = [
  { id: "daos", labelKey: "tab.groups" },
  { id: "chamas", labelKey: "tab.chamas" },
  { id: "bounties", labelKey: "tab.bounties" },
  { id: "contributors", labelKey: "tab.contributors" },
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
        setWordIndex((i) => (i + 1) % ROTATING_KEYS.length);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">B</div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Baraza</span>
          </div>

          {/* Nav — desktop only */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleTabChange("daos")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("nav.about")}
            </button>
            <button
              onClick={() => handleTabChange("daos")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("nav.explore")}
            </button>
            <button
              onClick={() => handleTabChange("bounties")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("nav.bounties")}
            </button>
            <button
              onClick={() => handleTabChange("contributors")}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("nav.evaluate")}
            </button>
          </nav>

          {/* Right side — removed "Connect" wallet button (Goal 5) */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/inbox"
              className="hidden sm:block text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors min-h-[44px] flex items-center"
            >
              {t("nav.inbox")}
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-full transition-colors min-h-[44px] flex items-center"
            >
              {t("nav.profile")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "#0d0d0d" }} className="px-4 sm:px-6 pt-12 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-4">{t("hero.eyebrow")}</p>

          {/* Animated headline */}
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 leading-tight tracking-tight">
            {t("hero.headline")}
          </h1>
          <div className="h-12 sm:h-16 flex items-center justify-center mb-4 overflow-hidden">
            <span
              className="text-3xl sm:text-5xl font-black tracking-tight"
              style={{
                background: "linear-gradient(90deg, #f97316, #fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(0.4em)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
              {t(ROTATING_KEYS[wordIndex])}
            </span>
          </div>

          <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            {t("hero.sub")}
          </p>

          {/* Primary CTAs — stacked on mobile, row on sm+ */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 mb-3">
            <button
              onClick={() => handleTabChange("daos")}
              className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold px-6 py-4 rounded-xl text-sm tracking-widest uppercase transition-colors min-h-[52px]"
            >
              {t("hero.cta.browse")}
            </button>
            <button
              onClick={() => handleTabChange("daos")}
              className="bg-orange-500 hover:bg-orange-400 text-white font-extrabold px-6 py-4 rounded-xl text-sm tracking-widest uppercase transition-colors min-h-[52px]"
            >
              {t("hero.cta.start")}
            </button>
            <button
              onClick={() => handleTabChange("bounties")}
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-4 rounded-xl text-sm tracking-widest uppercase transition-colors min-h-[52px]"
            >
              {t("hero.cta.bounties")}
            </button>
          </div>

          {/* Chama link */}
          <p className="text-xs text-white/30 mt-4 mb-10">
            <button
              onClick={() => handleTabChange("chamas")}
              className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors min-h-[44px] inline-flex items-center"
            >
              {t("hero.chama.link")}
            </button>
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm sm:max-w-lg mx-auto">
            {FEATURE_KEYS.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 text-left"
              >
                <p className="font-bold text-white text-sm sm:text-base">{t(f.title)}</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1 leading-tight">{t(f.sub)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page subheader + tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">{t("section.discover.eyebrow")}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{t("section.discover.heading")}</h2>
          <p className="text-gray-500 text-sm mb-4">
            {t("section.discover.sub")}
          </p>

          {/* Tabs — scrollable on narrow screens */}
          <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-4 sm:mx-0 px-4 sm:px-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {t(tab.labelKey)}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-bold text-white">B</div>
              <span className="font-bold text-gray-900">Baraza</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-gray-500">
            <button onClick={() => handleTabChange("daos")} className="text-left hover:text-gray-800 transition-colors min-h-[44px] flex items-center">{t("footer.browse.groups")}</button>
            <button onClick={() => handleTabChange("chamas")} className="text-left hover:text-gray-800 transition-colors min-h-[44px] flex items-center">{t("footer.browse.chamas")}</button>
            <button onClick={() => handleTabChange("daos")} className="text-left hover:text-gray-800 transition-colors min-h-[44px] flex items-center">{t("footer.start.group")}</button>
            <button onClick={() => handleTabChange("chamas")} className="text-left hover:text-gray-800 transition-colors min-h-[44px] flex items-center">{t("footer.start.chama")}</button>
            <button onClick={() => handleTabChange("contributors")} className="text-left hover:text-gray-800 transition-colors min-h-[44px] flex items-center">{t("footer.evaluate")}</button>
            <button onClick={() => handleTabChange("daos")} className="text-left hover:text-gray-800 transition-colors min-h-[44px] flex items-center">{t("footer.how")}</button>
          </div>
        </div>
        <div className="border-t border-gray-100 px-4 sm:px-6 py-3 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between gap-1 text-xs text-gray-400">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.built")}</span>
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
