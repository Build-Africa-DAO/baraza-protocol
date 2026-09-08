import { useEffect, useState } from 'react';
import { Activity, Database, Radio, ShieldAlert } from 'lucide-react';
import Layout from '@/components/Layout';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { paymentRailStatus, type ComponentHealth, type ReadinessResponse } from '@/lib/healthReady';

type RailKey = 'database' | 'stellar_horizon' | 'payments';

const RAIL_META: Record<RailKey, { label: string; icon: typeof Database; hint: string }> = {
  database: { label: 'PostgreSQL database', icon: Database, hint: 'Hard tier — the app cannot serve without this.' },
  stellar_horizon: { label: 'Stellar Horizon RPC', icon: Radio, hint: 'Soft tier — degraded RPC does not take the app down.' },
  payments: { label: 'Kotani Pay / Minisend', icon: Activity, hint: 'Soft tier — payouts may route to a secondary rail.' },
};

function badgeFor(status: ComponentHealth['status'] | 'unknown') {
  if (status === 'healthy') return { label: 'Operational', className: 'bg-confirmed/15 text-confirmed' };
  if (status === 'degraded') return { label: 'Degraded', className: 'bg-accent/15 text-accent' };
  if (status === 'unhealthy') return { label: 'Outage', className: 'bg-destructive/15 text-destructive' };
  return { label: 'Not reported', className: 'bg-muted text-muted-foreground' };
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
      try {
        const res = await fetch('/api/health/ready');
        const data = (await res.json()) as ReadinessResponse;
        if (!cancelled) {
          setReady(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Could not reach the health endpoint. The web app is still available.');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const overall = ready?.status ?? (error ? 'degraded' : null);
  const db = ready?.components.database;
  const horizon = ready?.components.stellar_horizon;
  const paymentStatus = paymentRailStatus(horizon);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Public diagnostics</p>
          <h1 className="mt-2 font-display text-3xl font-bold">System status</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Readiness is cached for 5 seconds. Soft-rail issues show as degraded performance without taking the web app down.
          </p>

          <div className={cn(
            'mt-6 rounded-xl border p-4',
            overall === 'ready' && 'border-confirmed/40 bg-confirmed/10',
            overall === 'degraded' && 'border-accent/40 bg-accent/10',
            (overall === 'not_ready' || !overall) && 'border-border bg-muted/20',
          )}>
            <p className="text-sm font-semibold">
              {overall === 'ready' && 'All hard systems operational'}
              {overall === 'degraded' && 'Degraded performance'}
              {overall === 'not_ready' && 'Database outage — membership writes are paused'}
              {!overall && 'Checking rails…'}
            </p>
            {ready && (
              <p className="mt-1 text-xs text-muted-foreground">
                Checked {new Date(ready.timestamp).toLocaleTimeString()} {ready.cached ? '(cached)' : ''}
              </p>
            )}
            {error && <p className="mt-2 text-sm">{error}</p>}
          </div>

          <div className="mt-6 grid gap-4">
            {([
              ['database', db],
              ['stellar_horizon', horizon],
              ['payments', { status: paymentStatus, tier: 'soft', latency_ms: horizon?.latency_ms ?? 0 } as ComponentHealth],
            ] as const).map(([key, health]) => {
              const meta = RAIL_META[key];
              const Icon = meta.icon;
              const badge = badgeFor(health?.status ?? 'unknown');
              return (
                <div key={key} className="baraza-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5" />
                      <div>
                        <h2 className="font-display text-base font-semibold">{meta.label}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{meta.hint}</p>
                        {health?.message && <p className="mt-2 text-xs">{health.message}</p>}
                      </div>
                    </div>
                    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', badge.className)}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            OpenMetrics for Prometheus are at <code className="font-mono">GET /api/health/metrics</code>. Live probe: <code className="font-mono">GET /api/health/live</code>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
