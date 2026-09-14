import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleUserRound, Compass, HelpCircle, Home, LogIn, PlusCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from '@/contexts/AccountContext';

/**
 * Bottom nav for the landing page only (`PublicShell`). Five plain slots, no
 * raised Launch orb: someone reading the landing on a phone gets the same
 * destinations as the header, in thumb reach. Signed-in and visitor app URLs
 * use their own shells.
 */
interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/groups', label: 'Groups', icon: Compass },
  { path: '/create', label: 'Start', icon: PlusCircle },
  { path: '/help', label: 'Help', icon: HelpCircle },
];

function isPathActive(currentPath: string, target: string): boolean {
  if (target === '/') return currentPath === '/';
  return currentPath === target || currentPath.startsWith(`${target}/`);
}

const slotClass =
  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const account = useAccount();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {ITEMS.map(({ path, label, icon: Icon }) => {
          const active = isPathActive(location.pathname, path);
          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? 'page' : undefined}
              className={cn(slotClass, active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={account.authenticated ? () => navigate('/account') : () => account.login()}
          disabled={!account.ready || !account.configured}
          className={cn(slotClass, 'text-muted-foreground hover:text-foreground disabled:opacity-50')}
          aria-label={account.authenticated ? 'Account' : 'Sign in'}
        >
          {account.authenticated ? <CircleUserRound className="h-5 w-5" aria-hidden /> : <LogIn className="h-5 w-5" aria-hidden />}
          {account.authenticated ? 'Account' : 'Sign In'}
        </button>
      </div>
    </nav>
  );
}
