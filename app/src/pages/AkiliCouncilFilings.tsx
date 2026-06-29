import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldOff, RefreshCw, FileText, Headphones, AlertTriangle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Layout from '@/components/Layout';
import { useSeo } from '@/lib/seo';
import { isAdminWallet } from '@/lib/access';
import type { CouncilAgentName } from '@/akili/council';

interface FilingRecord {
  id: string;
  ts: string;
  kind: 'filing' | 'listening-note' | 'correction';
  topic: string;
  supersedes: string | null;
  body: string;
  meta?: Record<string, unknown>;
}

interface FilingsResponse {
  agent: CouncilAgentName;
  filings: FilingRecord[];
  listeningNotes: FilingRecord[];
  corrections: FilingRecord[];
  synced: boolean;
  status?: string;
}

const COUNCIL_AGENTS: Array<{ key: CouncilAgentName; label: string; role: string }> = [
  { key: 'nia', label: 'Nia', role: 'People' },
  { key: 'kofi', label: 'Kofi', role: 'Governance' },
  { key: 'zara', label: 'Zara', role: 'Economy' },
  { key: 'amara', label: 'Amara', role: 'Content & Media' },
  { key: 'seku', label: 'Seku', role: 'Research' },
];

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
  } catch {
    return ts;
  }
}

function KindIcon({ kind }: { kind: FilingRecord['kind'] }) {
  if (kind === 'filing') return <FileText className="h-3.5 w-3.5" />;
  if (kind === 'listening-note') return <Headphones className="h-3.5 w-3.5" />;
  return <AlertTriangle className="h-3.5 w-3.5" />;
}

function FilingCard({ record }: { record: FilingRecord }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 space-y-2">
      <header className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-mono">
          <KindIcon kind={record.kind} />
          {record.kind}
        </span>
        <span className="font-mono">{formatTs(record.ts)}</span>
      </header>
      <h3 className="text-sm font-semibold text-foreground">{record.topic}</h3>
      {record.supersedes ? (
        <p className="text-[11px] text-amber-600 font-mono">
          supersedes {record.supersedes}
        </p>
      ) : null}
      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90 font-sans">
        {record.body}
      </pre>
    </article>
  );
}

export default function AkiliCouncilFilings() {
  useSeo({
    title: 'Akili Council Filings · Admin',
    description: "Admin-gated read of the Akili council's filings, listening notes, and corrections.",
  });

  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
  const isAdmin = isAdminWallet(walletAddress);

  const [selectedAgent, setSelectedAgent] = useState<CouncilAgentName>('nia');
  const [data, setData] = useState<FilingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (agent: CouncilAgentName) => {
      if (!walletAddress) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/akili/filings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Wallet': walletAddress,
          },
          body: JSON.stringify({ agent }),
        });
        if (res.status === 403) {
          setError('This wallet is not on the admin list.');
          setData(null);
          return;
        }
        if (!res.ok) {
          setError(`Read failed (${res.status}).`);
          setData(null);
          return;
        }
        const json = (await res.json()) as FilingsResponse;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    if (isAdmin) {
      void load(selectedAgent);
    }
  }, [isAdmin, selectedAgent, load]);

  if (!connected) {
    return (
      <Layout>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
          <ShieldOff className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Connect an admin wallet</h1>
          <p className="text-sm text-muted-foreground">
            Council filings are admin-gated. Connect a wallet on the admin list to continue.
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

  if (!isAdmin) {
    return (
      <Layout>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
          <ShieldOff className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-semibold">Not authorised</h1>
          <p className="text-sm text-muted-foreground">
            This wallet is not on the admin list. Reach out to the founder if you should have access.
          </p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Admin · Akili Council
          </p>
          <h1 className="text-2xl font-semibold">Council filings</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Raw filings, listening notes, and corrections from the council agents. Admin-gated; not
            surfaced to community members. Source-of-truth is the council data directory; production
            reads will populate from the Supabase mirror once that sync lands.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {COUNCIL_AGENTS.map((agent) => {
            const active = agent.key === selectedAgent;
            return (
              <button
                key={agent.key}
                type="button"
                onClick={() => setSelectedAgent(agent.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {agent.label}
                <span className="ml-1.5 text-[10px] opacity-70">{agent.role}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void load(selectedAgent)}
            disabled={loading}
            aria-label="Refresh"
            className="ml-auto rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {data && !data.synced ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700">
            {data.status ?? 'No filings found.'}
          </div>
        ) : null}

        {data && data.synced ? (
          <div className="space-y-8">
            {data.filings.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                  Filings · {data.filings.length}
                </h2>
                <div className="space-y-3">
                  {data.filings.map((r) => (
                    <FilingCard key={r.id} record={r} />
                  ))}
                </div>
              </section>
            ) : null}

            {data.listeningNotes.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                  Listening notes · {data.listeningNotes.length}
                </h2>
                <div className="space-y-3">
                  {data.listeningNotes.map((r) => (
                    <FilingCard key={r.id} record={r} />
                  ))}
                </div>
              </section>
            ) : null}

            {data.corrections.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                  Corrections · {data.corrections.length}
                </h2>
                <div className="space-y-3">
                  {data.corrections.map((r) => (
                    <FilingCard key={r.id} record={r} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>
    </Layout>
  );
}
