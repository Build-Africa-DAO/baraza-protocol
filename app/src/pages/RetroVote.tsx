import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Coins, RefreshCw, Send, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Layout from '@/components/Layout';
import { useSeo } from '@/lib/seo';
import { truncateAddress } from '@/lib/utils';
import { validateBallot } from '@/lib/brza/retroRounds';
import { buildWalletProofHeaders } from '@/lib/walletProof';

interface ActiveRound {
  id: string;
  status: 'open' | 'voting' | 'allocated' | 'settled';
  pool_brza: number;
  period_start: string;
  period_end: string;
  voting_closes_at: string;
}

interface Recipient {
  wallet: string;
  joinedAt: string;
}

interface GetResponse {
  round: ActiveRound | null;
  recipients: Recipient[];
  existingBallot: Record<string, number> | null;
  status?: string;
  error?: string;
}

function formatBrza(n: number): string {
  return `${n.toLocaleString('en-KE')} BRZA`;
}

function formatRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'closed';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 48) return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} left`;
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.floor(ms / (60 * 1000));
  return `${minutes}m left`;
}

export default function RetroVote() {
  const { communityId = '' } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  useSeo({
    title: 'Cast a retro vote',
    description: 'Allocate weight across community members for this round.',
  });

  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { setVisible } = useWalletModal();
  const voterWallet = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const [round, setRound] = useState<ActiveRound | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (voterWallet) headers['X-Voter-Wallet'] = voterWallet;
      const res = await fetch(
        `/api/communities/retro-ballot?communityId=${encodeURIComponent(communityId)}`,
        { headers },
      );
      const json = (await res.json()) as GetResponse;
      if (!res.ok) {
        setError(json.error ?? `Read failed (${res.status}).`);
        return;
      }
      setRound(json.round);
      setRecipients(json.recipients);
      setStatusNote(json.status ?? null);
      if (json.existingBallot) {
        setWeights(json.existingBallot);
      } else if (json.round && json.recipients.length > 0) {
        // Default: evenly split 100 across recipients excluding self.
        const eligible = json.recipients.filter((r) => r.wallet !== voterWallet);
        if (eligible.length > 0) {
          const each = Math.floor(100 / eligible.length);
          const remainder = 100 - each * eligible.length;
          const seeded: Record<string, number> = {};
          eligible.forEach((r, i) => {
            seeded[r.wallet] = each + (i === 0 ? remainder : 0);
          });
          setWeights(seeded);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [communityId, voterWallet]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalWeight = useMemo(
    () => Object.values(weights).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0),
    [weights],
  );

  const eligibleRecipients = useMemo(
    () => recipients.filter((r) => r.wallet !== voterWallet),
    [recipients, voterWallet],
  );

  const ballotValidation = useMemo(() => {
    if (!round || !voterWallet) return { valid: false, errors: [] as string[] };
    return validateBallot({
      roundId: round.id,
      voterWallet,
      allocations: weights,
    });
  }, [round, voterWallet, weights]);

  const updateWeight = (wallet: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.floor(Number.isFinite(value) ? value : 0)));
    setWeights((prev) => ({ ...prev, [wallet]: clamped }));
  };

  const distributeEvenly = () => {
    if (eligibleRecipients.length === 0) return;
    const each = Math.floor(100 / eligibleRecipients.length);
    const remainder = 100 - each * eligibleRecipients.length;
    const next: Record<string, number> = {};
    eligibleRecipients.forEach((r, i) => {
      next[r.wallet] = each + (i === 0 ? remainder : 0);
    });
    setWeights(next);
  };

  const submit = useCallback(async () => {
    if (!round || !voterWallet) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/communities/retro-ballot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Voter-Wallet': voterWallet,
          ...(await buildWalletProofHeaders(wallet, 'retro-vote')),
        },
        body: JSON.stringify({
          communityId,
          allocations: weights,
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(json.message ?? json.error ?? `Submit failed (${res.status}).`);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }, [wallet, round, voterWallet, communityId, weights]);

  if (!connected) {
    return (
      <Layout>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Connect to vote</h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to cast a retro vote in this community.
          </p>
          <button
            type="button"
            onClick={() => setVisible(true)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Connect wallet
          </button>
        </section>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <section className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <Check className="mx-auto h-12 w-12 text-confirmed" />
          <h1 className="text-2xl font-semibold">Ballot recorded</h1>
          <p className="text-sm text-muted-foreground">
            You can come back any time before voting closes to change your allocation.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                void load();
              }}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              Edit ballot
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${communityId}`)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Back to community
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Retro round · weekly BRZA distribution
          </p>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Allocate weight to your fellow members
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            You have 100 weight points. Distribute them across the members whose contribution this
            period you want to recognise. Weights must be whole numbers and must sum to 100. You
            cannot allocate to yourself. Your vote will be visible on the round ledger.
          </p>
        </header>

        {statusNote ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700">
            {statusNote}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {!round && !loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
            <Coins className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No round is open in this community right now.</p>
            <p className="text-xs text-muted-foreground">
              Rounds open weekly. Come back when one starts, or ask your community admin.
            </p>
          </div>
        ) : null}

        {round ? (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Pool
                </p>
                <p className="text-xl font-display font-black tabular-nums">
                  {formatBrza(round.pool_brza)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Voting
                </p>
                <p className="text-sm font-medium">{formatRemaining(round.voting_closes_at)}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-1">
              {eligibleRecipients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other active members to vote for.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    <span>Allocation · {eligibleRecipients.length} eligible</span>
                    <button
                      type="button"
                      onClick={distributeEvenly}
                      className="text-primary hover:underline normal-case font-sans"
                    >
                      Distribute evenly
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {eligibleRecipients.map((r) => {
                      const value = weights[r.wallet] ?? 0;
                      return (
                        <div key={r.wallet} className="py-2 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">{truncateAddress(r.wallet)}</p>
                            <p className="text-[11px] text-muted-foreground">
                              joined {new Date(r.joinedAt).toLocaleDateString('en-KE')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={value}
                              onChange={(e) => updateWeight(r.wallet, Number(e.target.value))}
                              className="w-32"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={value}
                              onChange={(e) => updateWeight(r.wallet, Number(e.target.value))}
                              className="w-14 rounded-md border border-border bg-surface px-2 py-1 text-sm text-right tabular-nums"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Total weight
                </p>
                <p
                  className={`text-2xl font-display font-black tabular-nums ${
                    totalWeight === 100
                      ? 'text-confirmed'
                      : totalWeight > 100
                        ? 'text-destructive'
                        : 'text-foreground'
                  }`}
                >
                  {totalWeight} / 100
                </p>
              </div>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!ballotValidation.valid || submitting || loading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting…' : 'Submit ballot'}
              </button>
            </div>

            {!ballotValidation.valid && ballotValidation.errors.length > 0 ? (
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                {ballotValidation.errors.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh"
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
