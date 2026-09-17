import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { ReadinessResponse } from '@/lib/healthReady';

/**
 * A one-line health reading for the payment screens, from `GET /api/health/ready`.
 *
 * The readiness payload reports the database (hard) and the provider rails it
 * has probes for (soft). It does not measure Safaricom's prompt delivery time,
 * so the copy never quotes one. `unknown` is shown as "not checked", never as
 * healthy.
 */
export type RailHealth = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface RailHealthState {
  status: RailHealth;
  /** Round-trip to the readiness probe, when it answered. */
  latencyMs: number | null;
  checkedAt: number | null;
}

export function summariseReadiness(body: ReadinessResponse | null): RailHealth {
  if (!body || !body.components) return 'unknown';
  if (body.status === 'not_ready' || body.components.database?.status === 'unhealthy') return 'unhealthy';
  const soft = Object.entries(body.components)
    .filter(([key]) => key !== 'database' && key !== 'redis')
    .map(([, value]) => value?.status);
  if (body.status === 'degraded' || soft.some((status) => status === 'degraded' || status === 'unhealthy')) return 'degraded';
  return 'healthy';
}

export const RAIL_HEALTH_COPY: Record<RailHealth, string> = {
  healthy: 'Payments service is operational.',
  degraded: 'Network latency is elevated. Prompts may take longer than usual to arrive.',
  unhealthy: 'Payments service is not ready. Do not pay until this clears.',
  unknown: 'Payments service status not checked.',
};

export function useRailHealth(enabled = true): RailHealthState {
  const [state, setState] = useState<RailHealthState>({ status: 'unknown', latencyMs: null, checkedAt: null });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const started = Date.now();
    void apiFetch<ReadinessResponse>('/api/health/ready', { auth: 'omit' }).then((result) => {
      if (cancelled) return;
      // `ready` answers 503 with the same body when a hard dependency is down.
      const body = result.ok ? result.data : (result.data as ReadinessResponse | null);
      const parsed = body && typeof body === 'object' && 'components' in body ? body : null;
      setState({ status: summariseReadiness(parsed), latencyMs: parsed ? Date.now() - started : null, checkedAt: Date.now() });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
