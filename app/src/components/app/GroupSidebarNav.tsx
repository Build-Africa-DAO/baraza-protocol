import { Link, useLocation } from 'react-router-dom';
import type { ElementType } from 'react';
import {
  Activity,
  BriefcaseBusiness,
  CreditCard,
  Crown,
  Images,
  Layers,
  LayoutDashboard,
  Lightbulb,
  MapIcon,
  MoreHorizontal,
  PlusCircle,
  ReceiptText,
  Settings,
  Trophy,
  Users,
  Vote,
  Wallet as WalletIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchProps } from '@/lib/routePrefetch';

export type DashboardTab =
  | 'overview' | 'members' | 'roles' | 'suggestions'
  | 'governance' | 'leaderboard' | 'roadmap' | 'combined'
  | 'bounties' | 'gallery' | 'activity' | 'wallet' | 'settings';

interface TabDef {
  key: DashboardTab;
  label: string;
  icon: ElementType;
  nav: 'primary' | 'more';
}

/**
 * Retained so legacy `?tab=` URLs keep resolving to a known key. The sidebar no
 * longer renders from this list — §13.3 gives members four rows and officers two
 * more, and everything else lives under More.
 */
export const DASHBOARD_TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, nav: 'primary' },
  { key: 'governance', label: 'Decisions', icon: Vote, nav: 'primary' },
  { key: 'members', label: 'Members', icon: Users, nav: 'primary' },
  { key: 'activity', label: 'Activity', icon: Activity, nav: 'more' },
  { key: 'roles', label: 'Roles', icon: Crown, nav: 'more' },
  { key: 'suggestions', label: 'Suggestions', icon: Lightbulb, nav: 'more' },
  { key: 'leaderboard', label: 'Leaderboards', icon: Trophy, nav: 'more' },
  { key: 'roadmap', label: 'Roadmap', icon: MapIcon, nav: 'more' },
  { key: 'combined', label: 'Board', icon: Layers, nav: 'more' },
  { key: 'bounties', label: 'Bounties', icon: BriefcaseBusiness, nav: 'more' },
  { key: 'gallery', label: 'Gallery', icon: Images, nav: 'more' },
  { key: 'wallet', label: 'Account', icon: WalletIcon, nav: 'more' },
  { key: 'settings', label: 'Settings', icon: Settings, nav: 'more' },
];

const DASHBOARD_TAB_KEYS = new Set<DashboardTab>(DASHBOARD_TABS.map((tab) => tab.key));

export function getDashboardTab(searchParams: URLSearchParams, pathname: string): DashboardTab {
  const tab = searchParams.get('tab') as DashboardTab | null;
  if (tab && DASHBOARD_TAB_KEYS.has(tab)) return tab;
  return /\/dao\/[^/]+\/(?:proposals|vote)\/?$/.test(pathname) ? 'governance' : 'overview';
}

function NavLinkRow({
  to,
  icon: Icon,
  label,
  isActive,
  onNavigate,
}: {
  to: string;
  icon: ElementType;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      {...prefetchProps(to)}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex min-h-12 w-full items-center gap-2.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:bg-chrome-foreground/[0.06] hover:text-chrome-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/**
 * §13.3 group navigation: four member rows, then an Officer block for the two
 * screens that move money. Bounties, Gallery, Roadmap, Board, Leaderboards,
 * Suggestions and Roles are reachable through More, not the primary bar.
 */
export function GroupSidebarNav({
  communityId,
  isMember,
  isOfficer = false,
  onNavigate,
}: {
  communityId: string;
  isMember: boolean;
  isOfficer?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const path = location.pathname;
  const base = `/dashboard/${communityId}`;
  const isHome = path === base || path === `${base}/` || /^\/dao\/[^/]+\/?$/.test(path);

  const rows: { to: string; icon: ElementType; label: string; active: boolean }[] = [
    { to: base, icon: LayoutDashboard, label: 'Home', active: isHome },
    { to: `${base}/pay`, icon: CreditCard, label: 'Pay', active: path.startsWith(`${base}/pay`) },
    { to: `${base}/votes`, icon: Vote, label: 'Votes', active: path.startsWith(`${base}/votes`) },
    { to: `${base}/people`, icon: Users, label: 'People', active: path.startsWith(`${base}/people`) },
  ];

  const officerRows: { to: string; icon: ElementType; label: string; active: boolean }[] = [
    { to: `${base}/money`, icon: ReceiptText, label: 'Money', active: path.startsWith(`${base}/money`) },
    { to: `${base}/settings`, icon: Settings, label: 'Settings', active: path.startsWith(`${base}/settings`) },
  ];

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Group sections">
      {rows.map((row) => (
        <NavLinkRow key={row.to} {...row} isActive={row.active} onNavigate={onNavigate} />
      ))}

      {isOfficer && (
        <>
          <p className="mb-1 mt-3 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Officer
          </p>
          {officerRows.map((row) => (
            <NavLinkRow key={row.to} {...row} isActive={row.active} onNavigate={onNavigate} />
          ))}
        </>
      )}

      <div className="mt-3 border-t border-border/60 pt-3">
        <NavLinkRow
          to={`${base}/more`}
          icon={MoreHorizontal}
          label="More"
          isActive={path.startsWith(`${base}/more`)}
          onNavigate={onNavigate}
        />
      </div>

      {/* Group Home renders its own next-action card, so the nav CTA would be a
          second identical primary on that screen (§13.2). Show it elsewhere. */}
      {!isHome && (
      <div className="mt-3 border-t border-border/60 pt-3">
        {isMember ? (
          <Link
            to={`${base}/votes/new`}
            onClick={onNavigate}
            className="btn-wipe w-full gap-2 px-3 py-2 text-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Propose a Spend
          </Link>
        ) : (
          <Link
            to={`/join/${communityId}`}
            onClick={onNavigate}
            className="btn-wipe-outline w-full gap-2 px-3 py-2 text-xs"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Join This Group
          </Link>
        )}
      </div>
      )}
    </nav>
  );
}
