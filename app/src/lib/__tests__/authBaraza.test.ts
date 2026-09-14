import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authErrorCopy,
  getBarazaSessionToken,
  getBarazaUser,
  logout,
  requestCode,
  resetBarazaAuthForTests,
  restoreSession,
  signInWithGoogle,
  toBarazaUser,
  verifyCode,
} from '@/lib/auth/baraza';
import { normalizeApiError } from '@/lib/api';

/** Contracts as shipped in app/api/auth/* on the backend branch. */

beforeEach(() => {
  resetBarazaAuthForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('requestCode', () => {
  it('posts the lowercased email to the purpose route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, destination: 'amani@example.com', expiresInMinutes: 10 }));
    vi.stubGlobal('fetch', fetchMock);

    const step = await requestCode({ email: ' Amani@Example.com ', purpose: 'signup' });

    expect(step.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/signup/request');
    expect(JSON.parse(init.body as string)).toEqual({ email: 'amani@example.com' });
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('turns 409 account_exists into a sentence that points at Sign In', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'account_exists', message: 'exists' }, { status: 409 })));
    const step = await requestCode({ email: 'a@b.co', purpose: 'signup' });
    expect(step.ok).toBe(false);
    if (!step.ok) expect(step.message).toMatch(/already exists\. Sign in instead/);
  });

  it('turns 404 user_not_found on sign-in into a Create Account nudge', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'user_not_found' }, { status: 404 })));
    const step = await requestCode({ email: 'a@b.co', purpose: 'signin' });
    expect(step.ok).toBe(false);
    if (!step.ok) expect(step.message).toMatch(/Create an account instead/);
  });
});

describe('verifyCode', () => {
  it('stores the session token and user from the verify response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ ok: true, sessionToken: 'brz_sess_' + 'a'.repeat(64), user: { id: 'u1', email: 'a@b.co', full_name: 'Amani', role: 'member' } }),
      ),
    );
    const step = await verifyCode({ email: 'a@b.co', code: '123456', purpose: 'signin' });
    expect(step.ok).toBe(true);
    expect(getBarazaSessionToken()).toMatch(/^brz_sess_/);
    expect(getBarazaUser()).toEqual({ id: 'u1', email: 'a@b.co', displayName: 'Amani', role: 'member' });
  });

  it('reports attempts remaining on a wrong code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'incorrect_code', message: 'x', attemptsRemaining: 2 }, { status: 400 })));
    const step = await verifyCode({ email: 'a@b.co', code: '000000', purpose: 'signin' });
    expect(step.ok).toBe(false);
    if (!step.ok) expect(step.message).toContain('2 attempts left');
    expect(getBarazaSessionToken()).toBeNull();
  });

  it('asks for a new code after too many attempts or an expired code', () => {
    expect(authErrorCopy(normalizeApiError(400, { error: 'too_many_attempts' }), 'signin')).toMatch(/Request a new code/);
    expect(authErrorCopy(normalizeApiError(400, { error: 'invalid_code' }), 'signin')).toMatch(/expired|already used/);
  });
});

describe('signInWithGoogle', () => {
  it('posts credential and isSignUp and stores the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ ok: true, sessionToken: 'brz_sess_x', user: { id: 'u2', email: 'g@b.co', fullName: 'G User', role: 'member' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const step = await signInWithGoogle({ credential: 'id-token', isSignUp: true });
    expect(step.ok).toBe(true);
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ credential: 'id-token', isSignUp: true });
    expect(getBarazaUser()?.displayName).toBe('G User');
  });
});

describe('restoreSession and logout', () => {
  it('restores a user only from a Baraza session cookie', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true, user: { id: 'u3', email: 'c@b.co', full_name: 'C' }, authMethod: 'BARAZA_SESSION' })));
    const user = await restoreSession();
    expect(user?.id).toBe('u3');
    expect(getBarazaSessionToken()).toBeNull(); // the cookie keeps authenticating same-origin
  });

  it('ignores a Privy identity on /me', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true, user: { privyDid: 'did:privy:1' }, authMethod: 'PRIVY_BEARER' })));
    expect(await restoreSession()).toBeNull();
  });

  it('clears the session before calling logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true, sessionToken: 'brz_sess_y', user: { id: 'u4', email: 'd@b.co' } })));
    await verifyCode({ email: 'd@b.co', code: '111111', purpose: 'signin' });
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await logout();
    expect(getBarazaUser()).toBeNull();
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer brz_sess_y' });
  });
});

describe('toBarazaUser', () => {
  it('falls back to the email, then to a neutral name', () => {
    expect(toBarazaUser({ id: 'a', email: 'x@y.z' })?.displayName).toBe('x@y.z');
    expect(toBarazaUser({ id: 'a' })?.displayName).toBe('Baraza member');
    expect(toBarazaUser({})).toBeNull();
  });
});
