import '@/polyfill';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ArrowLeft, Coins, FlaskConical, Menu, Moon, ScrollText, Scale, Sun, Wallet, X, type LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import BackendStatus from '@/components/BackendStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { useTheme } from '@/hooks/useTheme';
import { cn, truncateAddress } from '@/lib/utils';

/**
 * Chrome for operator tools (§4.19, decision §9.4). `/admin/*`, `/retro/*`
 * and the lab live here, with a plain left nav and a wallet chip. This is the
 * only shell where a Solana wallet is part of the furniture; members never
 * see it. No bottom nav, no footer, no Akili prompts about reconciliation.
 */
const NAV: Array<{ to: string; label: string; icon: LucideIcon; devOnly?: boolean; match?: (path: string) => boolean }> = [
  { to: '/admin', label: 'Reconciliation', icon: Scale, match: (path) => path === '/admin' },
  { to: '/admin/akili', label: 'Council Filings', icon: ScrollText },
  { to: '/admin/retro', label: 'Retro Rounds', icon: Coins, match: (path) => path.startsWith('/admin/retro') || path.startsWith('/retro') },
  { to: '/onboard', label: 'Lab', icon: FlaskConical, devOnly: true },
];

function navClass(active: boolean) {
  return cn(
    'flex min-h-12 items-center gap-2.5 rounded-full px-3 text-sm font-semibold transition-colors',
    active ? 'text-primary' : 'text-muted-foreground hover:bg-chrome-foreground/[0.06] hover:text-chrome-foreground',
  );
}

function WalletChip() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  if (connected && publicKey) {
    return (
      <div className="flex items-center justify-between gap-2">
        <StatusChip kind="confirmed" icon={Wallet} label={truncateAddress(publicKey.toBase58())} />
        <Button type="button" variant="outline" size="sm" onClick={() => void disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }
  return (
    <Button type="button" variant="outline" fullWidth onClick={() => setVisible(true)}>
      <Wallet className="h-4 w-4" aria-hidden />
      Connect Operator Wallet
    </Button>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const items = NAV.filter((item) => !item.devOnly || import.meta.env.DEV);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-4">
        <Link to="/admin" onClick={onNavigate} aria-label="Operator console">
          <BrandLogo size="sm" showIcon={false} lockup="protocol" />
        </Link>
        <StatusChip kind="info" icon={null} label="Operator" />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4" aria-label="Operator tools">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match ? match(location.pathname) : location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <NavLink key={to} to={to} onClick={onNavigate} className={navClass(active)} aria-current={active ? 'page' : undefined}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-border/60 px-3 py-3">
        <WalletChip />
        <div className="flex items-center justify-between gap-2 px-1">
          <Button type="button" variant="icon" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/home" onClick={onNavigate} className="inline-flex min-h-12 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Baraza
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OperatorShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-[100dvh] w-full gap-4 overflow-hidden bg-canvas p-3 md:p-4">
      <aside className="hidden h-full w-[16.5rem] shrink-0 rounded-chrome bg-chrome text-chrome-foreground shadow-[var(--shadow-deep)] lg:flex lg:flex-col">
        <SidebarBody />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-md" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative m-3 h-[calc(100%-1.5rem)] w-[16.5rem] max-w-[85vw] rounded-chrome bg-chrome text-chrome-foreground shadow-[var(--shadow-deep)]">
            <button type="button" className="btn-icon absolute right-3 top-3 z-10 h-12 w-12" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <header className="z-40 flex h-14 shrink-0 items-center gap-2 rounded-chrome bg-chrome px-3 text-chrome-foreground shadow-[var(--shadow-deep)] lg:hidden">
          <Button type="button" variant="icon" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <BrandLogo size="sm" showIcon={false} lockup="protocol" />
          <StatusChip kind="info" icon={null} label="Operator" className="ml-auto" />
        </header>
        <OfflineBanner />
        <main id="main-content" key={location.pathname} className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-chrome bg-background pb-8 lg:mt-0" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BackendStatus />
    </div>
  );
}
