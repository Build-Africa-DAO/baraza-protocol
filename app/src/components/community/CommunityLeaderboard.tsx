import { Sparkles, Star, Trophy, Zap } from 'lucide-react';
import { getBountiesForCommunity } from '@/lib/bounties';
import { cn } from '@/lib/utils';

interface ContributorStat {
  name: string;
  bountiesCompleted: number;
  totalEarned: number;
  reputation: number;
}

function buildLeaderboard(communityId: string): ContributorStat[] {
  const bounties = getBountiesForCommunity(communityId);
  const statsMap = new Map<string, ContributorStat>();

  for (const b of bounties) {
    if ((b.status === 'awarded' || b.status === 'paid') && b.assignee) {
      const existing = statsMap.get(b.assignee) ?? {
        name: b.assignee,
        bountiesCompleted: 0,
        totalEarned: 0,
        reputation: 0,
      };
      existing.bountiesCompleted += 1;
      existing.totalEarned += b.rewardKes;
      statsMap.set(b.assignee, existing);
    }
  }

  // Compute reputation score: completions × 10 + earnings / 1000
  const stats = [...statsMap.values()].map((s) => ({
    ...s,
    reputation: s.bountiesCompleted * 10 + Math.floor(s.totalEarned / 1000),
  }));

  return stats.sort((a, b) => b.reputation - a.reputation);
}

const MEDAL_STYLES = [
  'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]',
  'border-[#C0C0C0]/60 bg-[#C0C0C0]/10 text-[#C0C0C0]',
  'border-[#CD7F32]/60 bg-[#CD7F32]/10 text-[#CD7F32]',
];

interface Props {
  communityId: string;
}

export default function CommunityLeaderboard({ communityId }: Props) {
  const leaders = buildLeaderboard(communityId);
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  // No real awarded/paid bounty contributors yet — show an honest empty state
  // instead of seeded names. Fake activity erodes the "witnessed standing"
  // signal that the badge system is supposed to carry.
  if (leaders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="baraza-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            <h3 className="font-display text-base font-semibold">Top contributors</h3>
            <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
              By reputation
            </span>
          </div>
          <div className="rounded-xl border border-dashed p-8 text-center">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full border">
              <Sparkles className="h-4 w-4 text-secondary" />
            </div>
            <p className="font-display text-base font-semibold">
              No contributors ranked yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              The leaderboard fills when bounties are awarded and paid. Be the first —
              complete an open bounty and your name lands here.
            </p>
          </div>
        </div>

        <div className="baraza-card p-4">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">
            How reputation is scored
          </p>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            {[
              ['Bounty completed', '+10 rep', 'Per awarded / paid task'],
              ['Local currency earned', '+1 rep / 1,000', 'From confirmed payouts'],
              ['Governance vote', '+2 rep (coming soon)', 'Participating in proposals'],
            ].map(([action, score, note]) => (
              <div key={action} className="rounded-lg border border-border/50 p-3">
                <p className="font-semibold text-foreground">{action}</p>
                <p className="text-primary font-bold mt-0.5">{score}</p>
                <p className="text-muted-foreground mt-0.5 text-[10px]">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className="baraza-card p-5">
        <div className="mb-5 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-secondary" />
          <h3 className="font-display text-base font-semibold">Top contributors</h3>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">By reputation</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {top3.map((c, i) => (
            <div
              key={c.name}
              className={cn(
                'relative rounded-xl border p-4 text-center transition-all',
                MEDAL_STYLES[i] ?? 'border-border/60',
              )}
            >
              {i === 0 && (
                <Star className="absolute right-3 top-3 h-3.5 w-3.5 text-[#FFD700] fill-[#FFD700]" />
              )}
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-current text-sm font-bold">
                {i + 1}
              </div>
              <p className="font-display text-sm font-bold text-foreground">{c.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.bountiesCompleted} {c.bountiesCompleted === 1 ? 'bounty' : 'bounties'}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="text-xs font-bold tabular-nums">{c.reputation} rep</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full table */}
      {rest.length > 0 && (
        <div className="baraza-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Contributor</th>
                <th className="px-4 py-3 text-right">Bounties</th>
                <th className="px-4 py-3 text-right">Reputation</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((c, i) => (
                <tr key={c.name} className="border-b last:border-0 hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 4}</td>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{c.bountiesCompleted}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold tabular-nums">
                      <Zap className="h-3 w-3 text-accent" />
                      {c.reputation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Scoring legend */}
      <div className="baraza-card p-4">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">
          How reputation is scored
        </p>
        <div className="grid gap-2 sm:grid-cols-3 text-xs">
          {[
            ['Bounty completed', '+10 rep', 'Per awarded / paid task'],
            ['Local currency earned', '+1 rep / 1,000', 'From confirmed payouts'],
            ['Governance vote', '+2 rep (coming soon)', 'Participating in proposals'],
          ].map(([action, score, note]) => (
            <div key={action} className="rounded-lg border border-border/50 p-3">
              <p className="font-semibold text-foreground">{action}</p>
              <p className="text-primary font-bold mt-0.5">{score}</p>
              <p className="text-muted-foreground mt-0.5 text-[10px]">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
