import { Radio, ShieldCheck } from 'lucide-react';
import { PRODUCT_ENVIRONMENT, type ProductEnvironment, writeStoredEnvironment } from '@/lib/network';
import { cn } from '@/lib/utils';

interface EnvironmentSelectorProps {
  variant?: 'desktop' | 'mobile';
}

const OPTIONS: Array<{ value: ProductEnvironment; label: string }> = [
  { value: 'test', label: 'Test' },
  { value: 'live', label: 'Live' },
];

export default function EnvironmentSelector({ variant = 'desktop' }: EnvironmentSelectorProps) {
  const changeEnvironment = (environment: ProductEnvironment) => {
    if (environment === PRODUCT_ENVIRONMENT) return;
    writeStoredEnvironment(environment);
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border/70 bg-surface/70 p-1',
        variant === 'mobile' && 'w-full',
      )}
      role="group"
      aria-label="Select network environment"
      title="Choose whether Baraza connects to test or live networks"
    >
      {OPTIONS.map((option) => {
        const active = option.value === PRODUCT_ENVIRONMENT;
        const Icon = option.value === 'live' ? Radio : ShieldCheck;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => changeEnvironment(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
              variant === 'mobile' && 'flex-1 py-2',
              active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
