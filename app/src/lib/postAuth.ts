export interface PostAuthMembership {
  communityId: string;
  status: string;
}

const STAY_PREFIXES = [
  '/home',
  '/profile',
  '/create',
  '/join',
  '/dashboard',
  '/dao',
  '/communities',
  '/bounties',
  '/evaluate',
  '/claim',
  '/admin',
  '/retro',
  '/status',
];

export function pathOnly(path: string): string {
  const trimmed = path.trim();
  const noQuery = trimmed.split('?')[0] ?? trimmed;
  const noHash = noQuery.split('#')[0] ?? noQuery;
  return noHash || '/';
}

export function isStayPath(pathname: string): boolean {
  const path = pathOnly(pathname);
  if (path === '/') return false;
  return STAY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isSafeReturnTo(value: string | null | undefined): value is string {
  if (!value) return false;
  const path = value.trim();
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//') || path.startsWith('/\\')) return false;
  if (path.startsWith('/api')) return false;
  return !path.includes('://');
}

export function currentLocationPath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

export function getGroupIdFromPath(pathname: string): string | null {
  const match = pathOnly(pathname).match(/^\/(?:dashboard|dao|join)\/([^/]+)/);
  return match?.[1] ?? null;
}

export function isGroupWorkspacePath(pathname: string): boolean {
  return /^\/(?:dashboard|dao)\//.test(pathOnly(pathname));
}

export function parseJoinTarget(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, 'https://barazaprotocol.com');
    const fromPath = getGroupIdFromPath(url.pathname);
    if (fromPath) return decodeURIComponent(fromPath);
  } catch {
    // Fall through to a raw community id.
  }

  if (/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,80}$/.test(trimmed)) return trimmed;
  return null;
}

export function resolvePostAuthPath(input: {
  entryPath: string;
  returnTo?: string | null;
  memberships: PostAuthMembership[];
}): string {
  if (isSafeReturnTo(input.returnTo) && isStayPath(input.returnTo)) {
    return input.returnTo;
  }

  const entry = input.entryPath.trim() || '/';
  if (isStayPath(entry)) return entry;

  const active = input.memberships.filter((membership) => membership.status === 'active');
  if (active.length === 1) return `/dashboard/${active[0].communityId}`;
  return '/home';
}
