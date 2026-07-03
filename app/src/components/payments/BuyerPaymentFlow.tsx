import { Check, Landmark, Smartphone, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentRail } from '@/lib/paymentFees';

export type BuyerPaymentMethod = PaymentRail;

const paymentMethods = [
  {
    id: 'mobile-money',
    label: 'Mobile money',
    description: 'Pay from your phone where supported. M-Pesa is live in Kenya.',
    icon: Smartphone,
  },
  {
    id: 'privy',
    label: 'Baraza account',
    description: 'Use the secure payment account linked to your sign-in.',
    icon: Wallet,
  },
  {
    id: 'bank-transfer',
    label: 'Bank / SWIFT',
    description: 'Receive instructions for a local or international transfer.',
    icon: Landmark,
  },
] as const;

interface PaymentMethodSelectorProps {
  value: BuyerPaymentMethod;
  onChange: (method: BuyerPaymentMethod) => void;
  legend?: string;
  accountLabel?: string;
  accountDescription?: string;
  showDescriptions?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  legend = 'Choose a payment method',
  accountLabel,
  accountDescription,
  showDescriptions = true,
}: PaymentMethodSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <div
        className={cn(
          'overflow-hidden rounded-lg border',
          showDescriptions ? 'divide-y' : 'grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0',
        )}
        role="radiogroup"
      >
        {paymentMethods.map(({ id, label, description, icon: Icon }) => {
          const selected = value === id;
          const visibleLabel = id === 'privy' && accountLabel ? accountLabel : label;
          const visibleDescription = id === 'privy' && accountDescription
            ? accountDescription
            : description;
          return (
            <label
              key={id}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
                showDescriptions ? 'min-h-16' : 'min-h-14',
                selected ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/45',
              )}
            >
              <input
                type="radio"
                name="buyer-payment-method"
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
                  selected && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <Icon className={cn('h-5 w-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{visibleLabel}</span>
                {showDescriptions && (
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {visibleDescription}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface PaymentSummaryLine {
  label: string;
  value: string;
  description?: string;
}

interface PaymentSummaryProps {
  lines: PaymentSummaryLine[];
  total: string;
  totalLabel?: string;
}

export function PaymentSummary({ lines, total, totalLabel = 'Total' }: PaymentSummaryProps) {
  return (
    <section aria-label="Payment review" className="border-t pt-4">
      <h3 className="mb-3 text-sm font-semibold">Payment review</h3>
      <dl className="space-y-2 text-sm">
        {lines.map((line) => (
          <div key={line.label} className="flex items-start justify-between gap-4">
            <dt className="max-w-[70%] text-muted-foreground">
              <span className="block">{line.label}</span>
              {line.description && (
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground/85">
                  {line.description}
                </span>
              )}
            </dt>
            <dd className="text-right font-medium tabular-nums">{line.value}</dd>
          </div>
        ))}
        <div className="flex items-end justify-between gap-4 border-t pt-3">
          <dt className="font-semibold">{totalLabel}</dt>
          <dd className="font-display text-xl font-bold tabular-nums">{total}</dd>
        </div>
      </dl>
    </section>
  );
}
