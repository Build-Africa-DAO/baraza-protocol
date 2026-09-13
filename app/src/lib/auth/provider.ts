/**
 * Which sign-in provider the app mounts.
 *
 * `privy` (default) keeps the Privy modal and JWT. `baraza` uses the backend's
 * own email codes, Google Identity Services and `brz_sess_` bearer tokens
 * (`lib/auth/baraza.ts`). Flip with `VITE_AUTH_PROVIDER=baraza` once the
 * backend's `user_profiles` migration for email accounts has landed.
 */
export type AuthProviderName = 'privy' | 'baraza';

export function getAuthProvider(): AuthProviderName {
  const raw = (import.meta.env.VITE_AUTH_PROVIDER as string | undefined)?.trim().toLowerCase();
  return raw === 'baraza' ? 'baraza' : 'privy';
}

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? '';
}
