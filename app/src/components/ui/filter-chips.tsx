import { cn } from '@/lib/utils';

/**
 * Single-select filter row. Selected = black fill, white type; idle = outline.
 * Never orange (§13.8, §13.14). Chips are 36px tall and wrap on narrow screens.
 */
export interface FilterOption<K extends string> {
  key: K;
  label: string;
  count?: number;
}

export interface FilterChipsProps<K extends string> {
  options: ReadonlyArray<FilterOption<K>>;
  value: K;
  onChange: (key: K) => void;
  'aria-label': string;
  className?: string;
}

export function FilterChips<K extends string>({ options, value, onChange, className, ...rest }: FilterChipsProps<K>) {
  return (
    <div role="group" aria-label={rest['aria-label']} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span className={cn('tabular-nums', selected ? 'opacity-80' : 'text-muted-foreground')}>{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default FilterChips;
