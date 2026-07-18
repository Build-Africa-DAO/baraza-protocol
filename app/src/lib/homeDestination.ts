interface HomeDestinationInput {
  communityIds: string[];
  identified: boolean;
  lastInterface: string | null;
}

export function getHomeDestination({
  communityIds,
  identified,
  lastInterface,
}: HomeDestinationInput): string {
  const communityId = communityIds[0];
  if (communityId) {
    const dashboardPath = `/dashboard/${communityId}`;
    return lastInterface === 'chat'
      ? `/akili?from=${encodeURIComponent(dashboardPath)}`
      : dashboardPath;
  }

  return identified ? '/akili?from=%2Fcommunities' : '/';
}

export function shouldShowHomeNavigation(currentPath: string, homePath: string): boolean {
  const currentPathname = currentPath.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
  const homePathname = homePath.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
  return currentPathname !== homePathname;
}
