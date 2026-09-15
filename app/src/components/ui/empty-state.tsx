import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideProps } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Heading, one sentence, one primary, optional outline (§13.5). Every empty
 * list in the app uses this so "nothing here" looks the same everywhere.
 */
export interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: ComponentType<LucideProps>;
  primary?: EmptyStateAction;
  secondary?: EmptyStateAction;
  /** Extra content under the actions, e.g. an Ask Akili chip. */
  children?: ReactNode;
  className?: string;
}

function Action({ action, variant }: { action: EmptyStateAction; variant: 'default' | 'outline' }) {
  if (action.to) {
    return (
      <Button asChild variant={variant}>
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button type="button" variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({ title, body, icon: Icon, primary, secondary, children, className }: EmptyStateProps) {
  return (
    <div className={cn('baraza-card flex flex-col items-center p-8 text-center', className)}>
      {Icon ? (
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="font-display text-base font-bold">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {(primary || secondary) && (
        <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {primary ? <Action action={primary} variant="default" /> : null}
          {secondary ? <Action action={secondary} variant="outline" /> : null}
        </div>
      )}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default EmptyState;
