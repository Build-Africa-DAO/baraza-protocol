import type { DashboardTab } from '@/components/app/GroupSidebarNav';

/**
 * §13.25 of `frontend-screens.md`: the member workspace moved from one page with
 * thirteen `?tab=` values to named routes. Every old URL still resolves — people
 * have these in WhatsApp threads, emails and SMS.
 */

/** Secondary surfaces that keep their component but move under `/more`. */
export const MORE_TABS = [
  'activity',
  'roles',
  'suggestions',
  'leaderboard',
  'roadmap',
  'combined',
  'bounties',
] as const;

export type MoreTab = (typeof MORE_TABS)[number];

export function isMoreTab(tab: string | null | undefined): tab is MoreTab {
  return MORE_TABS.includes(tab as MoreTab);
}

/**
 * Where a legacy `?tab=` value now lives. Returns null when the tab is already
 * the canonical group home, so the caller can render rather than redirect.
 */
export function legacyTabDestination(communityId: string, tab: string | null): string | null {
  if (!tab || tab === 'overview') return null;

  switch (tab) {
    case 'governance':
      return `/dashboard/${communityId}/votes`;
    case 'members':
      return `/dashboard/${communityId}/people`;
    case 'settings':
      return `/dashboard/${communityId}/settings`;
    // The per-group "Account" tab was always the person, not the group.
    case 'wallet':
      return '/account';
    // The gallery was stock photos captioned as the group's own; the tab is
    // gone, but the links in old messages still land on More.
    case 'gallery':
      return `/dashboard/${communityId}/more`;
    default:
      return isMoreTab(tab) ? `/dashboard/${communityId}/more?tab=${tab}` : null;
  }
}

/** Canonical path for a group section, used by the sidebar and bottom nav. */
export function groupPath(communityId: string, section?: 'pay' | 'votes' | 'people' | 'money' | 'settings' | 'more'): string {
  return section ? `/dashboard/${communityId}/${section}` : `/dashboard/${communityId}`;
}

/**
 * Legacy top-level URLs. Kept as a table so the redirect test can assert every
 * row rather than spot-checking a few.
 */
export const LEGACY_ROUTES: ReadonlyArray<{ from: string; to: string }> = [
  { from: '/communities', to: '/groups' },
  { from: '/profile', to: '/account' },
  { from: '/evaluate', to: '/help#records' },
  { from: '/create/purpose', to: '/create' },
  { from: '/proposals', to: '/groups' },
  { from: '/vote', to: '/groups' },
];

/** Legacy group-scoped URLs, expressed as a function of the group id. */
export function legacyGroupRoutes(communityId: string): ReadonlyArray<{ from: string; to: string }> {
  return [
    { from: `/dashboard/${communityId}/treasury`, to: `/dashboard/${communityId}/money` },
    { from: `/dashboard/${communityId}/disbursements`, to: `/dashboard/${communityId}/money?send=1` },
    { from: `/dashboard/${communityId}/compliance`, to: `/dashboard/${communityId}/settings#license` },
    { from: `/dashboard/${communityId}/decisions/create`, to: `/dashboard/${communityId}/votes/new` },
    { from: `/dao/${communityId}`, to: `/dashboard/${communityId}` },
    { from: `/dao/${communityId}/proposals`, to: `/dashboard/${communityId}/votes` },
    { from: `/dao/${communityId}/vote`, to: `/dashboard/${communityId}/votes` },
  ];
}

/** The group nav rows a member sees, in order. Officer rows are appended separately. */
export const MEMBER_NAV: ReadonlyArray<{ key: DashboardTab | 'pay' | 'money'; label: string; section?: 'pay' | 'votes' | 'people' }> = [
  { key: 'overview', label: 'Home' },
  { key: 'pay', label: 'Pay', section: 'pay' },
  { key: 'governance', label: 'Votes', section: 'votes' },
  { key: 'members', label: 'People', section: 'people' },
];
