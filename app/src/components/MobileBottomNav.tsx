import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Compass, Home, MessageCircle, UserRound, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMembershipAccess } from '@/hooks/useMembershipAccess';
import { getHomeDestination, shouldShowHomeNavigation } from '@/lib/homeDestination';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind class for the grid placement so spacing stays even. */
  colClass: string;
}

const exploreItem: NavItem = { path: '/communities', label: 'Explore', icon: Compass, colClass: 'col-start-2' };

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
      aria-label={connected ? 'Account connected. Change account' : 'Connect an account to join'}
    >
      <Wallet className="h-5 w-5" />
      {label}
    </button>
  );
}

export default function MobileBottomNav() {
  const location = useLocation();
  const { communityIds, identified } = useMembershipAccess();
  const homePath = getHomeDestination({
    communityIds,
    identified,
    lastInterface: typeof window === 'undefined' ? null : window.localStorage.getItem('baraza.interface.last'),
  });
  const leftItems: NavItem[] = [
    ...(shouldShowHomeNavigation(location.pathname, homePath) ? [{
      path: homePath,
      label: communityIds.length > 0 ? 'My group' : 'Home',
      icon: Home,
      colClass: 'col-start-1',
    }] : []),
    exploreItem,
  ];
  const chatActive = isPathActive(location.pathname, '/akili');
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

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
            to={`/akili?from=${encodeURIComponent(currentPath === '/akili' ? '/communities' : currentPath)}`}
            onClick={() => window.localStorage.setItem('baraza.interface.last', 'chat')}
            aria-current={chatActive ? 'page' : undefined}
            className={cn(
              'flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full shadow-[var(--shadow-warm)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
              'bg-primary text-primary-foreground',
              chatActive && 'scale-105',
            )}
          >
            <MessageCircle className="h-7 w-7" />
            <span className="sr-only">Ask Akili</span>
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
