import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The one overlay for forms and confirmations (§13.4, §13.17, §13.18).
 * Bottom sheet on phones (max 90vh, inner scroll); centred dialog from `sm`.
 * Focus trap, Escape, scroll lock and focus return are built in, ported from
 * the sign-in sheet so every overlay behaves the same.
 */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Actions row pinned under the content. */
  footer?: ReactNode;
  /** Max width of the centred dialog on desktop. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE: Record<NonNullable<SheetProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, description, children, footer, size = 'md', className }: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.getAttribute('aria-hidden') !== 'true',
      );
    focusables()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body>: the sheet is used inside the scrolling content panel,
  // and a fixed scrim rendered there is clipped to that panel.
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 backdrop-blur-md sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'flex w-full max-h-[90vh] flex-col rounded-t-2xl border border-border bg-background text-foreground shadow-[var(--shadow-deep)] sm:rounded-2xl',
          SIZE[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-bold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-icon h-12 w-12 shrink-0 -mr-2 -mt-2">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? (
          <footer className="flex flex-col gap-2 border-t border-border px-5 py-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:flex-row sm:justify-end">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default Sheet;
