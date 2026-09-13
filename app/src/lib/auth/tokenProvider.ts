/**
 * One place the API client asks for a bearer token.
 *
 * The signed-in provider (Privy today, the Baraza session after the auth swap)
 * registers a function here; `apiFetch` calls it on every authenticated
 * request. Nothing else in the app needs to know which provider is active.
 */
export type AccessTokenProvider = () => Promise<string | null>;

let provider: AccessTokenProvider | null = null;
let hadSession = false;

export function registerAccessTokenProvider(next: AccessTokenProvider | null): void {
  provider = next;
}

export async function getAccessToken(): Promise<string | null> {
  if (!provider) return null;
  try {
    return await provider();
  } catch {
    return null;
  }
}

/**
 * Remember that this tab once held a working session. A later 401 then reads
 * as "signed out somewhere else" (the backend keeps five sessions per account
 * and revokes the oldest) rather than "you were never signed in".
 */
export function noteSessionState(authenticated: boolean): void {
  if (authenticated) hadSession = true;
}

export function hadWorkingSession(): boolean {
  return hadSession;
}

/** Test helper. */
export function resetTokenProviderForTests(): void {
  provider = null;
  hadSession = false;
}
