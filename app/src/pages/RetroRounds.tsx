import { apiFetch, submitGuard } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Coins, RefreshCw, Sparkles } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Layout from '@/components/Layout';
import { StatusScreen } from '@/components/StatusPage';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useSeo } from '@/lib/seo';
import { isAdminWallet } from '@/lib/access';
import { useCommunities } from '@/hooks/useCommunities';
import { buildWalletProofHeaders } from '@/lib/walletProof';

interface ActiveRound {
  id: string;
  community_id: string;
  period_start: string;
  period_end: string;
  voting_closes_at: string;
  pool_brza: number;
  status: 'open' | 'voting' | 'allocated' | 'settled';
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
  } catch {
    return iso;
  }
}

export default function RetroRounds() {
  useSeo({
    title: 'Retro Rounds · Admin',
    description: 'Open and manage weekly retroactive BRZA distribution rounds per community.',
  });

  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { setVisible } = useWalletModal();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
  const isAdmin = isAdminWallet(walletAddress);

  const { communities, isLoading: communitiesLoading } = useCommunities();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [settling, setSettling] = useState(false);
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [settleResult, setSettleResult] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCommunityId && communities.length > 0) {
      setSelectedCommunityId(communities[0].id);
    }
  }, [communities, selectedCommunityId]);

  const loadActive = useCallback(
    async (communityId: string) => {
      if (!walletAddress || !communityId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<RoundResponse>(
          `/api/communities/retro-rounds?communityId=${encodeURIComponent(communityId)}`,
          { headers: { 'X-Admin-Wallet': walletAddress }, auth: 'omit' },
        );
        if (!result.ok) {
          setError(result.error.kind === 'forbidden' ? 'Wallet not authorised.' : result.error.message);
          return;
        }
        setActiveRound(result.data.active ?? null);
        setStatusNote(result.data.status ?? null);
      } finally {
        setLoading(false);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    if (isAdmin && selectedCommunityId) {
      void loadActive(selectedCommunityId);
    }
  }, [isAdmin, selectedCommunityId, loadActive]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const settleRound = useCallback(async () => {
    if (!walletAddress || !activeRound) return;
    setSettling(true);
    setError(null);
    setSettleResult(null);
    try {
      const result = await submitGuard.run(`retro-settle:${activeRound.id}`, async () =>
        apiFetch<{ voteCount?: number; recipientCount?: number; totalBrzaAllocated?: number }>('/api/communities/retro-settle', {
          method: 'POST',
          headers: { 'X-Admin-Wallet': walletAddress, ...(await buildWalletProofHeaders(wallet, 'retro-settle')) },
          body: { roundId: activeRound.id },
          auth: 'omit',
        }),
      );
      if (!result) return;
      if (!result.ok) {
        setError(
          result.error.code === 'voting_still_open'
            ? 'Voting is still open. Settle after the voting window closes.'
            : result.error.code === 'already_settled'
              ? 'This round was already settled.'
              : result.error.message,
        );
        return;
      }
      const json = result.data;
      setSettleResult(
        `Settled · ${json.voteCount} ballots → ${json.recipientCount} recipients · ${json.totalBrzaAllocated?.toLocaleString('en-KE')} BRZA distributed.`,
      );
      await loadActive(selectedCommunityId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSettling(false);
    }
  }, [wallet, walletAddress, activeRound, selectedCommunityId, loadActive]);

  const openRound = useCallback(async () => {
    if (!walletAddress || !selectedCommunityId) return;
    setOpening(true);
    setError(null);
    try {
      const result = await apiFetch<RoundResponse>('/api/communities/retro-rounds', {
        method: 'POST',
        headers: {
          'X-Admin-Wallet': walletAddress,
          'X-Member-Wallet': walletAddress,
          ...(await buildWalletProofHeaders(wallet, 'retro-open')),
        },
        body: { communityId: selectedCommunityId },
        auth: 'omit',
      });
      if (!result.ok) {
        setError(result.error.code === 'round_already_active' ? 'A round is already open for this group.' : result.error.message);
        return;
      }
      if (result.data.round) {
        setActiveRound(result.data.round);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setOpening(false);
    }
  }, [wallet, walletAddress, selectedCommunityId]);

  if (!connected) {
    return (
      <StatusScreen
        kind="unauthorized"
        title="Connect an Admin Wallet"
        description="Retro rounds are admin-gated. Connect a wallet on the admin list to continue."
        primary={{ label: 'Connect Wallet', onClick: () => setVisible(true), icon: 'login' }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <StatusScreen
        kind="forbidden"
        title="Not Authorised"
        description="This wallet is not on the admin list."
      />
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Admin · BRZA distribution
          </p>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Retro rounds
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Weekly retroactive BRZA distributions, per community. Members vote on which peers
            contributed most over the period; the pool is sized from the community's share of the
            monthly emission cap.
          </p>
        </header>

        <div className="flex items-center gap-3">
          <label htmlFor="community" className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Community
          </label>
          <select
            id="community"
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            disabled={communitiesLoading}
            className="flex-1 max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selectedCommunityId && void loadActive(selectedCommunityId)}
            disabled={loading}
            aria-label="Refresh"
            className="btn-wipe-outline px-3 py-2 text-xs"
          >
            <RefreshCw className={`inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {statusNote ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700">
            {statusNote}
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Active round
          </h2>

          {activeRound ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    Status
                  </dt>
                  <dd className="font-medium capitalize">{activeRound.status}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    Pool
                  </dt>
                  <dd className="font-medium">{formatBrza(activeRound.pool_brza)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    Period
                  </dt>
                  <dd className="font-medium">
                    {formatDate(activeRound.period_start)} → {formatDate(activeRound.period_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    Voting closes
                  </dt>
                  <dd className="font-medium">{formatDate(activeRound.voting_closes_at)}</dd>
                </div>
              </dl>

              {new Date(activeRound.voting_closes_at).getTime() <= nowMs ? (
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Voting has closed. Settling computes each member's share and records it. It cannot be undone.
                  </p>
                  <Button type="button" onClick={() => setConfirmSettle(true)} disabled={settling}>
                    {settling ? 'Settling…' : 'Settle Round'}
                  </Button>
                  <Sheet
                    open={confirmSettle}
                    onClose={() => setConfirmSettle(false)}
                    title="Settle This Round?"
                    description="This distributes the whole pool according to the ballots. There is no undo."
                    footer={
                      <>
                        <Button type="button" variant="outline" onClick={() => setConfirmSettle(false)} disabled={settling}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={settling}
                          onClick={() => {
                            setConfirmSettle(false);
                            void settleRound();
                          }}
                        >
                          Settle Round
                        </Button>
                      </>
                    }
                  >
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Pool</dt><dd className="font-semibold tabular-nums">{activeRound.pool_brza.toLocaleString()} BRZA</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Period</dt><dd>{formatDate(activeRound.period_start)} – {formatDate(activeRound.period_end)}</dd></div>
                    </dl>
                  </Sheet>
                  {settleResult ? (
                    <div className="rounded-lg border border-confirmed/40 bg-confirmed/10 p-3 text-xs text-confirmed">
                      {settleResult}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  Settlement becomes available once voting closes at{' '}
                  {formatDate(activeRound.voting_closes_at)}.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No round is currently open or in voting for this community.
              </p>
              <button
                type="button"
                onClick={() => void openRound()}
                disabled={opening || !selectedCommunityId}
                className="btn-wipe px-4 py-2 text-sm disabled:opacity-50"
              >
                {opening ? 'Opening…' : 'Open a weekly round'}
              </button>
              <p className="text-xs text-muted-foreground">
                Defaults: period = past 7 days, voting closes 48 hours after period end. Pool is sized
                from the community's share of the protocol-wide monthly emission cap.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
