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

/**
 * What to do when a call comes back 401 after this tab had a working session:
 * the account layer opens sign-in and resolves once the person is back in, or
 * rejects when they close the sheet. `apiFetch` awaits it and replays the
 * request once, so a long draft is never lost to an expired token.
 */
export type AuthExpiredHandler = () => Promise<void>;

let authExpiredHandler: AuthExpiredHandler | null = null;
let reauthInFlight: Promise<void> | null = null;

export function registerAuthExpiredHandler(next: AuthExpiredHandler | null): void {
  authExpiredHandler = next;
}

/** Resolves when re-authenticated, rejects when dismissed. One prompt at a time. */
export async function requestReauth(): Promise<boolean> {
  if (!authExpiredHandler) return false;
  if (!reauthInFlight) {
    reauthInFlight = authExpiredHandler().finally(() => {
      reauthInFlight = null;
    });
  }
  try {
    await reauthInFlight;
    return true;
  } catch {
    return false;
  }
}

/** Test helper. */
export function resetTokenProviderForTests(): void {
  provider = null;
  hadSession = false;
  authExpiredHandler = null;
  reauthInFlight = null;
}
