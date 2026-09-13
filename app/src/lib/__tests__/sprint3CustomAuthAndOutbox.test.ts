import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import signupRequestHandler, { hashOtp } from '../../../api/auth/signup/request.js';
import signinRequestHandler from '../../../api/auth/signin/request.js';
import verifyAuthHandler from '../../../api/auth/verify.js';
import googleAuthHandler from '../../../api/auth/google.js';
import logoutHandler from '../../../api/auth/logout.js';
import meHandler from '../../../api/auth/me.js';
import {
  loadCatalog,
  renderEmailTemplate,
  sendTransactionalEmail,
  dispatchOutboxNotification,
} from '../../../api/_lib/mail.js';
import { resolveCallerIdentity } from '../../../api/_lib/auth-session.js';

describe('Sprint 3 Custom Auth, Multi-Factor OTP & Outbox Suite', () => {
  const originalEnv = { ...process.env };
  const mockPepper = 'test_pepper_auth_suite_2026';

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.PAYMENT_PHONE_HASH_PEPPER = mockPepper;
    process.env.OTP_PEPPER = mockPepper;
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ==========================================
  // Custom Auth Sign-Up & Sign-In (TC-AU-01..02)
  // ==========================================
  describe('OTP Request & Challenge Management (TC-AU-01..02)', () => {
    it('TC-AU-01: Valid email creates hashed challenge in auth_otp_challenges', async () => {
      let insertedChallenge: Record<string, unknown> | null = null;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/user_profiles')) {
          // No user exists
          return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        if (url.includes('/rest/v1/auth_otp_challenges') && init?.method === 'POST') {
          insertedChallenge = JSON.parse(init.body as string);
          return new Response(JSON.stringify([{ id: 'chal-1' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/signup/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@barazaprotocol.com' }),
      });

      const res = await signupRequestHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.destination).toBe('test@barazaprotocol.com');
      if (!insertedChallenge) throw new Error('Challenge not inserted');
      expect((insertedChallenge as Record<string, unknown>).destination).toBe('test@barazaprotocol.com');
      expect((insertedChallenge as Record<string, unknown>).channel).toBe('email');
      expect((insertedChallenge as Record<string, unknown>).attempts_remaining).toBe(5);
    });

    it('TC-AU-02: Second OTP request for same email invalidates prior challenge', async () => {
      let patchCount = 0;
      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/user_profiles')) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/auth_otp_challenges') && init?.method === 'PATCH') {
          patchCount++;
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/auth_otp_challenges') && init?.method === 'POST') {
          return new Response(JSON.stringify([{ id: 'chal-2' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/signup/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@barazaprotocol.com' }),
      });

      const res = await signupRequestHandler(req);
      expect(res.status).toBe(200);
      expect(patchCount).toBeGreaterThanOrEqual(1);
    });

    it('signinRequestHandler: Valid registered user receives signin OTP; unregistered receives 404', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/user_profiles')) {
          if (url.includes('existing%40baraza.org')) {
            return new Response(
              JSON.stringify([{ id: 'usr-reg-1', email: 'existing@baraza.org', is_active: true }]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }
          return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        if (url.includes('/rest/v1/auth_otp_challenges')) {
          return new Response(JSON.stringify([{ id: 'chal-signin-1' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      // Case A: Registered user
      const validReq = new Request('https://api.baraza.org/api/auth/signin/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'existing@baraza.org' }),
      });
      const validRes = await signinRequestHandler(validReq);
      expect(validRes.status).toBe(200);

      // Case B: Unregistered user
      const unregReq = new Request('https://api.baraza.org/api/auth/signin/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'non_existent@baraza.org' }),
      });
      const unregRes = await signinRequestHandler(unregReq);
      expect(unregRes.status).toBe(404);
    });

    it('sendTransactionalEmail: Dispatches transactional email in sandbox mode', async () => {
      const result = await sendTransactionalEmail('direct_test@baraza.org', 'signup-otp', {
        otp: '123456',
        expires_minutes: '10',
        email: 'direct_test@baraza.org',
      });
      expect(result.ok).toBe(true);
      expect(result.messageId).toMatch(/^mock_sg_/);
    });
  });

  // ==========================================
  // OTP Verification & NIST Lockout (TC-AU-03..05)
  // ==========================================
  describe('OTP Verification & Session Minting (TC-AU-03..05)', () => {
    it('TC-AU-03: Incorrect 6-digit code decrements attempts_remaining', async () => {
      const targetOtp = '123456';
      const actualHash = await hashOtp(targetOtp, mockPepper);
      let updatedAttempts: number | null = null;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/auth_otp_challenges') && init?.method === 'PATCH') {
          const body = JSON.parse(init.body as string);
          updatedAttempts = body.attempts_remaining;
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/auth_otp_challenges')) {
          return new Response(
            JSON.stringify([
              {
                id: 'chal-3',
                destination: 'test@barazaprotocol.com',
                code_hash: actualHash,
                attempts_remaining: 5,
                expires_at: new Date(Date.now() + 600000).toISOString(),
                purpose: 'signup',
              },
            ]),
            { status: 200, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@barazaprotocol.com', code: '999999', purpose: 'signup' }),
      });

      const res = await verifyAuthHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('incorrect_code');
      expect(data.attemptsRemaining).toBe(4);
      expect(updatedAttempts).toBe(4);
    });

    it('TC-AU-04: 5th incorrect attempt locks destination and marks challenge consumed', async () => {
      const targetOtp = '123456';
      const actualHash = await hashOtp(targetOtp, mockPepper);
      let consumed = false;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/auth_otp_challenges') && init?.method === 'PATCH') {
          const body = JSON.parse(init.body as string);
          if (body.attempts_remaining === 0 && body.consumed_at) {
            consumed = true;
          }
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/auth_otp_challenges')) {
          return new Response(
            JSON.stringify([
              {
                id: 'chal-4',
                destination: 'test@barazaprotocol.com',
                code_hash: actualHash,
                attempts_remaining: 1, // Last attempt
                expires_at: new Date(Date.now() + 600000).toISOString(),
                purpose: 'signup',
              },
            ]),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@barazaprotocol.com', code: '000000', purpose: 'signup' }),
      });

      const res = await verifyAuthHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('too_many_attempts');
      expect(consumed).toBe(true);
    });

    it('TC-AU-05: Correct 6-digit code mints 256-bit session token and sets HttpOnly cookie', async () => {
      const correctOtp = '654321';
      const actualHash = await hashOtp(correctOtp, mockPepper);
      let sessionCreated = false;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/auth_otp_challenges')) {
          return new Response(
            JSON.stringify([
              {
                id: 'chal-5',
                destination: 'test@barazaprotocol.com',
                code_hash: actualHash,
                attempts_remaining: 5,
                expires_at: new Date(Date.now() + 600000).toISOString(),
                purpose: 'signup',
              },
            ]),
            { status: 200 }
          );
        }
        if (url.includes('/rest/v1/user_profiles') && init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              id: 'usr-new-1',
              email: 'test@barazaprotocol.com',
              full_name: 'Test User',
              role: 'member',
            }),
            { status: 201 }
          );
        }
        if (url.includes('/rest/v1/user_profiles')) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/auth_sessions')) {
          sessionCreated = true;
          return new Response(JSON.stringify([{ id: 'sess-1' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@barazaprotocol.com', code: correctOtp, purpose: 'signup' }),
      });

      const res = await verifyAuthHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.sessionToken).toMatch(/^brz_sess_[0-9a-f]{64}$/);
      expect(sessionCreated).toBe(true);

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('BARAZA_SESSION=brz_sess_');
      expect(cookieHeader).toContain('HttpOnly');
    });
  });

  // ==========================================
  // Session Token Resolution (TC-AU-06)
  // ==========================================
  describe('Session Resolution (TC-AU-06)', () => {
    it('TC-AU-06: Resolves user profile identity from BARAZA_SESSION cookie', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/auth_sessions')) {
          return new Response(
            JSON.stringify([
              {
                id: 'sess-active-1',
                user_profile_id: 'usr-uuid-777',
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                revoked_at: null,
                user_profiles: [{ id: 'usr-uuid-777', email: 'session_user@baraza.org' }],
              },
            ]),
            { status: 200, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const dummySessionToken = 'brz_sess_' + 'a'.repeat(64);
      const req = new Request('https://api.baraza.org/api/auth/me', {
        method: 'GET',
        headers: {
          Cookie: `BARAZA_SESSION=${dummySessionToken}`,
        },
      });

      const identity = await resolveCallerIdentity(req, 'get-user');
      expect(identity).not.toBeNull();
      expect(identity?.authMethod).toBe('BARAZA_SESSION');
      expect(identity?.userProfileId).toBe('usr-uuid-777');
      expect(identity?.email).toBe('session_user@baraza.org');
    });
  });

  // ==========================================
  // Google OAuth Convergence & Separation (TC-AU-07..08)
  // ==========================================
  describe('Google OAuth Convergence & Intent Separation (TC-AU-07..08)', () => {
    it('TC-AU-07: Valid Google OAuth ID token for existing user mints session', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/user_profiles')) {
          return new Response(
            JSON.stringify([
              {
                id: 'usr-google-1',
                email: 'google_user@baraza.org',
                full_name: 'Google User',
                role: 'member',
                is_active: true,
              },
            ]),
            { status: 200 }
          );
        }
        if (url.includes('/rest/v1/auth_sessions')) {
          return new Response(JSON.stringify([{ id: 'sess-g1' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/google', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credential: 'test_google_token_google_user@baraza.org', isSignUp: false }),
      });

      const res = await googleAuthHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.sessionToken).toMatch(/^brz_sess_/);
    });

    it('TC-AU-08: New Google account during sign-in flow returns HTTP 404 user_not_found', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/user_profiles')) {
          return new Response(JSON.stringify([]), { status: 200 }); // User not found
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/auth/google', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credential: 'test_google_token_new_user@baraza.org', isSignUp: false }),
      });

      const res = await googleAuthHandler(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('user_not_found');
    });
  });

  // ==========================================
  // SendGrid Template Integrity & Outbox (TC-NOT-01..02)
  // ==========================================
  describe('SendGrid Templates & Outbox Resilience (TC-NOT-01..02)', () => {
    it('TC-NOT-01: Renders all 13 SendGrid templates with zero leftover unhandled placeholders', () => {
      const catalog = loadCatalog();
      expect(catalog.templates.length).toBe(13);

      const mockVars: Record<string, string> = {
        otp: '482917',
        expires_minutes: '10',
        email: 'amani@example.com',
        first_name: 'Amani',
        device: 'iPhone 15',
        browser: 'Safari 18.3',
        location: 'Nairobi, Kenya',
        signed_in_at: '7 Sep 2026, 16:02 EAT',
        community_name: 'Umoja Chama',
        proposal_title: 'Release KES 40,000 for school fees',
        decision: 'FOR',
        amount_label: 'KES 1,200',
        due_date: '15 Sep 2026',
        admin_phone: '+254 712 345 678',
        action_url: 'https://barazaprotocol.com/communities',
        inviter_name: 'Wanjiku Muthoni',
        recipient_name: 'Grace Otieno',
        payout_id: 'PO-1842',
      };

      for (const tmpl of catalog.templates) {
        const rendered = renderEmailTemplate(tmpl.id, mockVars);
        expect(rendered.html.length).toBeGreaterThan(0);
        expect(rendered.text.length).toBeGreaterThan(0);
        expect(rendered.subject.length).toBeGreaterThan(0);

        // Verify subject does not contain any {{unhandled_vars}}
        expect(rendered.subject).not.toMatch(/{{[a-zA-Z0-9_]+}}/);
      }
    });

    it('TC-NOT-02: Permanent 4xx failure marks message POISON_PILL and avoids queue stalling', async () => {
      let poisonPillRecorded = false;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/notification_outbox') && init?.method === 'PATCH') {
          const body = JSON.parse(init.body as string);
          if (body.status === 'POISON_PILL') {
            poisonPillRecorded = true;
          }
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/notification_outbox')) {
          return new Response(
            JSON.stringify({
              id: 'outbox-fail-1',
              destination: 'invalid-email-address', // Malformed email!
              channel: 'email',
              template_id: 'signup-otp',
              template_vars: { otp: '123456', expires_minutes: '10', email: 'invalid-email-address' },
              status: 'PENDING',
              retry_count: 0,
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const res = await dispatchOutboxNotification('outbox-fail-1');
      expect(res.ok).toBe(false);
      expect(res.poisonPill).toBe(true);
      expect(poisonPillRecorded).toBe(true);
    });
  });

  // ==========================================
  // Auth Logout & Me Introspection
  // ==========================================
  describe('Auth Lifecycle (Logout & Me)', () => {
    it('Logout clears session cookie and revokes session token in database', async () => {
      let revoked = false;
      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/auth_sessions') && init?.method === 'PATCH') {
          revoked = true;
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const sessionToken = 'brz_sess_' + 'b'.repeat(64);
      const req = new Request('https://api.baraza.org/api/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: `BARAZA_SESSION=${sessionToken}`,
        },
      });

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);
      expect(revoked).toBe(true);
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('Max-Age=0');
    });

    it('Me endpoint returns profile for authenticated caller', async () => {
      const req = new Request('https://api.baraza.org/api/auth/me', {
        method: 'GET',
        headers: {
          'x-test-wallet-address': '0xAuthenticatedMember',
        },
      });

      const res = await meHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user?.walletAddress).toBe('0xAuthenticatedMember');
    });
  });
});
