import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
  PlusCircle,
  ReceiptText,
  Settings,
  Trophy,
  Users,
  Vote,
  Wallet as WalletIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export const DASHBOARD_TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, nav: 'primary' },
  { key: 'governance', label: 'Decisions', icon: Vote, nav: 'primary' },
  { key: 'members', label: 'Members', icon: Users, nav: 'primary' },
  { key: 'activity', label: 'Activity', icon: Activity, nav: 'primary' },
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
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-surface hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function GroupSidebarNav({
  communityId,
  isMember,
  onNavigate,
}: {
  communityId: string;
  isMember: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const active = getDashboardTab(searchParams, location.pathname);
  const onFunds = location.pathname.endsWith('/treasury');
  const primary = DASHBOARD_TABS.filter((tab) => tab.nav === 'primary');
  const more = DASHBOARD_TABS.filter((tab) => tab.nav === 'more');

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Group sections">
      {primary.map((tab) => (
        <NavLinkRow
          key={tab.key}
          to={tab.key === 'overview' ? `/dashboard/${communityId}` : `/dashboard/${communityId}?tab=${tab.key}`}
          icon={tab.icon}
          label={tab.label}
          isActive={!onFunds && active === tab.key}
          onNavigate={onNavigate}
        />
      ))}

      <NavLinkRow
        to={`/dashboard/${communityId}/treasury`}
        icon={ReceiptText}
        label="Funds"
        isActive={onFunds}
        onNavigate={onNavigate}
      />

      <p className="mb-1 mt-3 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        More
      </p>
      {more.map((tab) => (
        <NavLinkRow
          key={tab.key}
          to={`/dashboard/${communityId}?tab=${tab.key}`}
          icon={tab.icon}
          label={tab.label}
          isActive={!onFunds && active === tab.key}
          onNavigate={onNavigate}
        />
      ))}

      <div className="mt-3 border-t border-border/60 pt-3">
        {isMember ? (
          <Link
            to={`/dashboard/${communityId}/decisions/create`}
            onClick={onNavigate}
            className="btn-wipe w-full gap-2 px-3 py-2 text-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New proposal
          </Link>
        ) : (
          <Link
            to={`/join/${communityId}`}
            onClick={onNavigate}
            className="btn-wipe-outline w-full gap-2 px-3 py-2 text-xs"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Join group
          </Link>
        )}
      </div>
    </nav>
  );
}
