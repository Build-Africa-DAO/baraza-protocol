import type { ComponentType } from 'react';
import {
  AlertTriangle,
  Check,
  Clock3,
  Hourglass,
  Info,
  Lock,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The one way to show a status in the app (§13.1, §7 of the audit).
 *
 * Status is always a word plus an icon. Colour only supports it and orange
 * (`primary`) is never one of the options. Callers pass the word; the chip
 * picks the icon unless one is given.
 */
export type StatusKind = 'pending' | 'confirmed' | 'failed' | 'hold' | 'stale' | 'info';

const KIND: Record<StatusKind, { className: string; icon: ComponentType<LucideProps> }> = {
  pending: { className: 'border-pending text-pending bg-transparent', icon: Clock3 },
  confirmed: { className: 'border-confirmed bg-confirmed text-confirmed-foreground', icon: Check },
  failed: { className: 'border-destructive text-destructive bg-transparent', icon: AlertTriangle },
  hold: { className: 'border-hold/50 bg-muted text-hold', icon: Lock },
  stale: { className: 'border-border bg-transparent text-stale', icon: Hourglass },
  info: { className: 'border-border bg-transparent text-foreground', icon: Info },
};

export interface StatusChipProps {
  kind: StatusKind;
  label: string;
  /** Override the default icon for this kind. Pass `null` for word only. */
  icon?: ComponentType<LucideProps> | null;
  size?: 'sm' | 'md';
  className?: string;
  /** Spoken label when the visible word is not enough on its own. */
  'aria-label'?: string;
}

export function StatusChip({ kind, label, icon, size = 'sm', className, ...rest }: StatusChipProps) {
  const meta = KIND[kind];
  const Icon = icon === undefined ? meta.icon : icon;
  return (
    <span
      role="status"
      aria-label={rest['aria-label'] ?? label}
      data-kind={kind}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        meta.className,
        className,
      )}
    >
      {Icon ? <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden /> : null}
      {label}
    </span>
  );
}

export default StatusChip;
