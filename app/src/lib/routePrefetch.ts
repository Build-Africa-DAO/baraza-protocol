/**
 * One place that knows which lazy chunk serves which route, so navigation
 * links can warm the chunk on hover, focus or touch and the transition feels
 * instant on a slow connection. `App.tsx` builds its `lazy()` components from
 * the same thunks, so a prefetch and the real import hit the same module.
 */
export const ROUTE_CHUNKS = {
  home: () => import('@/pages/Home'),
  groups: () => import('@/pages/Communities'),
  create: () => import('@/pages/CreateCommunity'),
  help: () => import('@/pages/Help'),
  account: () => import('@/pages/Profile'),
  status: () => import('@/pages/StatusDashboard'),
  join: () => import('@/pages/JoinDao'),
  joinStatus: () => import('@/pages/JoinStatus'),
  groupHome: () => import('@/pages/CommunityDashboard'),
  groupPay: () => import('@/pages/GroupPay'),
  groupVotes: () => import('@/pages/GroupVotes'),
  groupVote: () => import('@/pages/ProposalDetail'),
  groupPropose: () => import('@/pages/CreateDecision'),
  groupPeople: () => import('@/pages/GroupPeople'),
  groupMoney: () => import('@/pages/GroupMoney'),
  groupSettings: () => import('@/pages/GroupSettings'),
  groupMore: () => import('@/pages/GroupMore'),
} as const;

export type RouteChunk = keyof typeof ROUTE_CHUNKS;

const warmed = new Set<RouteChunk>();

/** Which chunk a path resolves to. Only member routes are mapped; others return null. */
export function chunkForPath(path: string): RouteChunk | null {
  const clean = path.split('?')[0].split('#')[0];
  if (clean === '/home') return 'home';
  if (clean.startsWith('/groups')) return 'groups';
  if (clean.startsWith('/create')) return 'create';
  if (clean.startsWith('/help')) return 'help';
  if (clean.startsWith('/account')) return 'account';
  if (clean.startsWith('/status')) return 'status';
  const join = clean.match(/^\/join\/[^/]+(\/status)?$/);
  if (join) return join[1] ? 'joinStatus' : 'join';
  const group = clean.match(/^\/dashboard\/[^/]+(?:\/([a-z]+))?(?:\/([^/]+))?$/);
  if (group) {
    const [, section, sub] = group;
    if (!section) return 'groupHome';
    if (section === 'pay') return 'groupPay';
    if (section === 'votes') return sub === 'new' ? 'groupPropose' : sub ? 'groupVote' : 'groupVotes';
    if (section === 'people') return 'groupPeople';
    if (section === 'money') return 'groupMoney';
    if (section === 'settings') return 'groupSettings';
    if (section === 'more') return 'groupMore';
  }
  return null;
}

/** Warm a route's chunk. Safe to call often; each chunk is fetched once. */
export function prefetchRoute(path: string): void {
  const chunk = chunkForPath(path);
  if (!chunk || warmed.has(chunk)) return;
  warmed.add(chunk);
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return; // respect Data Saver
  void ROUTE_CHUNKS[chunk]().catch(() => warmed.delete(chunk));
}

/** Spread onto a `<Link>`: warms the chunk on hover, keyboard focus or first touch. */
export function prefetchProps(to: string) {
  const warm = () => prefetchRoute(to);
  return { onMouseEnter: warm, onFocus: warm, onTouchStart: warm } as const;
}

/** Test helper. */
export function resetPrefetchForTests(): void {
  warmed.clear();
}
