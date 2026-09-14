import { apiFetch, type ApiError } from '@/lib/api';

/**
 * Baraza's own sign-in, against the routes shipped in `app/api/auth/*`:
 *
 *   POST /api/auth/signup/request  {email}                       → code emailed
 *   POST /api/auth/signin/request  {email}                       → code emailed
 *   POST /api/auth/verify          {email, code, purpose, fullName?} → {sessionToken, user}
 *   POST /api/auth/google          {credential, isSignUp}        → {sessionToken, user}
 *   GET  /api/auth/me                                            → {user, authMethod}
 *   POST /api/auth/logout
 *
 * The session token is held in memory only and sent as a bearer header. The
 * backend also sets an HttpOnly cookie; on a same-origin deployment that cookie
 * lets `restoreSession` recover the account after a reload without the app
 * ever storing the token. Cross-origin, the person signs in again.
 */

export type AuthPurpose = 'signup' | 'signin';

export interface BarazaUser {
  id: string;
  email: string | null;
  displayName: string;
  role: string | null;
}

interface RawUser {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  fullName?: string | null;
  role?: string | null;
}

let sessionToken: string | null = null;
let currentUser: BarazaUser | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((fn) => fn());
}

export function onBarazaAuthChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBarazaSessionToken(): string | null {
  return sessionToken;
}

export function getBarazaUser(): BarazaUser | null {
  return currentUser;
}

export function toBarazaUser(raw: RawUser | null | undefined): BarazaUser | null {
  if (!raw || typeof raw.id !== 'string') return null;
  const email = typeof raw.email === 'string' ? raw.email : null;
  const name = raw.full_name ?? raw.fullName ?? null;
  return {
    id: raw.id,
    email,
    displayName: (name && name.trim()) || email || 'Baraza member',
    role: typeof raw.role === 'string' ? raw.role : null,
  };
}

function setSession(token: string | null, user: BarazaUser | null): void {
  sessionToken = token;
  currentUser = user;
  emit();
}

export type AuthStep =
  | { ok: true }
  | { ok: false; error: ApiError; message: string };

export async function requestCode(input: { email: string; purpose: AuthPurpose }): Promise<AuthStep> {
  const email = input.email.trim().toLowerCase();
  const result = await apiFetch<{ ok?: boolean; expiresInMinutes?: number }>(`/api/auth/${input.purpose}/request`, {
    method: 'POST',
    body: { email },
    auth: 'omit',
  });
  if (!result.ok) return { ok: false, error: result.error, message: authErrorCopy(result.error, input.purpose) };
  return { ok: true };
}

export async function verifyCode(input: { email: string; code: string; purpose: AuthPurpose; fullName?: string }): Promise<AuthStep> {
  const result = await apiFetch<{ ok?: boolean; sessionToken?: string; user?: RawUser }>('/api/auth/verify', {
    method: 'POST',
    body: { email: input.email.trim().toLowerCase(), code: input.code, purpose: input.purpose, ...(input.fullName ? { fullName: input.fullName } : {}) },
    auth: 'omit',
  });
  if (!result.ok) return { ok: false, error: result.error, message: authErrorCopy(result.error, input.purpose) };
  const user = toBarazaUser(result.data?.user);
  if (!result.data?.sessionToken || !user) {
    const error: ApiError = { kind: 'unknown', status: result.status, code: 'no_session', message: 'Baraza did not return a session.', body: result.data };
    return { ok: false, error, message: error.message };
  }
  setSession(result.data.sessionToken, user);
  return { ok: true };
}

export async function signInWithGoogle(input: { credential: string; isSignUp: boolean }): Promise<AuthStep> {
  const result = await apiFetch<{ ok?: boolean; sessionToken?: string; user?: RawUser }>('/api/auth/google', {
    method: 'POST',
    body: { credential: input.credential, isSignUp: input.isSignUp },
    auth: 'omit',
  });
  const purpose: AuthPurpose = input.isSignUp ? 'signup' : 'signin';
  if (!result.ok) return { ok: false, error: result.error, message: authErrorCopy(result.error, purpose) };
  const user = toBarazaUser(result.data?.user);
  if (!result.data?.sessionToken || !user) {
    const error: ApiError = { kind: 'unknown', status: result.status, code: 'no_session', message: 'Baraza did not return a session.', body: result.data };
    return { ok: false, error, message: error.message };
  }
  setSession(result.data.sessionToken, user);
  return { ok: true };
}

/** Recover a session from the HttpOnly cookie (same-origin deployments). */
export async function restoreSession(): Promise<BarazaUser | null> {
  const result = await apiFetch<{ ok?: boolean; user?: RawUser; authMethod?: string }>('/api/auth/me', { auth: 'omit' });
  if (!result.ok || result.data?.authMethod !== 'BARAZA_SESSION') {
    setSession(null, null);
    return null;
  }
  const user = toBarazaUser(result.data.user);
  setSession(null, user);
  return user;
}

export async function logout(): Promise<void> {
  const token = sessionToken;
  setSession(null, null);
  await apiFetch('/api/auth/logout', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    auth: 'omit',
    body: {},
  });
}

/** Member-facing sentences for the auth routes' documented failures. */
export function authErrorCopy(error: ApiError, purpose: AuthPurpose): string {
  switch (error.code) {
    case 'account_exists':
      return 'An account with this email already exists. Sign in instead.';
    case 'user_not_found':
      return purpose === 'signin'
        ? 'No account uses this email yet. Create an account instead.'
        : 'No account uses this email yet.';
    case 'account_suspended':
      return 'This account has been suspended. Email hello@barazaprotocol.com.';
    case 'invalid_email':
      return 'Enter a valid email address.';
    case 'invalid_code':
      return 'That code has expired or was already used. Request a new one.';
    case 'incorrect_code': {
      const remaining = (error.body as { attemptsRemaining?: number } | null)?.attemptsRemaining;
      return typeof remaining === 'number'
        ? `That code is not right. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left before you need a new code.`
        : 'That code is not right. Check the email and try again.';
    }
    case 'too_many_attempts':
      return 'Too many wrong codes. Request a new code to continue.';
    case 'invalid_token':
      return 'Google did not confirm that sign-in. Try again.';
    case 'google_auth_failed':
      return 'Google could not be reached. Try again or use your email.';
    default:
      break;
  }
  if (error.kind === 'rate_limited') return 'Too many codes requested. Wait a few minutes and try again.';
  if (error.kind === 'misconfigured') return 'Sign-in is not set up on this deployment yet.';
  return error.message;
}

/** Test helper. */
export function resetBarazaAuthForTests(): void {
  sessionToken = null;
  currentUser = null;
  listeners.clear();
}
