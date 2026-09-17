import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  CircleUserRound,
  Compass,
  CreditCard,
  HelpCircle,
  Home,
  Menu,
  PlusCircle,
  ReceiptText,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import BackendStatus from '@/components/BackendStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { GroupSidebarNav } from '@/components/app/GroupSidebarNav';
import { InitialsTile } from '@/components/app/ListRow';
import { AccountMenu, LogoutMenu, ThemeToggle } from '@/components/app/TopBarMenus';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import { useGroupMembership } from '@/hooks/useGroupMembership';
import { getGroupIdFromPath, isGroupWorkspacePath } from '@/lib/postAuth';
import { cn } from '@/lib/utils';
import { prefetchProps } from '@/lib/routePrefetch';

/**
 * The signed-in shell (§13.3). Two floating cards on a quiet background: a
 * sidebar that can collapse to icons, and a top bar that names where you are
 * and carries the person's controls (theme, account, log out). On phones the
 * sidebar becomes a drawer and a five-slot bottom nav takes over.
 */
const COLLAPSE_KEY = 'baraza:sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function navClass(active: boolean, collapsed = false) {
  return cn(
    'flex min-h-12 items-center gap-2.5 rounded-full px-3 text-sm font-semibold transition-colors',
    collapsed && 'justify-center px-0',
    active ? 'text-primary' : 'text-muted-foreground hover:bg-chrome-foreground/[0.06] hover:text-chrome-foreground',
  );
}

/**
 * The three workspace sections. Each section title links to its page, and the
 * first sub-row underneath is that same page under its own name, so the
 * highlight always sits on a page, never on a heading. Sub-rows are always
 * shown (nothing to disclose) and are only ever surfaces that exist.
 */
type Match = (path: string, search: URLSearchParams, hash: string) => boolean;

const WORKSPACE: Array<{
  to: string;
  label: string;
  icon: typeof Home;
  isSection: (path: string) => boolean;
  pages: Array<{ to: string; label: string; isActive: Match }>;
}> = [
  {
    to: '/home',
    label: 'My Groups',
    icon: Home,
    isSection: (path) => path === '/home',
    pages: [
      { to: '/home', label: 'Your Groups', isActive: (path, search) => path === '/home' && search.get('join') !== '1' },
      { to: '/home?join=1', label: 'Join With an Invite', isActive: (path, search) => path === '/home' && search.get('join') === '1' },
    ],
  },
  {
    to: '/groups',
    label: 'Browse',
    icon: Compass,
    isSection: (path) => path.startsWith('/groups'),
    pages: [
      { to: '/groups', label: 'All Groups', isActive: (path, search) => path.startsWith('/groups') && !search.get('kind') },
      { to: '/groups?kind=chama', label: 'Chamas', isActive: (path, search) => path.startsWith('/groups') && search.get('kind') === 'chama' },
      { to: '/groups?kind=sacco', label: 'SACCOs', isActive: (path, search) => path.startsWith('/groups') && search.get('kind') === 'sacco' },
    ],
  },
  {
    to: '/create',
    label: 'Start a Group',
    icon: PlusCircle,
    isSection: (path) => path.startsWith('/create'),
    pages: [
      { to: '/create', label: 'New Group', isActive: (path) => path.startsWith('/create') },
      { to: '/help#starting', label: 'How It Works', isActive: (path, _search, hash) => path === '/help' && hash === '#starting' },
    ],
  },
];

function WorkspaceNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  return (
    <nav className="flex flex-col gap-3" aria-label="Workspace">
      {WORKSPACE.map(({ to, label, icon: Icon, isSection, pages }) => {
        const inSection = isSection(location.pathname) || pages.some((page) => page.isActive(location.pathname, search, location.hash));
        if (collapsed) {
          return (
            <Link key={to} to={to} onClick={onNavigate} aria-current={inSection ? 'page' : undefined} className={navClass(inSection, true)} title={label}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">{label}</span>
            </Link>
          );
        }
        return (
          <div key={to}>
            <Link
              to={to}
              onClick={onNavigate}
              className={cn(
                'flex min-h-9 items-center gap-2.5 rounded-full px-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:text-chrome-foreground',
                inSection ? 'text-chrome-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
            <ul className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-border/60 pl-2">
              {pages.map((page) => {
                const on = page.isActive(location.pathname, search, location.hash);
                return (
                  <li key={page.to}>
                    <Link
                      to={page.to}
                      onClick={onNavigate}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        'flex min-h-12 items-center rounded-full px-3 text-sm font-semibold transition-colors',
                        on ? 'text-primary' : 'text-muted-foreground hover:bg-chrome-foreground/[0.06] hover:text-chrome-foreground',
                      )}
                    >
                      {page.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBody({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { active, memberships } = useMyMemberships();
  const groupId = isGroupWorkspacePath(location.pathname) ? getGroupIdFromPath(location.pathname) : null;
  const groupMembership = useGroupMembership(groupId ?? undefined);
  const currentGroup = memberships.find((item) => item.community.id === groupId)?.community;
  const listed = memberships.slice(0, 8);


  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-border/60', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Link to="/home" onClick={onNavigate} aria-label="My groups">
          {collapsed ? <BrandLogo size="sm" iconOnly /> : <BrandLogo size="sm" showIcon={false} lockup="protocol" />}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <WorkspaceNav collapsed={collapsed} onNavigate={onNavigate} />

        {listed.length > 0 ? (
          <div className="mt-6">
            {!collapsed ? <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Groups</p> : null}
            <nav className="flex flex-col gap-0.5" aria-label="Your groups">
              {listed.map(({ community, record }) => {
                const selected = community.id === groupId;
                return (
                  <Link key={community.id} to={`/dashboard/${community.id}`} onClick={onNavigate} className={navClass(selected, collapsed)} title={collapsed ? community.name : undefined}>
                    <InitialsTile initials={community.image} size="sm" />
                    <span className={cn('min-w-0 flex-1 truncate', collapsed && 'sr-only')}>{community.name}</span>
                    {!collapsed && record.status === 'pending' ? <StatusChip kind="pending" label="Pending" icon={null} /> : null}
                    {!collapsed && record.status === 'revoked' ? <StatusChip kind="hold" label="On Hold" icon={null} /> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}

        {groupId && !collapsed ? (
          <div className="mt-6">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{currentGroup?.name ?? 'This group'}</p>
            <GroupSidebarNav
              communityId={groupId}
              isMember={active.some((item) => item.community.id === groupId)}
              isOfficer={groupMembership.isOfficer}
              onNavigate={onNavigate}
            />
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="border-t border-border/60 px-3 py-3">
          <NavLink to="/help" onClick={onNavigate} className={({ isActive }) => navClass(isActive)}>
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
            Help
          </NavLink>
        </div>
      ) : null}
    </div>
  );
}

/** What the top bar says: where you are, and how you stand there. */
function useContext() {
  const location = useLocation();
  const { memberships } = useMyMemberships();
  const groupId = isGroupWorkspacePath(location.pathname) ? getGroupIdFromPath(location.pathname) : null;
  const membership = useGroupMembership(groupId ?? undefined);
  const group = memberships.find((item) => item.community.id === groupId)?.community;

  if (groupId) {
    const chip = membership.isLoading
      ? null
      : !membership.isMember
        ? <StatusChip kind="info" icon={null} label="Visitor" />
        : membership.isOfficer
          ? <StatusChip kind="confirmed" label="Officer" />
          : membership.status === 'pending'
            ? <StatusChip kind="pending" label="Pending" />
            : membership.status === 'suspended' || membership.status === 'revoked'
              ? <StatusChip kind="hold" label="On Hold" />
              : <StatusChip kind="confirmed" label="Active" />;
    return { title: group?.name ?? 'Group', subtitle: 'Dues, votes and money for this group.', chip };
  }
  const path = location.pathname;
  if (path.startsWith('/groups')) return { title: 'Browse Groups', subtitle: 'Find a group to join.', chip: null };
  if (path.startsWith('/create')) return { title: 'Start a Group', subtitle: 'Three steps, no fee in this environment.', chip: null };
  if (path.startsWith('/account')) return { title: 'Account', subtitle: 'Your name, country, language and notifications.', chip: null };
  if (path.startsWith('/help')) return { title: 'Help', subtitle: 'Short answers and a way to reach us.', chip: null };
  if (path.startsWith('/join')) return { title: 'Join a Group', subtitle: 'See the group, pay, and you are in.', chip: null };
  return { title: 'My Groups', subtitle: 'Open a group to see dues, votes and money.', chip: null };
}

function TopBar({ onOpenMenu, collapsed, onToggleCollapsed }: { onOpenMenu: () => void; collapsed: boolean; onToggleCollapsed: () => void }) {
  const ctx = useContext();
  return (
    <header className="z-40 shrink-0 rounded-chrome border border-border bg-chrome text-chrome-foreground shadow-[var(--shadow-deep)]">
      <div className="flex min-h-16 items-center gap-3 px-3 md:px-5">
        <Button type="button" variant="icon" size="icon" aria-label="Open menu" onClick={onOpenMenu} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="icon"
          size="icon"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
          onClick={onToggleCollapsed}
          className="hidden lg:inline-flex"
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-base font-bold md:text-lg">{ctx.title}</h1>
            {ctx.chip}
          </div>
          <p className="hidden truncate text-xs text-muted-foreground md:block">{ctx.subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <ThemeToggle />
          <AccountMenu />
          <LogoutMenu />
        </div>
      </div>
    </header>
  );
}

function AppBottomNav() {
  const location = useLocation();
  const groupId = isGroupWorkspacePath(location.pathname) ? getGroupIdFromPath(location.pathname) : null;
  const groupMembership = useGroupMembership(groupId ?? undefined);

  const item = (to: string, label: string, icon: typeof Home, exact = false) => {
    const active = exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
    const Icon = icon;
    return (
      <Link
        key={to}
        to={to}
        {...prefetchProps(to)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-12 flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {label}
      </Link>
    );
  };

  const slots = groupId && groupMembership.isMember
    ? [
        item(`/dashboard/${groupId}`, 'Home', Home, true),
        item(`/dashboard/${groupId}/pay`, 'Pay', CreditCard),
        item(`/dashboard/${groupId}/votes`, 'Votes', Vote),
        groupMembership.isOfficer ? item(`/dashboard/${groupId}/money`, 'Money', ReceiptText) : item(`/dashboard/${groupId}/people`, 'People', Users),
        item('/account', 'Account', CircleUserRound),
      ]
    : [
        item('/home', 'Groups', Home, true),
        item('/groups', 'Browse', Compass),
        item('/create', 'New Group', PlusCircle),
        item('/help', 'Help', HelpCircle),
        item('/account', 'Account', CircleUserRound),
      ];

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-40 rounded-chrome border border-border bg-chrome/95 text-chrome-foreground shadow-[var(--shadow-deep)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">{slots}</div>
    </nav>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-canvas p-3 md:p-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside
          className={cn(
            'hidden h-full shrink-0 rounded-chrome border border-border bg-chrome text-chrome-foreground shadow-[var(--shadow-deep)] transition-[width] duration-200 lg:flex lg:flex-col',
            collapsed ? 'w-[4.5rem]' : 'w-[16.5rem]',
          )}
        >
          <SidebarBody collapsed={collapsed} />
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-md" aria-label="Close menu" onClick={() => setOpen(false)} />
            <aside className="relative m-3 h-[calc(100%-1.5rem)] w-[16.5rem] max-w-[85vw] rounded-chrome border border-border bg-chrome text-chrome-foreground shadow-[var(--shadow-deep)]">
              <button type="button" className="btn-icon absolute right-3 top-3 z-10 h-12 w-12" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <TopBar onOpenMenu={() => setOpen(true)} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
          <OfflineBanner />
          <main id="main-content" key={location.pathname} className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-chrome border border-border bg-background pb-28 lg:pb-4" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <AppBottomNav />
      <BackendStatus />
    </div>
  );
}
