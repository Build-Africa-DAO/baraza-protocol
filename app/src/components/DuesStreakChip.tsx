import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DuesStreakChipProps {
  /**
   * Consecutive months the member has paid dues on time. `undefined` renders
   * a placeholder until the streak data source (Supabase `payment_orders`
   * via `/api/payment-orders/streak`) is wired. See Phase 2 followup.
   */
  streakMonths?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Reputational dues-streak signal. Visual-only for v1 — actual data lands
 * once `payment_orders` exposes a streak read path. Placeholder ("— mo") is
 * intentionally honest: don't show a tenure-based proxy that overstates
 * standing, since chama trust depends on the signal being earned.
 */
export function DuesStreakChip({
  streakMonths,
  size = 'sm',
  className,
}: DuesStreakChipProps) {
  const hasData = typeof streakMonths === 'number' && streakMonths > 0;
  const label = hasData ? `${streakMonths} mo streak` : '— mo streak';
  const description = hasData
    ? `${streakMonths} consecutive month${streakMonths === 1 ? '' : 's'} paid on time`
    : 'Dues streak will surface once payment history is wired (Phase 2 followup).';

  return (
    <span
      title={description}
      aria-label={`Dues streak — ${label}`}
      data-has-data={hasData}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold tracking-tight',
        'transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        hasData
          ? 'border-secondary/60 bg-secondary/15 text-secondary'
          : 'border-border/60 bg-muted/40 text-muted-foreground',
        className,
      )}
    >
      <Flame className={cn('shrink-0', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {label}
    </span>
  );
}

export default DuesStreakChip;
