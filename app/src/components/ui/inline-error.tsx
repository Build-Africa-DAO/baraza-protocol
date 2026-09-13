import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * An error that belongs inside a page, not instead of it. Icon, one sentence,
 * optional retry. Pages stop hand-rolling `border-destructive/40` boxes.
 */
export interface InlineErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function InlineError({ title, message, onRetry, retryLabel = 'Try Again', className }: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-destructive/40 p-4 text-sm sm:flex-row sm:items-start',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className={cn(title && 'mt-1', 'text-muted-foreground')}>{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0 self-start">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default InlineError;
