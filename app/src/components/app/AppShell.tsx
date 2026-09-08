import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  CircleUserRound,
  Compass,
  Home,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Sun,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import BackendStatus from '@/components/BackendStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { Button } from '@/components/ui/button';
import { GroupSidebarNav } from '@/components/app/GroupSidebarNav';
import { useAccount } from '@/contexts/AccountContext';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import { useTheme } from '@/hooks/useTheme';
import { getGroupIdFromPath, isGroupWorkspacePath } from '@/lib/postAuth';
import { cn } from '@/lib/utils';

function navClass(active: boolean) {
  return cn(
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface hover:text-foreground',
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const account = useAccount();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { active, memberships } = useMyMemberships();
  const groupId = isGroupWorkspacePath(location.pathname) ? getGroupIdFromPath(location.pathname) : null;
  const currentGroup = memberships.find((item) => item.community.id === groupId)?.community;
  const listed = memberships.slice(0, 8);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Link to="/home" onClick={onNavigate} aria-label="My groups">
          <BrandLogo size="sm" showIcon={false} lockup="protocol" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <nav className="flex flex-col gap-0.5" aria-label="Workspace">
          <NavLink to="/home" end onClick={onNavigate} className={({ isActive }) => navClass(isActive)}>
            <Home className="h-4 w-4 shrink-0" />
            My Groups
          </NavLink>
          <NavLink to="/communities" onClick={onNavigate} className={({ isActive }) => navClass(isActive)}>
            <Compass className="h-4 w-4 shrink-0" />
            Browse
          </NavLink>
          <NavLink to="/create/purpose" onClick={onNavigate} className={({ isActive }) => navClass(isActive)}>
            <PlusCircle className="h-4 w-4 shrink-0" />
            Launch a Group
          </NavLink>
        </nav>

        {listed.length > 0 && (
          <div className="mt-6">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Groups
            </p>
            <nav className="flex flex-col gap-0.5" aria-label="Your groups">
              {listed.map(({ community, record }) => {
                const selected = community.id === groupId;
                return (
                  <Link
                    key={community.id}
                    to={`/dashboard/${community.id}`}
                    onClick={onNavigate}
                    className={navClass(selected)}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[11px] font-bold">
                      {community.image}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{community.name}</span>
                    {record.status !== 'active' && (
                      <span className="text-[10px] uppercase text-muted-foreground">{record.status}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {groupId && (
          <div className="mt-6">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {currentGroup?.name ?? 'This group'}
            </p>
            <GroupSidebarNav
              communityId={groupId}
              isMember={active.some((item) => item.community.id === groupId)}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>

      <div className="border-t border-border/60 px-3 py-3">
        <p className="truncate px-3 pb-2 text-xs text-muted-foreground" title={account.displayName}>
          {account.displayName}
        </p>
        <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => navClass(isActive)}>
          <CircleUserRound className="h-4 w-4 shrink-0" />
          Account
        </NavLink>
        <button
          type="button"
          onClick={toggleTheme}
          className={navClass(false) + ' w-full'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void account.logout();
          }}
          className={navClass(false) + ' w-full'}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log Out
        </button>
      </div>
    </div>
  );
}

function AppBottomNav() {
  const location = useLocation();

  const item = (to: string, label: string, icon: typeof Home, exact = false) => {
    const active = exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
    const Icon = icon;
    return (
      <Link
        to={to}
        className={cn(
          'flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-semibold',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/92 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {item('/home', 'Home', Home, true)}
        {item('/communities', 'Browse', Compass)}
        <div className="flex justify-center">
          <Link
            to="/create/purpose"
            className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-warm)]"
          >
            <PlusCircle className="h-7 w-7" />
            <span className="sr-only">Launch a Group</span>
          </Link>
        </div>
        {item('/profile', 'Account', CircleUserRound)}
      </div>
    </nav>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-[16.5rem] shrink-0 border-r border-border/70 bg-background lg:flex lg:flex-col">
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[16.5rem] max-w-[85vw] bg-background shadow-lg">
            <button
              type="button"
              className="btn-icon absolute right-3 top-3 z-10 h-10 w-10"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/70 bg-background px-3 lg:hidden">
          <Button
            type="button"
            variant="icon"
            size="icon"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/home" className="min-w-0">
            <BrandLogo size="sm" showIcon={false} lockup="protocol" />
          </Link>
        </header>
        <OfflineBanner />

        <main
          id="main-content"
          key={location.pathname}
          className="flex-1 pb-24 lg:pb-0"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <AppBottomNav />
      <BackendStatus />
    </div>
  );
}
