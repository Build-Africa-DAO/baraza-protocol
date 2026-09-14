import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, HelpCircle, LogIn, Moon, PlusCircle, Sun, type LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import BackendStatus from '@/components/BackendStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/AccountContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * Chrome for app URLs when nobody is signed in (§3.2 of the audit, §13.3 of
 * the screen map). A visitor reading a group, a join page or a gated screen
 * gets a quiet top bar and a plain bottom nav. The marketing header, the
 * newsletter footer and the orange Launch orb belong to `/` only.
 */

const SLOTS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/groups', label: 'Browse', icon: Compass },
  { to: '/create', label: 'Start', icon: PlusCircle },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function VisitorShell({ children }: { children: ReactNode }) {
  const account = useAccount();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-canvas p-3 md:p-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <header className="z-40 shrink-0 rounded-chrome border border-border bg-chrome text-chrome-foreground shadow-[var(--shadow-deep)]">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-5">
          <Link to="/" aria-label="Baraza Protocol home" className="min-w-0">
            <BrandLogo size="sm" showIcon={false} lockup="protocol" />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="icon"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" onClick={() => account.login()} disabled={!account.ready || !account.configured}>
              Sign In
            </Button>
            <Button
              type="button"
              onClick={() => account.createAccount()}
              disabled={!account.ready || !account.configured}
              className="hidden sm:inline-flex"
            >
              Create Account
            </Button>
          </div>
        </div>
      </header>

      <OfflineBanner />

      <main id="main-content" className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-chrome border border-border bg-background pb-28 md:pb-8" tabIndex={-1}>
        {children}
      </main>

      <nav
        aria-label="Visitor navigation"
        className="fixed inset-x-3 bottom-3 z-40 rounded-chrome border border-border bg-chrome/95 text-chrome-foreground shadow-[var(--shadow-deep)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          {SLOTS.map(({ to, label, icon: Icon }) => {
            const active = isActive(location.pathname, to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => account.login()}
            disabled={!account.ready || !account.configured}
            className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <LogIn className="h-5 w-5" aria-hidden />
            Sign In
          </button>
        </div>
      </nav>

      <BackendStatus />
    </div>
  );
}
