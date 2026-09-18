import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { InitialsTile, ListRow } from '@/components/app/ListRow';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/field';
import { StatusChip } from '@/components/ui/status-chip';
import { useOptionalAccount } from '@/contexts/AccountContext';
import { useMembers } from '@/hooks/useBarazaData';
import { useUserAvatar } from '@/lib/imageUpload';
import { formatAccountDate } from '@/lib/accountLocale';
import { fetchDuesStreakBatch, type StreakResult } from '@/lib/duesStreak';
import { formatMajor } from '@/lib/money';
import type { Member } from '@/lib/dataStore';

/**
 * §13.17 People — who belongs to this group.
 *
 * Rows, four filters, tap to expand the last contributions. Officers see dues
 * standing (Active / Overdue) and the Overdue filter; members see names and
 * roles. No aggregate tiles, no CSV here (statements live in Settings), no
 * placeholder streak chips: a streak shows only when the server has one.
 */
type PeopleFilter = 'all' | 'active' | 'pending' | 'overdue';

const OVERDUE_AFTER_MS = 40 * 24 * 60 * 60 * 1000;

interface MemberDirectoryProps {
  communityId: string;
  currency?: string;
  isOfficer?: boolean;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase() || 'M';
}

function roleLabel(role: Member['role']): string | null {
  if (role === 'founder') return 'Founder';
  if (role === 'admin') return 'Officer';
  return null;
}

export default function MemberDirectory({ communityId, currency, isOfficer = false }: MemberDirectoryProps) {
  const account = useOptionalAccount();
  const { avatarUrl } = useUserAvatar();
  const isSelf = (name: string) => Boolean(account) && name.trim().toLowerCase() === (account?.displayName ?? '').trim().toLowerCase();
  const members = useMembers(communityId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PeopleFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [streaks, setStreaks] = useState<Record<string, StreakResult>>({});

  useEffect(() => {
    const wallets = members.map((m) => m.walletKey).filter((w): w is string => Boolean(w));
    if (wallets.length === 0) return;
    let cancelled = false;
    fetchDuesStreakBatch(wallets)
      .then((result) => {
        if (!cancelled) setStreaks(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [members]);

  const isOverdue = (member: Member) => member.status === 'active' && now - member.lastContributionAt > OVERDUE_AFTER_MS;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members
      .filter((m) => (term ? m.name.toLowerCase().includes(term) : true))
      .filter((m) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return m.status !== 'active';
        if (filter === 'overdue') return isOverdue(m);
        return m.status === 'active' && !isOverdue(m);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, search, filter, now]);

  const options = [
    { key: 'all' as const, label: 'All', count: members.length },
    { key: 'active' as const, label: 'Active' },
    { key: 'pending' as const, label: 'Pending' },
    ...(isOfficer ? [{ key: 'overdue' as const, label: 'Overdue', count: members.filter(isOverdue).length }] : []),
  ];

  if (members.length === 0) {
    return (
      <EmptyState
        title="Member List Not Available Yet"
        body="Baraza does not share the group roster with the app yet. Members are still counted and can still pay and vote; the list appears here once the roster is exposed."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
          aria-label="Search members"
          className="pl-9"
        />
      </div>

      <FilterChips options={options} value={filter} onChange={setFilter} aria-label="Member filters" />

      {filtered.length === 0 ? (
        <EmptyState title="No One Matches" body="Try a different name or clear the filter." secondary={{ label: 'Clear Search', onClick: () => { setSearch(''); setFilter('all'); } }} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((member) => {
            const role = roleLabel(member.role);
            const streak = streaks[member.walletKey]?.consecutiveMonthsPaid ?? 0;
            const expanded = expandedId === member.id;
            return (
              <li key={member.id} className="space-y-2">
                <ListRow
                  title={member.name}
                  meta={`Joined ${formatAccountDate(member.joinedAt, undefined, { month: 'short', year: 'numeric' })}`}
                  leading={<InitialsTile initials={initialsOf(member.name)} image={isSelf(member.name) ? avatarUrl : null} />}
                  onClick={() => setExpandedId(expanded ? null : member.id)}
                  aria-label={`${member.name}, ${expanded ? 'hide' : 'show'} contributions`}
                  trailing={
                    <>
                      {role ? <StatusChip kind="info" icon={null} label={role} /> : null}
                      {streak > 0 ? <StatusChip kind="confirmed" label={`${streak} ${streak === 1 ? 'Month' : 'Months'} On Time`} /> : null}
                      {isOfficer && member.status === 'active' ? (
                        isOverdue(member) ? <StatusChip kind="hold" label="Overdue" /> : <StatusChip kind="confirmed" label="Active" />
                      ) : null}
                      {member.status !== 'active' ? <StatusChip kind="pending" label="Pending" /> : null}
                    </>
                  }
                />
                {expanded ? <Contributions member={member} currency={currency} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Contributions({ member, currency }: { member: Member; currency?: string }) {
  const recent = [...member.contributions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  return (
    <div className="ml-4 border-l border-border pl-4" role="region" aria-label={`Contributions from ${member.name}`}>
      {recent.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No contributions recorded yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((contribution) => (
            <li key={contribution.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{contribution.note || (contribution.type === 'membership' ? 'Activation' : contribution.type === 'monthly' ? 'Monthly dues' : 'Extra contribution')}</p>
                <p className="text-xs text-muted-foreground">{formatAccountDate(contribution.timestamp, undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className="shrink-0 font-display text-sm font-bold tabular-nums">{formatMajor(contribution.amount, currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
