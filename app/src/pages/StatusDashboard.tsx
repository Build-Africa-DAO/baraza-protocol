import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Activity, Database, Radio } from 'lucide-react';
import Layout from '@/components/Layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/utils';
import type { ComponentHealth, ReadinessResponse } from '@/lib/healthReady';

type RailKey = 'database' | 'stellar_horizon' | 'payments';

const RAIL_META: Record<RailKey, { label: string; icon: typeof Database; hint: string }> = {
  database: { label: 'PostgreSQL database', icon: Database, hint: 'The record itself. Nothing works without it.' },
  stellar_horizon: { label: 'Stellar Horizon RPC', icon: Radio, hint: 'Settlement. Slow here means confirmations take longer.' },
  payments: { label: 'Kotani Pay / Minisend', icon: Activity, hint: 'Mobile money. Not checked by this page yet.' },
};

function badgeFor(status: ComponentHealth['status'] | 'unknown' | 'unchecked'): { kind: StatusKind; label: string } {
  if (status === 'healthy') return { kind: 'confirmed', label: 'Ready' };
  if (status === 'degraded') return { kind: 'pending', label: 'Slow' };
  if (status === 'unhealthy') return { kind: 'failed', label: 'Not Ready' };
  if (status === 'unchecked') return { kind: 'stale', label: 'Not Checked' };
  return { kind: 'stale', label: 'Not Reported' };
}

export default function StatusDashboard() {
  useSeo({
    title: 'System status',
    description: 'Live Baraza rail health: database, Stellar Horizon, and payout providers.',
    path: '/status',
  });

  const [ready, setReady] = useState<ReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // `ready` answers 503 with the same JSON body when a hard dependency is down,
      // so a non-ok response with a parsable body is still a valid reading.
      const result = await apiFetch<ReadinessResponse>('/api/health/ready', { auth: 'omit' });
      if (cancelled) return;
      const body = result.ok ? result.data : (result.data as ReadinessResponse | null);
      if (body && typeof body === 'object' && 'components' in body) {
        setReady(body);
        setError(null);
      } else {
        setError('Could not reach the health endpoint. The web app is still available.');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // A failed probe is "unknown", not "degraded": we did not learn anything.
  const overall = ready?.status ?? null;
  const db = ready?.components.database;
  const horizon = ready?.components.stellar_horizon;

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-3xl space-y-6 px-4">
          <PageHeader title="System Status" subtitle="Whether Baraza can take payments and record votes right now." />

          <div
            className={cn(
              'baraza-card p-4',
              overall === 'not_ready' && 'border-destructive/40',
            )}
            role={overall === 'not_ready' ? 'alert' : undefined}
          >
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip
                kind={overall === 'ready' ? 'confirmed' : overall === 'degraded' ? 'pending' : overall === 'not_ready' ? 'failed' : 'stale'}
                label={overall === 'ready' ? 'Ready' : overall === 'degraded' ? 'Slow' : overall === 'not_ready' ? 'Not Ready' : error ? 'Unknown' : 'Checking'}
                size="md"
              />
              <p className="text-sm font-semibold">
                {overall === 'ready' && 'All hard systems operational'}
                {overall === 'degraded' && 'Working, but confirmations may be slow'}
                {overall === 'not_ready' && 'The record is unavailable. Payments and votes are paused.'}
                {!overall && !error && 'Checking…'}
                {!overall && error && 'We could not reach the health check.'}
              </p>
            </div>
            {ready ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Checked {new Date(ready.timestamp).toLocaleTimeString()}
                {ready.cached ? ' (cached)' : ''}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-muted-foreground">{error}</p> : null}
          </div>

          <ul className="space-y-2">
            {([
              ['database', db?.status ?? 'unknown'],
              ['stellar_horizon', horizon?.status ?? 'unknown'],
              // This page never probes the payment providers; saying so beats
              // inferring their health from a different service (audit §4.18).
              ['payments', 'unchecked'],
            ] as const).map(([key, status]) => {
              const meta = RAIL_META[key];
              const Icon = meta.icon;
              const badge = badgeFor(status);
              const message = key === 'database' ? db?.message : key === 'stellar_horizon' ? horizon?.message : undefined;
              return (
                <li key={key} className="baraza-card flex items-start justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-bold">{meta.label}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">{meta.hint}</p>
                      {message ? <p className="mt-1 text-sm">{message}</p> : null}
                    </div>
                  </div>
                  <StatusChip kind={badge.kind} label={badge.label} />
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-muted-foreground">
            Rechecked every few seconds while this page is open. If something here says Not Ready, wait before paying; nothing is lost.
          </p>
        </div>
      </section>
    </Layout>
  );
}
