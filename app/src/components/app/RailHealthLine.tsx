import { RAIL_HEALTH_COPY, useRailHealth } from '@/hooks/useRailHealth';
import { cn } from '@/lib/utils';

/**
 * One line above a phone field: a dot and a sentence about the payments
 * service, read from the readiness probe. Colour is never the only signal.
 */
export function RailHealthLine({ className }: { className?: string }) {
  const health = useRailHealth();
  const dot =
    health.status === 'healthy'
      ? 'bg-confirmed'
      : health.status === 'degraded'
        ? 'bg-pending'
        : health.status === 'unhealthy'
          ? 'bg-destructive'
          : 'bg-muted-foreground';
  return (
    <p className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)} role="status" aria-live="polite" data-testid="rail-health">
      <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden />
      <span>{RAIL_HEALTH_COPY[health.status]}</span>
    </p>
  );
}
