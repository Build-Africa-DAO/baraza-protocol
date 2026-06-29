import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coins, RefreshCw, Trophy } from 'lucide-react';
import Layout from '@/components/Layout';
import { useSeo } from '@/lib/seo';
import { truncateAddress } from '@/lib/utils';

interface Round {
  id: string;
  community_id: string;
  period_start: string;
  period_end: string;
  pool_brza: number;
  status: 'open' | 'voting' | 'allocated' | 'settled';
  voting_closes_at: string;
}

interface Allocation {
  recipient_wallet: string;
  brza_allocated: number;
  baseline_brza: number;
  multiplier_brza: number;
  vote_share: number;
  settlement_status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  settlement_tx: string | null;
}

interface ResultsResponse {
  round: Round | null;
  allocations: Allocation[];
  status?: string;
}

function formatBrza(n: number): string {
  return `${n.toLocaleString('en-KE')} BRZA`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
  } catch {
    return iso;
  }
}

export default function RetroResults() {
  const { communityId = '' } = useParams<{ communityId: string }>();
  useSeo({
    title: 'Retro round results',
    description: 'BRZA allocations from the most recently settled retro round.',
  });

  const [round, setRound] = useState<Round | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/communities/retro-allocations?communityId=${encodeURIComponent(communityId)}`,
      );
      const json = (await res.json()) as ResultsResponse;
      if (!res.ok) {
        setError(`Read failed (${res.status}).`);
        return;
      }
      setRound(json.round);
      setAllocations(json.allocations);
      setStatusNote(json.status ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Retro round · results
          </p>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Most recent settlement
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Members allocated weights across each other; the round settled into BRZA distributions
            for everyone who showed up.
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

        {!round && !loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
            <Coins className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No settled rounds yet.</p>
            <p className="text-xs text-muted-foreground">
              When the first round closes voting and settles, results land here.
            </p>
          </div>
        ) : null}

        {round ? (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Period
                </p>
                <p className="text-sm font-medium">
                  {formatDate(round.period_start)} → {formatDate(round.period_end)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Pool
                </p>
                <p className="text-xl font-display font-black tabular-nums">
                  {formatBrza(round.pool_brza)}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                <span>Allocations · {allocations.length}</span>
                <span>
                  Status: <span className="capitalize text-foreground">{round.status}</span>
                </span>
              </div>
              {allocations.length > 0 ? (() => {
                const confirmed = allocations.filter((a) => a.settlement_status === 'confirmed').length;
                const submitted = allocations.filter((a) => a.settlement_status === 'submitted').length;
                const pending = allocations.filter((a) => a.settlement_status === 'pending').length;
                const failed = allocations.filter((a) => a.settlement_status === 'failed').length;
                return (
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {confirmed > 0 && (
                      <span className="rounded-full border border-confirmed/40 bg-confirmed/10 px-2 py-0.5 text-confirmed">
                        {confirmed} confirmed
                      </span>
                    )}
                    {submitted > 0 && (
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
                        {submitted} submitted
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="rounded-full border border-muted-foreground/40 bg-surface px-2 py-0.5 text-muted-foreground">
                        {pending} pending
                      </span>
                    )}
                    {failed > 0 && (
                      <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-destructive">
                        {failed} failed
                      </span>
                    )}
                  </div>
                );
              })() : null}
              {allocations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No allocations recorded.</p>
              ) : (
                <ol className="divide-y divide-border">
                  {allocations.map((a, i) => (
                    <li key={a.recipient_wallet} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono w-5 text-right">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {truncateAddress(a.recipient_wallet)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            baseline {formatBrza(a.baseline_brza)} + vote share{' '}
                            {Math.round(a.vote_share * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatBrza(a.brza_allocated)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                          {a.settlement_status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void load()}
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
