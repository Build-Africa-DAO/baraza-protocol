import type { ReactNode } from 'react';
import { InitialsTile } from '@/components/app/ListRow';
import { StatusChip } from '@/components/ui/status-chip';
import { cn } from '@/lib/utils';

/**
 * Who or what this page is about: initials tile, name, type, and the viewer's
 * relationship as a status chip (§13.12 identity strip). No photo. Replaces
 * the old photo banner on every in-app screen.
 */
export interface IdentityStripProps {
  name: string;
  initials: string;
  /** Group type or role, sentence case; shown as a neutral chip. */
  type?: string;
  /** Relationship chip: Visitor / Pending / Active / Officer / On Hold. */
  chip?: ReactNode;
  /** Extra chips, e.g. a SACCO licence status. */
  extra?: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export function IdentityStrip({ name, initials, type, chip, extra, size = 'lg', className }: IdentityStripProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <InitialsTile initials={initials} size={size === 'lg' ? 'lg' : 'md'} />
      <div className="min-w-0 flex-1">
        <h1 className={cn('truncate font-display font-black tracking-tight', size === 'lg' ? 'text-2xl md:text-3xl' : 'text-lg')}>
          {name}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {type ? <StatusChip kind="info" icon={null} label={type} /> : null}
          {chip}
          {extra}
        </div>
      </div>
    </div>
  );
}

export default IdentityStrip;
