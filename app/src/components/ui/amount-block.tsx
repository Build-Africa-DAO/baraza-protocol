import { formatMajor, formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * A money figure with its caption. Currency code first, tabular numerals,
 * black type. When the server has not sent a figure the block says so instead
 * of showing a guess (§10 "Unimplemented field").
 */
export interface AmountBlockProps {
  /** Minor units (cents). Preferred. */
  amountMinor?: number | null;
  /** Major units, for legacy callers that still hold KES as a number. */
  amountMajor?: number | null;
  currency?: string | null;
  /** Caption above the figure, e.g. "Total" or "Amount Due". */
  label: string;
  /** One sentence under the figure. Sentence case. */
  note?: string;
  size?: 'lg' | 'md';
  /** Copy used when there is no figure. */
  unavailableLabel?: string;
  className?: string;
}

export function AmountBlock({
  amountMinor,
  amountMajor,
  currency,
  label,
  note,
  size = 'lg',
  unavailableLabel = 'Not available yet',
  className,
}: AmountBlockProps) {
  const hasMinor = typeof amountMinor === 'number' && Number.isFinite(amountMinor);
  const hasMajor = typeof amountMajor === 'number' && Number.isFinite(amountMajor);
  const value = hasMinor
    ? formatMoney(amountMinor, currency)
    : hasMajor
      ? formatMajor(amountMajor, currency)
      : null;

  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      {value ? (
        <p
          className={cn(
            'mt-1 font-display font-black tabular-nums tracking-tight text-foreground',
            size === 'lg' ? 'text-3xl' : 'text-xl',
          )}
        >
          {value}
        </p>
      ) : (
        <p className={cn('mt-1 font-display font-semibold text-muted-foreground', size === 'lg' ? 'text-xl' : 'text-base')}>
          {unavailableLabel}
        </p>
      )}
      {note ? <p className="mt-1 text-sm text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export default AmountBlock;
