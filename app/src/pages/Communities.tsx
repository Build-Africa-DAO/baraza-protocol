import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/Layout";
import CommunityCard from "@/components/CommunityCard";
import { COMMUNITY_TYPES } from "@/lib/constants";
import { useCommunities } from "@/hooks/useCommunities";
import { useSeo } from "@/lib/seo";

function emptyResultTitle(search: string): string {
  const query = search.trim();
  return query ? `No groups match “${query}”` : "No groups are listed yet";
}

export default function Communities() {
  useSeo({
    title: "Find a community",
    description:
      "Find a chama, SACCO, cooperative, association, or community group that fits how you want to save, work, and make decisions together.",
    path: "/communities",
  });

  const { communities, isLoading, error } = useCommunities();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState("all");

  const typeLabels = new Map(COMMUNITY_TYPES.map((type) => [type.value, type.label]));
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = communities.filter((community) => {
    const label = typeLabels.get(community.type) ?? community.type;
    const matchesSearch =
      !normalizedSearch ||
      community.name.toLowerCase().includes(normalizedSearch) ||
      community.description.toLowerCase().includes(normalizedSearch) ||
      label.toLowerCase().includes(normalizedSearch);
    const matchesType = typeFilter === "all" || community.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const hasActiveFilter = Boolean(normalizedSearch) || typeFilter !== "all";

  return (
    <Layout>
      <div className="pb-20">
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Find your people</p>
              <h1 className="mt-2 max-w-[22ch] text-balance font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Join a group that works the way you do.
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
                Compare what each community does, how members contribute, and which decisions are
                open. You can look around before asking to join.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="flex flex-col gap-3 border-b border-border/60 pb-6 lg:flex-row lg:items-end">
            <label className="block flex-1">
              <span className="mb-2 block text-sm font-semibold text-foreground">Search groups</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSearch(next);
                    const params = new URLSearchParams(searchParams);
                    if (next.trim()) params.set("q", next);
                    else params.delete("q");
                    setSearchParams(params, { replace: true });
                  }}
                  placeholder="Name, purpose, or type of group"
                  className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </span>
            </label>

            <label className="block lg:w-72">
              <span className="mb-2 block text-sm font-semibold text-foreground">Type of group</span>
              <span className="relative block">
                <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-card py-3 pl-10 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All community types</option>
                  {COMMUNITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <Link
              to="/create"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Plus className="h-4 w-4" />
              Start a group
            </Link>
          </div>

          <div className="flex min-h-12 items-center justify-between gap-4 py-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isLoading
                ? "Loading groups…"
                : `${filtered.length} ${filtered.length === 1 ? "group" : "groups"} available`}
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setSearchParams({}, { replace: true });
                }}
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-destructive/35 bg-destructive/8 p-4" role="alert">
              <p className="font-semibold text-foreground">Groups could not be loaded.</p>
              <p className="mt-1 text-sm text-muted-foreground">Check your connection and refresh the page.</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-border/60 bg-card">
                  <div className="h-36 bg-muted" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-2/3 rounded bg-muted" />
                    <div className="h-12 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map((community) => (
                <CommunityCard
                  key={community.id}
                  {...community}
                  typeLabel={typeLabels.get(community.type) ?? "Community group"}
                />
              ))}
            </div>
          ) : (
            <div className="border-y border-border/60 py-14 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">{emptyResultTitle(search)}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try another name or group type, or start a group that is not represented yet.
              </p>
              <Link to="/create" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Start a new group <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
