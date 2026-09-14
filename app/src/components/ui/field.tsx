import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Form atoms. Token colours, `--radius-sm`, 44px controls, label + help +
 * error wiring done once. Pages stop building inputs by hand.
 */

const CONTROL =
  'h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive';

export interface FieldProps {
  label: string;
  htmlFor: string;
  /** Sentence-case helper under the control. */
  help?: string;
  /** Sentence-case error under the control. Replaces help when present. */
  error?: string;
  /** Marks the label as optional in copy rather than an asterisk for required. */
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, help, error, optional, children, className }: FieldProps) {
  const helpId = `${htmlFor}-help`;
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {optional ? <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={helpId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(CONTROL, className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(CONTROL, 'h-auto min-h-24 py-2.5', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(CONTROL, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  ),
);
Select.displayName = 'Select';

export interface PhoneFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  /** Shown as a fixed prefix, e.g. "+254". */
  dialCode?: string;
}

/** National number with a fixed dial code. Callers normalise the value. */
export const PhoneField = React.forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ dialCode = '+254', className, ...props }, ref) => (
    <div
      className={cn(
        'flex h-11 w-full overflow-hidden rounded-md border border-border bg-background focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">{dialCode}</span>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  ),
);
PhoneField.displayName = 'PhoneField';

export interface MoneyFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  currency: string;
}

/** Major-unit amount with the group currency as a fixed prefix. */
export const MoneyField = React.forwardRef<HTMLInputElement, MoneyFieldProps>(
  ({ currency, className, ...props }, ref) => (
    <div
      className={cn(
        'flex h-11 w-full overflow-hidden rounded-md border border-border bg-background focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <span className="flex items-center border-r border-border bg-surface px-3 text-sm font-semibold text-foreground">
        {currency.toUpperCase()}
      </span>
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        min={0}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  ),
);
MoneyField.displayName = 'MoneyField';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** On/off control. Black when on, outline when off. 44px tap target. */
export function Switch({ id, checked, onCheckedChange, disabled, className, ...rest }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label']}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-11 w-16 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-foreground' : 'border border-border bg-background',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block h-8 w-8 rounded-full transition-transform',
          checked ? 'translate-x-6 bg-background' : 'translate-x-0 bg-muted-foreground/40',
        )}
      />
    </button>
  );
}
