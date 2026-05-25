import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Compass, Home, PlusCircle, UserRound, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind class for the grid placement so spacing stays even. */
  colClass: string;
}

const leftItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home, colClass: 'col-start-1' },
  { path: '/communities', label: 'Explore', icon: Compass, colClass: 'col-start-2' },
];

const rightItems: NavItem[] = [
  { path: '/profile', label: 'Profile', icon: UserRound, colClass: 'col-start-4' },
];

function isPathActive(currentPath: string, target: string): boolean {
  if (target === '/') return currentPath === '/';
  return currentPath === target || currentPath.startsWith(`${target}/`);
}

function NavLink({ item, location }: { item: NavItem; location: ReturnType<typeof useLocation> }) {
  const Icon = item.icon;
  const active = isPathActive(location.pathname, item.path);

  return (
    <Link
      to={item.path}
      aria-current={active ? 'page' : undefined}
      className={cn(
        item.colClass,
        'flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

function WalletAction() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const label = connected && publicKey ? 'Account' : 'Join';

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className={cn(
        'col-start-5 flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
        connected ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
      aria-label={connected ? 'Solana account connected. Change account' : 'Connect Solana account'}
    >
      <Wallet className="h-5 w-5" />
      {label}
    </button>
  );
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
        {leftItems.map((item) => (
          <NavLink key={item.path} item={item} location={location} />
        ))}

        <div className="col-start-3 flex justify-center">
          <Link
            to="/create"
            aria-current={createActive ? 'page' : undefined}
            className={cn(
              'flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full shadow-[var(--shadow-warm)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
              'bg-primary text-primary-foreground',
              createActive && 'scale-105',
            )}
          >
            <PlusCircle className="h-7 w-7" />
            <span className="sr-only">Launch your chama</span>
          </Link>
        </div>

        {rightItems.map((item) => (
          <NavLink key={item.path} item={item} location={location} />
        ))}

        <WalletAction />
      </div>
    </nav>
  );
}
