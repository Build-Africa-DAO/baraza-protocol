import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_COPY, apiFetch, apiUrl, createSubmitGuard, errorField, normalizeApiError } from '@/lib/api';
import { noteSessionState, registerAccessTokenProvider, resetTokenProviderForTests } from '@/lib/auth/tokenProvider';

/**
 * Contract tests for the one API client. The shapes below are the ones the
 * backend actually returns (see docs/FRONTEND_BACKEND_INTEGRATION.md §6.7).
 */

beforeEach(() => {
  resetTokenProviderForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('apiUrl', () => {
  it('leaves relative paths alone when no base is configured', () => {
    vi.stubEnv('VITE_API_BASE', '');
    expect(apiUrl('/api/health/ready')).toBe('/api/health/ready');
  });

  it('prefixes /api paths with VITE_API_BASE and strips a trailing slash', () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.barazaprotocol.com/');
    expect(apiUrl('/api/health/ready')).toBe('https://api.barazaprotocol.com/api/health/ready');
    expect(apiUrl('/logo.png')).toBe('/logo.png');
    expect(apiUrl('https://elsewhere.example/x')).toBe('https://elsewhere.example/x');
  });
});

describe('normalizeApiError', () => {
  it('reads the canonical {error, message} shape', () => {
    const error = normalizeApiError(409, { error: 'already_voted', message: 'You already voted.' });
    expect(error.kind).toBe('conflict');
    expect(error.code).toBe('already_voted');
    expect(error.message).toBe('You already voted.');
  });

  it('treats a bare {error} code as the code and supplies member copy', () => {
    const error = normalizeApiError(403, { error: 'forbidden' });
    expect(error.code).toBe('forbidden');
    expect(error.message).toBe(API_COPY.forbidden);
  });

  it('keeps a raw database sentence in {error} as the message, not the code', () => {
    const error = normalizeApiError(500, { error: 'duplicate key value violates unique constraint "x"' });
    expect(error.code).toBe('server');
    expect(error.message).toContain('duplicate key');
  });

  it('maps Akili {category, message} to the code', () => {
    const error = normalizeApiError(502, { category: 'rate_limited', message: 'slow down' });
    expect(error.code).toBe('rate_limited');
  });

  it('never surfaces server one-word sentences', () => {
    expect(normalizeApiError(400, 'Bad Request').message).toBe(API_COPY.validation);
    expect(normalizeApiError(405, 'Method not allowed').message).toBe(API_COPY.validation);
  });

  it('says misconfigured on 503 and never asks the person to retry', () => {
    const error = normalizeApiError(503, { error: 'intent_signing_not_configured', message: 'STELLAR_INTENT_SECRET missing' });
    expect(error.kind).toBe('misconfigured');
    expect(error.code).toBe('intent_signing_not_configured');
    expect(error.message).toBe(API_COPY.misconfigured);
  });

  it('reads Retry-After on 429 and uses the rate-limit copy', () => {
    const error = normalizeApiError(429, { error: 'rate_limited' }, '', '60');
    expect(error.kind).toBe('rate_limited');
    expect(error.retryAfterSec).toBe(60);
    expect(error.message).toBe(API_COPY.rate_limited);
  });

  it('marks 410 as gone for expired and used-up invites', () => {
    expect(normalizeApiError(410, { error: 'capacity_exhausted' }).kind).toBe('gone');
  });

  it('explains a 401 differently once a session has existed', () => {
    expect(normalizeApiError(401, { error: 'unauthorized' }).message).toBe(API_COPY.auth);
    noteSessionState(true);
    expect(normalizeApiError(401, { error: 'unauthorized' }).message).toBe(API_COPY.authExpired);
  });
});

describe('apiFetch', () => {
  it('sends JSON with the registered bearer token and parses the reply', async () => {
    registerAccessTokenProvider(async () => 'brz_sess_abc');
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, id: 'x' }, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiFetch<{ ok: boolean; id: string }>('/api/communities', { method: 'POST', body: { name: 'Umoja' } });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe('x');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/communities');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'Umoja' }));
    expect(init.headers).toMatchObject({ 'content-type': 'application/json', Authorization: 'Bearer brz_sess_abc' });
  });

  it('omits the token when asked and defaults to GET without a body', async () => {
    registerAccessTokenProvider(async () => 'tok');
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: 'ready' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/health/ready', { auth: 'omit' });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('returns a normalised error for HTTP failures and keeps the body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'treasury_circuit_breaker_active', message: 'frozen', circuitBreaker: true }, { status: 403 })),
    );
    const result = await apiFetch('/api/governance/execute', { method: 'POST', body: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('treasury_circuit_breaker_active');
      expect(errorField<boolean>(result.error, 'circuitBreaker')).toBe(true);
    }
  });

  it('treats an HTTP 200 Akili {category} body as an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ category: 'credits_exhausted', message: 'out of credits' })));
    const result = await apiFetch('/api/agent/chat', { method: 'POST', body: { message: 'hi' } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('credits_exhausted');
      expect(result.error.message).toBe('out of credits');
    }
  });

  it('returns a network error instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const result = await apiFetch('/api/user/profile');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(0);
      expect(result.error.kind).toBe('network');
      expect(result.error.message).toBe(API_COPY.network);
    }
  });

  it('reads text bodies when asked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"a":1}\n{"a":2}\n', { status: 200 })));
    const result = await apiFetch<string>('/api/communities/statement?format=ndjson', { parse: 'text' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.split('\n').filter(Boolean)).toHaveLength(2);
  });
});

describe('createSubmitGuard', () => {
  it('runs one request at a time per key and resolves the duplicate to undefined', async () => {
    const guard = createSubmitGuard();
    let calls = 0;
    let release: () => void = () => undefined;
    const first = guard.run('pay', () => {
      calls += 1;
      return new Promise<string>((resolve) => {
        release = () => resolve('done');
      });
    });
    const second = await guard.run('pay', async () => {
      calls += 1;
      return 'second';
    });
    expect(second).toBeUndefined();
    expect(guard.isPending('pay')).toBe(true);
    release();
    expect(await first).toBe('done');
    expect(calls).toBe(1);
    expect(guard.isPending('pay')).toBe(false);
  });
});
