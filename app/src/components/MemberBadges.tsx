import { Lock } from 'lucide-react';
import { BADGES, type BadgeDerivationResult, type BadgeId, type BadgeMeta } from '@/lib/badges';
import { cn } from '@/lib/utils';

interface MemberBadgesProps {
  result: BadgeDerivationResult;
  /**
   * Layout density. `compact` is the inline chip row used on Profile;
   * `expanded` shows criteria text under each badge.
   */
  variant?: 'compact' | 'expanded';
}

const TONE_CLASSES = {
  primary: {
    earned: 'border-primary/60 bg-primary/15 text-primary',
    pending: 'border-border/60 bg-muted/40 text-muted-foreground',
  },
  secondary: {
    earned: 'border-secondary/60 bg-secondary/15 text-secondary',
    pending: 'border-border/60 bg-muted/40 text-muted-foreground',
  },
  muted: {
    earned: 'border-border/70 bg-foreground/5 text-foreground/80',
    pending: 'border-border/60 bg-muted/40 text-muted-foreground',
  },
} as const;

function BadgeChip({
  meta,
  state,
  variant,
}: {
  meta: BadgeMeta;
  state: 'earned' | 'pending' | 'locked';
  variant: 'compact' | 'expanded';
}) {
  const palette = TONE_CLASSES[meta.tone];
  const earnedStyle = palette.earned;
  const pendingStyle = palette.pending;

  if (variant === 'compact') {
    return (
      <div
        title={state === 'earned' ? meta.description : meta.criteria}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
          state === 'earned' ? earnedStyle : pendingStyle,
        )}
      >
        <span aria-hidden className={state === 'earned' ? '' : 'grayscale opacity-60'}>
          {state === 'locked' ? <Lock className="h-3 w-3" /> : meta.glyph}
        </span>
        <span>{meta.label}</span>
      </div>
    );
  }

  // expanded
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3 transition-colors',
        state === 'earned' ? earnedStyle : pendingStyle,
      )}
    >
      <div
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base',
          state === 'earned' ? 'bg-background/50' : 'bg-background/30',
        )}
        aria-hidden
      >
        {state === 'locked' ? <Lock className="h-4 w-4" /> : meta.glyph}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{meta.label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed">
          {state === 'earned' ? meta.description : meta.criteria}
        </p>
      </div>
    </div>
  );
}

/**
 * Badge row for the Profile page. Renders earned badges first (in full
 * color), then in-progress ones (dimmed with criteria as tooltip),
 * then locked teasers (lock icon + criteria).
 */
export function MemberBadges({ result, variant = 'compact' }: MemberBadgesProps) {
  const { earned, inProgress, locked } = result;
  const ordered: Array<{ id: BadgeId; state: 'earned' | 'pending' | 'locked' }> = [
    ...earned.map((id) => ({ id, state: 'earned' as const })),
    ...inProgress.map((id) => ({ id, state: 'pending' as const })),
    ...locked.map((id) => ({ id, state: 'locked' as const })),
  ];

  return (
    <div
      className={cn(
        variant === 'compact' ? 'flex flex-wrap gap-1.5' : 'grid gap-2 sm:grid-cols-2',
      )}
    >
      {ordered.map(({ id, state }) => (
        <BadgeChip key={id} meta={BADGES[id]} state={state} variant={variant} />
      ))}
    </div>
  );
}

export default MemberBadges;
