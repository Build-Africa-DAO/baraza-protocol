import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CircleUserRound, HelpCircle, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InitialsTile } from '@/components/app/ListRow';
import { useAccount } from '@/contexts/AccountContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * The controls that live in the top bar of the signed-in shell: theme toggle,
 * the account menu (who you are, where to manage it) and log out behind a
 * confirmation so a stray tap never ends a session.
 */

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

function initialsOf(name: string): string {
  const parts = name.replace(/[^a-z0-9 @.]/gi, ' ').trim().split(/[\s@.]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase();
  return initials || 'ME';
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button type="button" variant="icon" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

const menuRow =
  'flex min-h-12 w-full items-center gap-2.5 rounded-full px-3 text-left text-sm font-semibold text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Who is signed in, with the places that concern them. */
export function AccountMenu() {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const isEmail = account.displayName.includes('@');
  const isPhone = /^\+?\d[\d\s]+$/.test(account.displayName);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex min-h-12 items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2.5 text-sm font-semibold hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <InitialsTile initials={initialsOf(account.displayName)} size="sm" className="rounded-full" />
        <span className="hidden max-w-[10rem] truncate md:inline">{account.displayName}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div role="menu" aria-label="Account" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-chrome border border-border bg-card p-2 shadow-[var(--shadow-deep)]">
          <div className="flex items-center gap-3 px-3 py-3">
            <InitialsTile initials={initialsOf(account.displayName)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{account.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isEmail ? 'Signed in with email' : isPhone ? 'Signed in with phone' : 'Signed in'}
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-1">
            <Link role="menuitem" to="/account" onClick={() => setOpen(false)} className={menuRow}>
              <CircleUserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
              Account
            </Link>
            <Link role="menuitem" to="/help" onClick={() => setOpen(false)} className={menuRow}>
              <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
              Help
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Log out behind one confirmation step. */
export function LogoutMenu({ onBeforeLogout }: { onBeforeLogout?: () => void }) {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <Button type="button" variant="icon" size="icon" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open} aria-label="Log out">
        <LogOut className="h-4 w-4" />
      </Button>
      {open ? (
        <div role="dialog" aria-label="Confirm log out" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-chrome border border-border bg-card p-4 shadow-[var(--shadow-deep)]">
          <p className="text-sm font-bold">Log out of Baraza?</p>
          <p className="mt-1 text-xs text-muted-foreground">Your groups and record stay where they are. Sign in again with the same phone or email.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setOpen(false);
                onBeforeLogout?.();
                void account.logout();
              }}
            >
              Log Out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

