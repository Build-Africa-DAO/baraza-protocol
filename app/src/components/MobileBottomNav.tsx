import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, PlusCircle, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const sideItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/communities', label: 'Explore', icon: Compass },
  { path: '/profile', label: 'Profile', icon: UserRound },
] as const;

function isPathActive(currentPath: string, target: string): boolean {
  if (target === '/') return currentPath === '/';
  return currentPath === target || currentPath.startsWith(`${target}/`);
}

export default function MobileBottomNav() {
  const location = useLocation();
  const createActive = isPathActive(location.pathname, '/create');

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/92 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {sideItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isPathActive(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Centered primary action */}
        <div className="flex justify-center">
          <Link
            to="/create"
            aria-current={createActive ? 'page' : undefined}
            className={cn(
              'flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full shadow-[0_8px_24px_hsl(44_100%_50%/0.35)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
              'bg-gradient-to-br from-[hsl(44,100%,50%)] to-[hsl(17,97%,49%)] text-primary-foreground',
              createActive && 'scale-105',
            )}
          >
            <PlusCircle className="h-7 w-7" />
            <span className="sr-only">Create a Community DAO</span>
          </Link>
        </div>

        {sideItems.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isPathActive(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'col-start-5 flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
