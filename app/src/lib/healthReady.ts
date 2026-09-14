export type DependencyTier = 'hard' | 'soft';
export type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  tier: DependencyTier;
  status: ComponentStatus;
  latency_ms: number;
  message?: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'degraded' | 'not_ready';
  timestamp: string;
  cached: boolean;
  components: {
    database: ComponentHealth;
    stellar_horizon: ComponentHealth;
    redis?: ComponentHealth;
  };
}

/** Ready payload reports Horizon only; payout rails are inferred as a soft tier. */
export function paymentRailStatus(horizon?: ComponentHealth): ComponentStatus | 'unknown' {
  if (!horizon) return 'unknown';
  if (horizon.status === 'unhealthy') return 'degraded';
  return horizon.status;
}
