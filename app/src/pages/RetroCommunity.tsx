import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Coins, RefreshCw, Sparkles, Vote, Trophy } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Layout from '@/components/Layout';
import { useSeo } from '@/lib/seo';
import { useCommunities } from '@/hooks/useCommunities';

interface ActiveRound {
  id: string;
  community_id: string;
  period_start: string;
  period_end: string;
  voting_closes_at: string;
  pool_brza: number;
  status: 'open' | 'voting' | 'allocated' | 'settled';
  opened_by: string | null;
}

interface RoundResponse {
  active?: ActiveRound | null;
  round?: ActiveRound;
  status?: string;
  error?: string;
  message?: string;
}

function formatBrza(n: number): string {
  return `${n.toLocaleString('en-KE')} BRZA`;
}

function formatRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'closed';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 48) return `${Math.floor(hours / 24)}d left`;
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.floor(ms / (60 * 1000));
  return `${minutes}m left`;
}

function truncate(addr: string): string {
  if (!addr) return '';
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function RetroCommunity() {
  const { communityId = '' } = useParams<{ communityId: string }>();
  useSeo({
    title: 'Retro round',
    description: 'Weekly retroactive BRZA distribution for this community.',
  });

  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const memberWallet = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const { communities } = useCommunities();
  const community = useMemo(
    () => communities.find((c) => c.id === communityId) ?? null,
    [communities, communityId],
  );

  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActive = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/communities/retro-rounds?communityId=${encodeURIComponent(communityId)}`,
      );
      const json = (await res.json()) as RoundResponse;
      if (!res.ok) {
        setError(json.error ?? `Read failed (${res.status}).`);
        return;
      }
      setActiveRound(json.active ?? null);
      setStatusNote(json.status ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    void loadActive();
  }, [loadActive]);

  const openRound = useCallback(async () => {
    if (!memberWallet || !communityId) return;
    setOpening(true);
    setError(null);
    try {
      const res = await fetch('/api/communities/retro-rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Member-Wallet': memberWallet,
        },
        body: JSON.stringify({ communityId }),
      });
      const json = (await res.json()) as RoundResponse;
      if (!res.ok) {
        setError(json.message ?? json.error ?? `Open failed (${res.status}).`);
        return;
      }
      if (json.round) setActiveRound(json.round);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setOpening(false);
    }
  }, [memberWallet, communityId]);

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Retro round · {community?.name ?? communityId}
          </p>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Weekly BRZA distribution
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Each week, members recognise each other's contribution and the pool distributes BRZA
            accordingly. Any active member of this community can open the next round.
          </p>
        </header>

        {statusNote ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700">
            {statusNote}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Active round
          </h2>

          {activeRound ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    Pool
                  </p>
                  <p className="text-xl font-display font-black tabular-nums">
                    {formatBrza(activeRound.pool_brza)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    Voting
                  </p>
                  <p className="text-sm font-medium">
                    {formatRemaining(activeRound.voting_closes_at)}
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  Status:{' '}
                  <span className="capitalize text-foreground font-medium">{activeRound.status}</span>
                </p>
                {activeRound.opened_by ? (
                  <p>Opened by {truncate(activeRound.opened_by)}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Link
                  to={`/retro/${communityId}/vote`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Vote className="h-4 w-4" />
                  Cast a vote
                </Link>
                <Link
                  to={`/retro/${communityId}/results`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground"
                >
                  <Trophy className="h-4 w-4" />
                  See latest results
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No round is open right now. Any active member can open the next one.
              </p>
              {!connected ? (
                <button
                  type="button"
                  onClick={() => setVisible(true)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Connect to open a round
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void openRound()}
                  disabled={opening || !communityId}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {opening ? 'Opening…' : 'Open this week’s round'}
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Period defaults to the past 7 days. Voting closes 48 hours after the period end. Pool
                is sized from this community's share of the protocol monthly emission.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void loadActive()}
            disabled={loading}
            className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 inline-flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>
    </Layout>
  );
}
