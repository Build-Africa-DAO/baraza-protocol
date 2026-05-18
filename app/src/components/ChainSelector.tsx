import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { CHAIN_LIST, type Chain } from '@/lib/chain';
import { useChain } from '@/components/ChainProvider';
import { cn } from '@/lib/utils';

interface ChainSelectorProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export default function ChainSelector({ variant = 'desktop', className }: ChainSelectorProps) {
  const { chain, chainMeta, setChain } = useChain();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleSelect = (next: Chain) => {
    setChain(next);
    setOpen(false);
  };

  const isMobile = variant === 'mobile';

  return (
    <div className={cn('relative', isMobile && 'w-full', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Network: ${chainMeta.label}. Click to switch.`}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-border/60 bg-surface text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
          isMobile ? 'w-full justify-between px-3.5 py-3 text-sm' : 'px-3 py-2',
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: chainMeta.badgeBg }}
          />
          {chainMeta.label}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select network"
          className={cn(
            'absolute z-50 overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-[0_24px_60px_hsl(84_17%_2%/0.6)] backdrop-blur',
            isMobile ? 'left-0 right-0 top-full mt-2' : 'right-0 top-full mt-2 w-44',
          )}
        >
          {CHAIN_LIST.map((meta) => {
            const active = meta.id === chain;
            const disabled = !meta.enabled;
            return (
              <li key={meta.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => !disabled && handleSelect(meta.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                    disabled
                      ? 'cursor-not-allowed text-muted-foreground/60'
                      : 'text-foreground hover:bg-surface',
                  )}
                  title={disabled ? meta.comingSoon : undefined}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ background: meta.badgeBg }}
                    />
                    {meta.label}
                  </span>
                  {disabled ? (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {meta.comingSoon}
                    </span>
                  ) : active ? (
                    <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
