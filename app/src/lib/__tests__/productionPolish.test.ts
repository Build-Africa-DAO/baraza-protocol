import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chunkForPath, prefetchRoute, resetPrefetchForTests } from '@/lib/routePrefetch';
import { summariseReadiness } from '@/hooks/useRailHealth';
import { statementRangeDates } from '@/pages/GroupMoney';
import { apiFetch } from '@/lib/api';
import { noteSessionState, registerAccessTokenProvider, registerAuthExpiredHandler, resetTokenProviderForTests } from '@/lib/auth/tokenProvider';

beforeEach(() => resetTokenProviderForTests());
afterEach(() => {
  vi.unstubAllGlobals();
  resetPrefetchForTests();
});

describe('route prefetch', () => {
  it('maps member paths to their lazy chunk', () => {
    expect(chunkForPath('/home')).toBe('home');
    expect(chunkForPath('/groups?kind=chama')).toBe('groups');
    expect(chunkForPath('/dashboard/abc')).toBe('groupHome');
    expect(chunkForPath('/dashboard/abc/pay')).toBe('groupPay');
    expect(chunkForPath('/dashboard/abc/votes')).toBe('groupVotes');
    expect(chunkForPath('/dashboard/abc/votes/new')).toBe('groupPropose');
    expect(chunkForPath('/dashboard/abc/votes/prop_1')).toBe('groupVote');
    expect(chunkForPath('/dashboard/abc/money')).toBe('groupMoney');
    expect(chunkForPath('/join/abc/status')).toBe('joinStatus');
    expect(chunkForPath('/admin')).toBeNull();
  });

  it('never throws for unknown paths', () => {
    expect(() => prefetchRoute('/nowhere')).not.toThrow();
  });
});

describe('rail health summary', () => {
  const healthy = { tier: 'hard', status: 'healthy', latency_ms: 5 } as const;
  it('is unknown without a body, unhealthy when the database is down, degraded on any soft rail', () => {
    expect(summariseReadiness(null)).toBe('unknown');
    expect(summariseReadiness({ status: 'ready', timestamp: '', cached: false, components: { database: healthy, stellar_horizon: healthy } })).toBe('healthy');
    expect(summariseReadiness({ status: 'not_ready', timestamp: '', cached: false, components: { database: { ...healthy, status: 'unhealthy' }, stellar_horizon: healthy } })).toBe('unhealthy');
    expect(summariseReadiness({ status: 'degraded', timestamp: '', cached: false, components: { database: healthy, stellar_horizon: { ...healthy, status: 'degraded' } } })).toBe('degraded');
  });
});

describe('statement ranges', () => {
  const now = new Date(2026, 8, 17); // 17 Sep 2026
  it('computes month, year and last quarter in local dates', () => {
    expect(statementRangeDates('all', now)).toEqual({});
    expect(statementRangeDates('month', now)).toEqual({ startDate: '2026-09-01', endDate: '2026-09-17' });
    expect(statementRangeDates('year', now)).toEqual({ startDate: '2026-01-01', endDate: '2026-09-17' });
    expect(statementRangeDates('quarter', now)).toEqual({ startDate: '2026-04-01', endDate: '2026-06-30' });
  });
});

describe('401 re-auth replay', () => {
  it('opens sign-in once and replays the request when the person is back', async () => {
    noteSessionState(true);
    let token = 'old';
    registerAccessTokenProvider(async () => token);
    const handler = vi.fn(async () => {
      token = 'new';
    });
    registerAuthExpiredHandler(handler);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: 'unauthorized' }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ ok: true, saved: true }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiFetch<{ saved: boolean }>('/api/governance/proposals', { method: 'POST', body: { title: 'draft' } });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer new' });
    expect(result.ok).toBe(true);
  });

  it('returns the 401 untouched when the person dismisses the sheet', async () => {
    noteSessionState(true);
    registerAccessTokenProvider(async () => 'old');
    registerAuthExpiredHandler(async () => {
      throw new Error('dismissed');
    });
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ error: 'unauthorized' }, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await apiFetch('/api/user/profile');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('auth');
  });

  it('does not prompt when there was never a session', async () => {
    const handler = vi.fn(async () => undefined);
    registerAuthExpiredHandler(handler);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'unauthorized' }, { status: 401 })));
    await apiFetch('/api/user/profile');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('content security policy', () => {
  it('allows the inline theme bootstrap in index.html by hash', async () => {
    const { readFileSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const { resolve } = await import('node:path');
    // vitest runs from app/, where index.html and public/ live.
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const headers = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8');
    const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
    expect(inline, 'index.html should carry exactly one inline classic script').toBeTruthy();
    const hash = createHash('sha256').update(inline ?? '').digest('base64');
    expect(headers).toContain(`'sha256-${hash}'`);
    // No other inline script may exist: the CSP has no 'unsafe-inline' for scripts.
    expect(html.match(/<script>/g)).toHaveLength(1);
  });
});
