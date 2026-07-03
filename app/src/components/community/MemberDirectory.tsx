import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, Users, Shield, ShieldCheck,
  Calendar, PiggyBank, Vote, FileText, TrendingUp, Clock,
  ArrowUpDown, X
} from 'lucide-react';
import { useMembers } from '@/hooks/useBarazaData';
import { formatRailAmountFromKes, formatRailDate } from '@/lib/utils';
import type { Member, Contribution } from '@/lib/dataStore';
import { useChain } from '@/hooks/useChain';
import { DuesStreakChip } from '@/components/DuesStreakChip';
import { fetchDuesStreakBatch, type StreakResult } from '@/lib/duesStreak';

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  founder: { label: 'Founder', icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/15' },
  admin: { label: 'Admin', icon: Shield, color: 'text-primary', bg: 'bg-primary/15' },
  member: { label: 'Member', icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const contribTypeConfig: Record<string, { label: string; color: string }> = {
  membership: { label: 'Membership', color: 'text-accent' },
  monthly: { label: 'Monthly', color: 'text-primary' },
  extra: { label: 'Extra', color: 'text-secondary' },
};

type SortField = 'name' | 'joined' | 'contributed' | 'activity';

interface MemberDirectoryProps {
  communityId: string;
  /** Authoritative member count from the community record (may exceed the
   * number of locally-seeded member profiles). Shown as "Total Members". */
  totalCount?: number;
}

// ---------- Contribution row ----------

const ContributionRow: React.FC<{ contribution: Contribution }> = ({ contribution }) => {
  const { chainMeta } = useChain();
  const config = contribTypeConfig[contribution.type] || contribTypeConfig.monthly;
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface/30 transition-colors">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <PiggyBank className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{formatRailAmountFromKes(contribution.amount, chainMeta)}</span>
          <span className={`text-[10px] font-medium ${config.color} px-1.5 py-0.5 rounded-full bg-surface`}>
            {config.label}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{contribution.note}</p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {formatRailDate(contribution.timestamp, chainMeta, { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
};

// ---------- Member card (expanded) ----------

const MemberCard: React.FC<{ member: Member; isExpanded: boolean; onToggle: () => void; streakMonths?: number }> = ({
  member,
  isExpanded,
  onToggle,
  streakMonths,
}) => {
  const { chainMeta } = useChain();
  const role = roleConfig[member.role] || roleConfig.member;
  const RoleIcon = role.icon;
  const [showAllContribs, setShowAllContribs] = useState(false);

  const visibleContribs = showAllContribs ? member.contributions : member.contributions.slice(0, 5);

  return (
    <motion.div
      layout
      className="baraza-card overflow-hidden"
    >
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface/30 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="font-display text-sm font-bold text-primary">
            {member.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground truncate">{member.name}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${role.bg} ${role.color}`}>
              <RoleIcon className="w-2.5 h-2.5" />
              {role.label}
            </span>
            <DuesStreakChip streakMonths={streakMonths} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              Joined {timeAgo(member.joinedAt)}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-accent">
              <PiggyBank className="w-2.5 h-2.5" />
              {formatRailAmountFromKes(member.totalContributed, chainMeta)}
            </span>
          </div>
        </div>

        {/* Stats + chevron */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs font-semibold text-foreground tabular-nums">{member.votesCount}</p>
            <p className="text-[9px] text-muted-foreground">Votes</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-foreground tabular-nums">{member.contributionCount}</p>
            <p className="text-[9px] text-muted-foreground">Payments</p>
          </div>
        </div>

        <div className="flex-shrink-0 ml-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-5">
                <div className="bg-surface rounded-lg p-3 text-center">
                  <PiggyBank className="w-4 h-4 text-accent mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground tabular-nums">{formatRailAmountFromKes(member.totalContributed, chainMeta)}</p>
                  <p className="text-[9px] text-muted-foreground">Total Contributed</p>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground tabular-nums">{member.contributionCount}</p>
                  <p className="text-[9px] text-muted-foreground">Payments Made</p>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <Vote className="w-4 h-4 text-secondary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground tabular-nums">{member.votesCount}</p>
                  <p className="text-[9px] text-muted-foreground">Votes Cast</p>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <FileText className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground tabular-nums">{member.proposalsCount}</p>
                  <p className="text-[9px] text-muted-foreground">Proposals Made</p>
                </div>
              </div>

              {/* Last active */}
              <div className="flex items-center gap-2 mb-4 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last contribution: {timeAgo(member.lastContributionAt)}
              </div>

              {/* Contribution history */}
              <div>
                <h4 className="font-display text-xs font-semibold text-foreground mb-2">Contribution History</h4>
                <div className="space-y-0.5">
                  {visibleContribs.map((c) => (
                    <ContributionRow key={c.id} contribution={c} />
                  ))}
                </div>
                {member.contributions.length > 5 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllContribs(!showAllContribs);
                    }}
                    className="mt-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {showAllContribs
                      ? 'Show less'
                      : `Show all ${member.contributions.length} contributions`}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------- Main directory ----------

const MemberDirectory: React.FC<MemberDirectoryProps> = ({ communityId, totalCount }) => {
  const { chainMeta } = useChain();
  const members = useMembers(communityId);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('contributed');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'founder' | 'admin' | 'member'>('all');

  // Batched dues-streak fetch — one round trip for all visible members.
  // Witnessed standing — chama culture surfaces, not just self-view.
  const [streaksByWallet, setStreaksByWallet] = useState<Record<string, StreakResult>>({});
  useEffect(() => {
    const wallets = members.map((m) => m.walletKey).filter((w): w is string => !!w);
    if (wallets.length === 0) { setStreaksByWallet({}); return; }
    let cancelled = false;
    fetchDuesStreakBatch(wallets)
      .then((result) => { if (!cancelled) setStreaksByWallet(result); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [members]);

  const filtered = useMemo(() => {
    const result = members.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'joined':
          cmp = a.joinedAt - b.joinedAt;
          break;
        case 'contributed':
          cmp = a.totalContributed - b.totalContributed;
          break;
        case 'activity':
          cmp = a.lastContributionAt - b.lastContributionAt;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [members, search, sortField, sortAsc, roleFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Aggregate stats
  const totalContributed = members.reduce((sum, m) => sum + m.totalContributed, 0);
  const avgContribution = members.length > 0 ? Math.round(totalContributed / members.length) : 0;
  const founders = members.filter((m) => m.role === 'founder').length;
  const admins = members.filter((m) => m.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="baraza-card p-3 text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-foreground tabular-nums">{totalCount ?? members.length}</p>
          <p className="text-[9px] text-muted-foreground">Total Members</p>
        </div>
        <div className="baraza-card p-3 text-center">
          <PiggyBank className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-foreground tabular-nums">{formatRailAmountFromKes(totalContributed, chainMeta)}</p>
          <p className="text-[9px] text-muted-foreground">Total Contributed</p>
        </div>
        <div className="baraza-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-secondary mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-foreground tabular-nums">{formatRailAmountFromKes(avgContribution, chainMeta)}</p>
          <p className="text-[9px] text-muted-foreground">Avg per Member</p>
        </div>
        <div className="baraza-card p-3 text-center">
          <ShieldCheck className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-foreground tabular-nums">{founders + admins}</p>
          <p className="text-[9px] text-muted-foreground">Leaders</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-surface rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'founder', 'admin', 'member'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                roleFilter === role
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-surface text-muted-foreground border-border hover:border-primary/20'
              }`}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <ArrowUpDown className="w-3 h-3" />
        <span>Sort by:</span>
        {([
          { field: 'contributed' as SortField, label: 'Contribution' },
          { field: 'joined' as SortField, label: 'Join Date' },
          { field: 'name' as SortField, label: 'Name' },
          { field: 'activity' as SortField, label: 'Last Active' },
        ]).map((opt) => (
          <button
            key={opt.field}
            onClick={() => handleSort(opt.field)}
            className={`px-2 py-1 rounded-md transition-all ${
              sortField === opt.field
                ? 'bg-primary/15 text-primary font-semibold'
                : 'hover:bg-surface text-muted-foreground'
            }`}
          >
            {opt.label}
            {sortField === opt.field && (sortAsc ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      {/* Member list */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            >
              <MemberCard
                member={member}
                isExpanded={expandedId === member.id}
                onToggle={() => setExpandedId(expandedId === member.id ? null : member.id)}
                streakMonths={streaksByWallet[member.walletKey]?.consecutiveMonthsPaid}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="baraza-card p-8 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? 'No members matching your search.' : 'No members yet.'}
          </p>
        </div>
      )}

      {/* Count label */}
      {filtered.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Showing {filtered.length} of {members.length} members
        </p>
      )}
    </div>
  );
};

export default MemberDirectory;
