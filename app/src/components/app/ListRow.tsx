import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One line in a list: a vote, a member, a movement, a group. Leading tile or
 * icon, title, one meta line, trailing amount and/or chip. The whole row is
 * the target when `to` or `onClick` is set. Replaces the card grids that made
 * every list a wall of equal boxes.
 */
export interface ListRowProps {
  title: string;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  /** Spoken name for the row when the title alone is ambiguous. */
  'aria-label'?: string;
  className?: string;
}

export function ListRow({ title, meta, leading, trailing, to, onClick, className, ...rest }: ListRowProps) {
  const interactive = Boolean(to || onClick);
  const body = (
    <>
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
      {interactive ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
    </>
  );
  const classes = cn(
    'baraza-row flex min-h-14 w-full items-center gap-3 rounded-lg px-4 py-3 text-left',
    interactive && 'baraza-row-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className,
  );

  if (to) {
    return (
      <Link to={to} aria-label={rest['aria-label']} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={rest['aria-label']} className={classes}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}

/** Bordered initials tile used as a row's leading element or a group avatar. */
export function InitialsTile({ initials, size = 'md', className }: { initials: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'baraza-tile grid shrink-0 place-items-center rounded-md font-display font-bold text-foreground',
        size === 'sm' && 'h-8 w-8 text-xs',
        size === 'md' && 'h-10 w-10 text-sm',
        size === 'lg' && 'h-14 w-14 text-lg',
        className,
      )}
    >
      {initials.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default ListRow;
