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
  group?: string;
}

export const DASHBOARD_TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'roles', label: 'Roles', icon: Crown, group: 'Community' },
  { key: 'suggestions', label: 'Suggestions', icon: Lightbulb, group: 'Community' },
  { key: 'leaderboard', label: 'Leaderboards', icon: Trophy, group: 'Community' },
  { key: 'roadmap', label: 'Roadmap', icon: MapIcon, group: 'Community' },
  { key: 'combined', label: 'Board', icon: Layers, group: 'Community' },
  { key: 'governance', label: 'Governance', icon: Vote, group: 'Work' },
  { key: 'bounties', label: 'Bounties', icon: BriefcaseBusiness, group: 'Work' },
  { key: 'members', label: 'Members', icon: Users, group: 'Work' },
  { key: 'gallery', label: 'Gallery', icon: Images, group: 'Work' },
  { key: 'activity', label: 'Activity', icon: Activity, group: 'Work' },
  { key: 'wallet', label: 'Account', icon: WalletIcon, group: 'Work' },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const DASHBOARD_TAB_KEYS = new Set<DashboardTab>(DASHBOARD_TABS.map((tab) => tab.key));

export function getDashboardTab(searchParams: URLSearchParams, pathname: string): DashboardTab {
  const tab = searchParams.get('tab') as DashboardTab | null;
  if (tab && DASHBOARD_TAB_KEYS.has(tab)) return tab;
  return /\/dao\/[^/]+\/(?:proposals|vote)\/?$/.test(pathname) ? 'governance' : 'overview';
}

const GROUPS = ['__top__', 'Community', 'Work', '__bottom__'];

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

  const byGroup = new Map<string, TabDef[]>();
  for (const tab of DASHBOARD_TABS) {
    const group = tab.group ?? (tab.key === 'settings' ? '__bottom__' : '__top__');
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group)!.push(tab);
  }

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Group sections">
      {GROUPS.map((group) => {
        const items = byGroup.get(group) ?? [];
        if (!items.length) return null;
        return (
          <div key={group}>
            {group !== '__top__' && group !== '__bottom__' && (
              <p className="mb-1 mt-3 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {group}
              </p>
            )}
            {group === '__bottom__' && <div className="my-3 border-t border-border/60" />}
            {items.map((tab) => {
              const Icon = tab.icon;
              const isActive = active === tab.key;
              const to = tab.key === 'overview'
                ? `/dashboard/${communityId}`
                : `/dashboard/${communityId}?tab=${tab.key}`;
              return (
                <Link
                  key={tab.key}
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
                  <span className="truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}

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
