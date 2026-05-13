import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, PlusCircle, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/Layout";
import CommunityCard from "@/components/CommunityCard";
import { COMMUNITY_TYPES } from "@/lib/constants";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { useCommunities } from "@/hooks/useCommunities";

export default function Communities() {
  const { communities, isLoading, error } = useCommunities();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      {/* Page header */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-primary/6 blur-[80px] rounded-full" />
          <DotPattern
            width={24}
            height={24}
            cr={1}
            className="fill-primary/6 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Discover
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Community DAOs
            </h1>
            <p className="text-muted-foreground">
              Find a DAO to join, or explore how communities are governing funds with Baraza.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
                className={cn(
                  "w-full bg-surface border border-border rounded-xl",
                  "pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
                  "outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all",
                )}
                aria-label="Search communities"
              />
            </div>

            {/* Type filter */}
            <div className="relative flex-shrink-0">
              <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={cn(
                  "appearance-none bg-surface border border-border rounded-xl",
                  "pl-10 pr-8 py-3 text-sm text-foreground",
                  "outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer transition-all",
                  "min-w-[160px]",
                )}
                aria-label="Filter by type"
              >
                <option value="all">All Types</option>
                {COMMUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Start CTA */}
            <Link to="/create" tabIndex={-1}>
              <ShimmerButton
                background="linear-gradient(135deg, hsl(44,100%,50%), hsl(33,97%,49%))"
                shimmerColor="rgba(255,255,255,0.5)"
                className="text-sm font-bold px-5 py-3 rounded-xl whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Create a DAO
              </ShimmerButton>
            </Link>
          </div>

          {error && (
            <div className="baraza-card p-4 mb-5 border-destructive/40">
              <p className="text-sm text-destructive">We couldn&apos;t load Community DAOs right now.</p>
              <p className="text-xs text-muted-foreground mt-1">Check your connection and refresh.</p>
            </div>
          )}

          {/* Results count */}
          {isLoading ? (
            <p className="text-xs text-muted-foreground mb-5">Loading Community DAOs…</p>
          ) : search || typeFilter !== "all" ? (
            <p className="text-xs text-muted-foreground mb-5">
              {filtered.length} {filtered.length === 1 ? "community" : "communities"} found
            </p>
          ) : null}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="baraza-card h-64 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((community, idx) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.35 }}
                  className="h-full"
                >
                  <CommunityCard {...community} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="baraza-card p-12 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <p className="font-display text-base font-semibold text-foreground mb-1">
                No DAOs match that filter yet
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Try a different type, or start your own Community DAO.
              </p>
              <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-sm">
                <PlusCircle className="w-4 h-4" /> Create a Community DAO
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
