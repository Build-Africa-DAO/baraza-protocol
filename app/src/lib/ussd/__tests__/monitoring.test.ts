import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classifyExit,
  hashPhoneForLogging,
  logSessionExit,
  sweepInvisibleUssdMembers,
} from '@/lib/ussd/monitoring';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Strip Supabase env so default branch is "no-op".
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.PAYMENT_PHONE_HASH_PEPPER;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('hashPhoneForLogging', () => {
  it('returns null when no pepper is configured', async () => {
    const h = await hashPhoneForLogging('+254712345678');
    expect(h).toBeNull();
  });

  it('returns a stable HMAC when pepper is set', async () => {
    process.env.PAYMENT_PHONE_HASH_PEPPER = 'test-pepper';
    const a = await hashPhoneForLogging('+254712345678');
    const b = await hashPhoneForLogging('+254712345678');
    expect(a).not.toBeNull();
    expect(a).toEqual(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different hashes for different phones', async () => {
    process.env.PAYMENT_PHONE_HASH_PEPPER = 'test-pepper';
    const a = await hashPhoneForLogging('+254712345678');
    const b = await hashPhoneForLogging('+254712999999');
    expect(a).not.toEqual(b);
  });
});

describe('classifyExit', () => {
  it('marks none/unknown for CON results with no welcome', () => {
    const { exitReason, welcomeState } = classifyExit({
      resultAction: 'CON',
      resultText: 'Baraza menu',
      welcomeWasPending: false,
      welcomeIsPendingAfter: false,
      smsFallbackQueued: false,
    });
    expect(exitReason).toBe('unknown');
    expect(welcomeState).toBe('none');
  });

  it('marks completed for END outside welcome', () => {
    const { exitReason, welcomeState } = classifyExit({
      resultAction: 'END',
      resultText: 'Your BRZA: 7',
      welcomeWasPending: false,
      welcomeIsPendingAfter: false,
      smsFallbackQueued: false,
    });
    expect(exitReason).toBe('completed');
    expect(welcomeState).toBe('none');
  });

  it('marks welcome_skipped when SMS fallback queued', () => {
    const { exitReason, welcomeState } = classifyExit({
      resultAction: 'END',
      resultText: 'Returning to Baraza menu. Dial *384# to continue.',
      welcomeWasPending: true,
      welcomeIsPendingAfter: false,
      smsFallbackQueued: true,
    });
    expect(exitReason).toBe('welcome_skipped');
    expect(welcomeState).toBe('skipped');
  });

  it('marks welcome_completed when welcome consumed without SMS', () => {
    const { exitReason, welcomeState } = classifyExit({
      resultAction: 'END',
      resultText: 'Welcome complete. You are with KYC.',
      welcomeWasPending: true,
      welcomeIsPendingAfter: false,
      smsFallbackQueued: false,
    });
    expect(exitReason).toBe('welcome_completed');
    expect(welcomeState).toBe('completed');
  });

  it('marks invalid_input on END with invalid text', () => {
    const { exitReason } = classifyExit({
      resultAction: 'END',
      resultText: 'Invalid selection.',
      welcomeWasPending: false,
      welcomeIsPendingAfter: false,
      smsFallbackQueued: false,
    });
    expect(exitReason).toBe('invalid_input');
  });
});

describe('logSessionExit env gating', () => {
  it('returns null with no Supabase env', async () => {
    process.env.PAYMENT_PHONE_HASH_PEPPER = 'p';
    const r = await logSessionExit({
      sessionId: 's',
      phoneNumber: '+254712345678',
      resultAction: 'END',
      exitReason: 'completed',
    });
    expect(r).toBeNull();
  });

  it('returns null with Supabase env but no pepper', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    const r = await logSessionExit({
      sessionId: 's',
      phoneNumber: '+254712345678',
      resultAction: 'END',
      exitReason: 'completed',
    });
    expect(r).toBeNull();
  });

  it('POSTs the row when fully configured', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.PAYMENT_PHONE_HASH_PEPPER = 'p';

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 201 }),
    );

    const hash = await logSessionExit({
      sessionId: 's-abc',
      phoneNumber: '+254712345678',
      countryCode: 'KE',
      resultAction: 'END',
      exitReason: 'welcome_completed',
      welcomeState: 'completed',
      lastMenuPath: '1*1*1*1',
      durationMs: 42,
    });

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/rest/v1/ussd_session_exits');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body));
    expect(body.session_id).toBe('s-abc');
    expect(body.phone_hash).toBe(hash);
    expect(body.exit_reason).toBe('welcome_completed');
    expect(body.last_menu_path).toBe('1*1*1*1');
    expect(body.welcome_state).toBe('completed');
  });
});

describe('sweepInvisibleUssdMembers env gating', () => {
  it('returns zero counts when Supabase is not configured', async () => {
    const r = await sweepInvisibleUssdMembers(30);
    expect(r).toEqual({ scanned: 0, flagged: 0 });
  });

  it('flags orders where no session_exit exists after confirmation', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const calls: string[] = [];
    vi.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);

      // First call: candidate fetch
      if (url.includes('payment_orders?') && url.includes('status=eq.RECONCILED')) {
        return new Response(
          JSON.stringify([
            { order_id: 'ord_1', user_id_hash: 'hash_invisible', confirmed_at: '2026-05-01T00:00:00Z' },
            { order_id: 'ord_2', user_id_hash: 'hash_visible', confirmed_at: '2026-05-01T00:00:00Z' },
          ]),
          { status: 200 },
        );
      }
      // Session-exit lookup for hash_invisible → no rows
      if (url.includes('ussd_session_exits') && url.includes('hash_invisible')) {
        return new Response('[]', { status: 200 });
      }
      // Session-exit lookup for hash_visible → one row
      if (url.includes('ussd_session_exits') && url.includes('hash_visible')) {
        return new Response('[{"id":"a"}]', { status: 200 });
      }
      // PATCH for the flagged order
      if (init?.method === 'PATCH') {
        return new Response(null, { status: 204 });
      }
      return new Response('[]', { status: 200 });
    });

    const r = await sweepInvisibleUssdMembers(30);
    expect(r.scanned).toBe(2);
    expect(r.flagged).toBe(1);
    expect(calls.some((c) => c.startsWith('PATCH') && c.includes('order_id=eq.ord_1'))).toBe(true);
    expect(calls.some((c) => c.startsWith('PATCH') && c.includes('order_id=eq.ord_2'))).toBe(false);
  });
});
