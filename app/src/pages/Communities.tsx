import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, PlusCircle, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import CommunityCard from '@/components/CommunityCard';
import { MOCK_COMMUNITIES, COMMUNITY_TYPES } from '@/lib/constants';

const Communities: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = MOCK_COMMUNITIES.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-2xl md:text-3xl font-bold text-foreground"
              >
                Communities
              </motion.h1>
              <p className="text-sm text-muted-foreground mt-1">
                Find a group to join or explore what communities are doing
              </p>
            </div>
            <Link to="/create" className="btn-warm flex items-center gap-2 text-sm">
              <PlusCircle className="w-4 h-4" />
              Start a Group
            </Link>
          </div>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search communities..."
                className="w-full bg-surface rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-surface rounded-xl pl-10 pr-8 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border cursor-pointer"
              >
                <option value="all">All Types</option>
                {COMMUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((community, idx) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <CommunityCard {...community} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="baraza-card p-10 text-center">
              <p className="text-muted-foreground text-sm">No communities found matching your search.</p>
              <Link to="/create" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                <PlusCircle className="w-4 h-4" /> Create One
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Communities;
