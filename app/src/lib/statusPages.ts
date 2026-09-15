export type StatusKind =
  | 'not-found'
  | 'community'
  | 'bounty'
  | 'unauthorized'
  | 'forbidden'
  | 'server';

export type StatusActionIcon = 'home' | 'compass' | 'refresh' | 'login' | 'shield' | 'trophy' | 'arrow-left';

export interface StatusActionSpec {
  label: string;
  to?: string;
  icon?: StatusActionIcon;
}

export interface StatusCopy {
  code: string;
  title: string;
  description: string;
  seoTitle: string;
  primary: StatusActionSpec;
  secondary?: StatusActionSpec;
}

export const STATUS_COPY: Record<StatusKind, StatusCopy> = {
  'not-found': {
    code: '404',
    title: "This Page Isn't Part of Baraza.",
    description:
      "The page you're looking for may have moved or never existed. Head back to explore communities or launch your own.",
    seoTitle: 'Page Not Found',
    primary: { label: 'Go Home', to: '/', icon: 'home' },
    secondary: { label: 'Browse Groups', to: '/groups', icon: 'compass' },
  },
  community: {
    code: '404',
    title: "This Community Isn't on Baraza.",
    description:
      'This group may have been removed, the invite may be incomplete, or it is not available yet.',
    seoTitle: 'Community Not Found',
    primary: { label: 'Browse Groups', to: '/groups', icon: 'compass' },
    secondary: { label: 'Go Home', to: '/', icon: 'home' },
  },
  bounty: {
    code: '404',
    title: "This Bounty Isn't on Baraza.",
    description: 'This bounty may have been removed or the link may be incomplete.',
    seoTitle: 'Bounty Not Found',
    primary: { label: 'Browse Bounties', to: '/bounties', icon: 'trophy' },
    secondary: { label: 'Browse Groups', to: '/groups', icon: 'compass' },
  },
  unauthorized: {
    code: '401',
    title: 'Sign in to Continue.',
    description: 'Log in to your Baraza account to open this page.',
    seoTitle: 'Sign In Required',
    primary: { label: 'Sign In', to: '/account', icon: 'login' },
    secondary: { label: 'Go Home', to: '/', icon: 'home' },
  },
  forbidden: {
    code: '403',
    title: 'This Area Is Reserved.',
    description:
      "Your account doesn't have permission to open this page. If you should, ask a Baraza operator.",
    seoTitle: 'Access Restricted',
    primary: { label: 'Go Home', to: '/', icon: 'home' },
    secondary: { label: 'Browse Groups', to: '/groups', icon: 'compass' },
  },
  server: {
    code: '500',
    title: 'Something Went Wrong.',
    description: 'Baraza hit an unexpected error. Try again, or head home while we sort it out.',
    seoTitle: 'Server Error',
    primary: { label: 'Try Again', icon: 'refresh' },
    secondary: { label: 'Go Home', to: '/', icon: 'home' },
  },
};
