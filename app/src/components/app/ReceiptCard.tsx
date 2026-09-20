import { Link } from 'react-router-dom';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { cn } from '@/lib/utils';

/**
 * What a member gets after paying (§13.13): amount, reference, date, status,
 * and the 14-day dispute path. Also the shape `/join/:id/status` settles into.
 */
export type ReceiptStatus = 'pending' | 'confirmed' | 'failed';

export interface ReceiptCardProps {
  amountMinor: number | null;
  currency?: string | null;
  reference: string;
  /** Already formatted for the viewer, e.g. "12 Sep 2026, 14:05". */
  date: string;
  status: ReceiptStatus;
  /** Sentence under the status, e.g. "Waiting for the provider to confirm." */
  note?: string;
  disputeHref?: string;
  homeHref?: string;
  onRetry?: () => void;
  className?: string;
}

const STATUS: Record<ReceiptStatus, { kind: StatusKind; label: string }> = {
  pending: { kind: 'pending', label: 'Pending' },
  confirmed: { kind: 'confirmed', label: 'Confirmed' },
  failed: { kind: 'failed', label: 'Failed' },
};

export function ReceiptCard({
  amountMinor,
  currency,
  reference,
  date,
  status,
  note,
  disputeHref,
  homeHref,
  onRetry,
  className,
}: ReceiptCardProps) {
  const meta = STATUS[status];
  return (
    <article className={cn('baraza-card p-5', className)} aria-label="Payment receipt">
      <div className="flex items-start justify-between gap-4">
        <AmountBlock label="Amount" amountMinor={amountMinor} currency={currency} />
        <StatusChip kind={meta.kind} label={meta.label} size="md" />
      </div>
      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="mt-0.5 break-all font-mono text-foreground">{reference}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Date</dt>
          <dd className="mt-0.5 text-foreground">{date}</dd>
        </div>
      </dl>
      {note ? <p className="mt-4 text-sm text-muted-foreground">{note}</p> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        {status === 'failed' && onRetry ? (
          <Button type="button" onClick={onRetry}>
            Retry Payment
          </Button>
        ) : null}
        {homeHref ? (
          <Button asChild variant="outline">
            <Link to={homeHref}>Back to Home</Link>
          </Button>
        ) : null}
        {disputeHref && status !== 'failed' ? (
          <Link
            to={disputeHref}
            className="inline-flex min-h-12 items-center text-sm font-semibold text-foreground underline-offset-4 hover:underline sm:ml-auto"
          >
            File a Dispute
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default ReceiptCard;
