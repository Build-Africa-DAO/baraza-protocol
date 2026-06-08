import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Grid2X2, List, Search, PlusCircle, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/Layout";
import CommunityCard from "@/components/CommunityCard";
import { COMMUNITY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCommunities } from "@/hooks/useCommunities";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";


function emptyResultTitle(search: string): string {
  const q = search.trim();
  if (q) return `No communities match "${q}"`;
  return "No groups yet";
}

function emptyResultDescription(search: string): string {
  const q = search.trim();
  if (q) return "Try a different search term or clear the filters, or launch your own group.";
  return "Be the first - launch your own group and start governing funds with Baraza.";
}

export default function Communities() {
  useSeo({
    title: "Browse groups",
    description:
      "Discover groups and communities on Baraza. Filter by setup model to find a group to join or evaluate.",
    path: "/communities",
  });
  const { communities, isLoading, error } = useCommunities();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const filtered = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const hasActiveFilter = !!search || typeFilter !== "all";

  return (
    <Layout>
      {/* Page header */}
      <section className="relative pt-20 pb-8 overflow-hidden sm:pt-28 sm:pb-12">
        <div className="container mx-auto px-4 relative z-10">
          <CommunityBanner className="mb-8 min-h-[20rem]" communities={communities}>
            <div className="max-w-2xl p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2">
              Discover
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Groups &amp; Communities
            </h1>
            <p>
              Find a group to join, or explore how communities are governing shared funds with Baraza.
            </p>
          </div>
          </CommunityBanner>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 rounded-lg border border-border/70 bg-card/55 p-3 md:p-4">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Browse groups
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payment rails are configured inside join, onramp, and offramp flows.
            </p>
          </div>

          {/* Controls */}
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            {/* Search — full width, always first */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearch(next);
                  const params = new URLSearchParams(searchParams);
                  if (next.trim()) params.set("q", next);
                  else params.delete("q");
                  setSearchParams(params, { replace: true });
                }}
                placeholder="Search by name"
                className={cn(
                  "w-full rounded-lg border border-border/70 bg-background/60",
                  "pl-10 pr-4 py-3 text-sm",
                  "outline-none",
                )}
                aria-label="Search communities"
              />
            </div>

            {/* Filter row: type selector + layout toggle side-by-side on mobile */}
            <div className="flex gap-3">
              {/* Type filter */}
              <div className="relative flex-1 lg:flex-none">
                <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={cn(
                    "w-full appearance-none rounded-lg border border-border/70 bg-background/60",
                    "pl-10 pr-8 py-3 text-sm",
                    "outline-none cursor-pointer",
                    "lg:min-w-[180px]",
                  )}
                  aria-label="Filter by type"
                >
                  <option value="all">All types</option>
                  {COMMUNITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 rounded-lg border border-border/70 bg-background/60 p-1 shrink-0" aria-label="Choose layout">
                {[
                  { value: "grid" as const, label: "Grid", icon: Grid2X2 },
                  { value: "list" as const, label: "List", icon: List },
                ].map(({ value, label, icon: Icon }) => {
                  const active = layout === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLayout(value)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2",
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch CTA — full width on mobile */}
            <Link
              to="/create"
              className="text-sm font-bold px-5 py-3 rounded-lg whitespace-nowrap inline-flex items-center justify-center gap-2 border border-border/70 hover:border-primary/50 transition-colors lg:justify-start"
            >
              <PlusCircle className="w-4 h-4" />
              Launch a group
            </Link>
          </div>
          </div>

          {error && (
            <div className="baraza-card p-4 mb-5">
              <p className="text-sm">We couldn&apos;t load groups right now.</p>
              <p className="text-xs mt-1">Check your connection and refresh.</p>
            </div>
          )}

          {/* Results count */}
          {isLoading ? (
            <p className="text-xs mb-5">Loading groups...</p>
          ) : hasActiveFilter && filtered.length > 0 ? (
            <p className="text-xs mb-5">
              {filtered.length} {filtered.length === 1 ? "community" : "communities"} found
            </p>
          ) : null}

          {/* Grid */}
          {isLoading ? (
            <div className={cn(layout === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-4")}>
              {Array.from({ length: 4 }).map((_, idx) => (
                layout === "grid" ? (
                  <div key={idx} className="baraza-card animate-pulse p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-5/6 rounded bg-muted" />
                      <div className="h-3 w-2/3 rounded bg-muted" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="space-y-1">
                          <div className="h-5 w-full rounded bg-muted" />
                          <div className="h-2.5 w-3/4 rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                    <div className="h-9 w-full rounded-lg bg-muted" />
                  </div>
                ) : (
                  <div key={idx} className="baraza-card animate-pulse p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-48 rounded bg-muted" />
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-3/4 rounded bg-muted" />
                        <div className="flex gap-4 pt-1">
                          <div className="h-3 w-20 rounded bg-muted" />
                          <div className="h-3 w-20 rounded bg-muted" />
                          <div className="h-3 w-20 rounded bg-muted" />
                        </div>
                      </div>
                      <div className="h-9 w-28 rounded-lg bg-muted flex-shrink-0" />
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className={cn(layout === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-4")}>
              {filtered.map((community) => (
                <div
                  key={community.id}
                  className="h-full"
                >
                  <CommunityCard {...community} layout={layout} />
                </div>
              ))}
            </div>
          ) : (
            <div className="baraza-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-display text-base font-semibold mb-1">
                {emptyResultTitle(search)}
              </p>
              <p className="text-sm mb-6">
                {emptyResultDescription(search)}
              </p>
              <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-sm">
                <PlusCircle className="w-4 h-4" /> Launch a group
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
