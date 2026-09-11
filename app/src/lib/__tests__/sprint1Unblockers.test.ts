import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import minisendHandler from '../../../api/payments/minisend.js';
import executeProposalHandler from '../../../api/governance/execute.js';
import dynamicInvitesHandler from '../../../api/communities/[id]/invites.js';
import readyHandler, { resetReadinessCache } from '../../../api/health/ready.js';

describe('Sprint 1 Unblockers Automated Test Suite', () => {
  const originalEnv = { ...process.env };
  const mockProxySecret = 'test_proxy_secret_sprint1_verified';
  const mockApiKey = 'ms_live_test_api_key_sprint1';

  beforeEach(() => {
    vi.resetAllMocks();
    resetReadinessCache();
    process.env.PAYMENT_ADAPTER_PROXY_SECRET = mockProxySecret;
    process.env.MINISEND_API_KEY = mockApiKey;
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ==========================================
  // Minisend Auth & Ceiling Guard (TC-MS-01..05)
  // ==========================================
  describe('Minisend Endpoint Security & Validation (TC-MS-01..05)', () => {
    it('TC-MS-01: No Authorization header and no wallet proof returns HTTP 401', async () => {
      const req = new Request('https://api.baraza.org/api/payments/minisend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+254712345678', usdcAmount: '10.0', chain: 'stellar' }),
      });

      const res = await minisendHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('invalid_request');
      expect(data.message).toMatch(/restricted to trusted server calls or verified sessions/i);
    });

    it('TC-MS-02: String with length > 32 in x-wallet-proof fails with HTTP 401 (proves dummy string bypass is neutralized)', async () => {
      const dummy33CharString = 'session:123456789012345678901234567890123';
      expect(dummy33CharString.length).toBeGreaterThan(32);

      const req = new Request('https://api.baraza.org/api/payments/minisend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-wallet-proof': dummy33CharString,
        },
        body: JSON.stringify({ phone: '+254712345678', usdcAmount: '10.0', chain: 'stellar' }),
      });

      const res = await minisendHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('invalid_request');
    });

    it('TC-MS-03: Authorization: Bearer <PAYMENT_ADAPTER_PROXY_SECRET> passes auth gate and validates payload', async () => {
      const req = new Request('https://api.baraza.org/api/payments/minisend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${mockProxySecret}`,
        },
        body: JSON.stringify({}), // Empty body to trigger payload validation
      });

      const res = await minisendHandler(req);
      // Fails with HTTP 400 bad request due to missing phone/amount, proving auth gate was passed!
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toMatch(/phone, usdcAmount, and a supported chain/i);
    });

    it('TC-MS-04: Authorization: Bearer <privy_token> passes auth gate via Option A caller identity', async () => {
      const req = new Request('https://api.baraza.org/api/payments/minisend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer test_privy_token_user123',
        },
        body: JSON.stringify({}),
      });

      const res = await minisendHandler(req);
      // Bypasses 401 auth gate and hits 400 validation error
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toMatch(/phone, usdcAmount, and a supported chain/i);
    });

    it('TC-MS-05: Single payout exceeding KES 250,000 ceiling returns HTTP 422 with telco ceiling guard', async () => {
      // 2,500 USDC * 130.50 KES/USDC = 326,250 KES > 250,000 KES
      const req = new Request('https://api.baraza.org/api/payments/minisend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${mockProxySecret}`,
        },
        body: JSON.stringify({
          phone: '+254712345678',
          usdcAmount: '2500.0',
          chain: 'stellar',
          currency: 'KES',
        }),
      });

      const res = await minisendHandler(req);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.message).toMatch(/exceeds the maximum telco single-transaction limit/i);
      expect(data.maxAllowedMinor).toBe(25000000);
    });
  });

  // ==========================================
  // Governance Execution Circuit Breaker (TC-EX-01..04)
  // ==========================================
  describe('Governance Execution & Circuit Breaker (TC-EX-01..04)', () => {
    it('TC-EX-01: Passed proposal on active, solvent community executes with HTTP 200', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/proposals')) {
          return new Response(
            JSON.stringify([
              {
                id: 'prop-solvent-1',
                community_id: 'comm-alpha',
                status: 'passed',
                execution_status: 'pending',
                recipient_address: '0x123',
                amount: 1000,
              },
            ]),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }
        if (url.includes('/rest/v1/communities')) {
          return new Response(
            JSON.stringify([
              {
                id: 'comm-alpha',
                type: 'standard',
                sacco_license_status: 'none',
                is_payout_frozen: false,
                is_reconciliation_frozen: false,
                status: 'active',
              },
            ]),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }
        if (url.includes('/rest/v1/reconciliation_alerts')) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (url.includes('/rest/v1/journal_entries')) {
          return new Response(JSON.stringify({ id: 'je-1' }), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/governance/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proposalId: 'prop-solvent-1', executorWallet: '0xExecutor1' }),
      });

      const res = await executeProposalHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.proposalId).toBe('prop-solvent-1');
      expect(data.status).toBe('executed');
    });

    it('TC-EX-02: Community with is_payout_frozen returns HTTP 403 with circuitBreaker: true', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/proposals')) {
          return new Response(
            JSON.stringify([
              {
                id: 'prop-frozen-1',
                community_id: 'comm-frozen',
                status: 'passed',
                execution_status: 'pending',
              },
            ]),
            { status: 200 },
          );
        }
        if (url.includes('/rest/v1/communities')) {
          return new Response(
            JSON.stringify([
              {
                id: 'comm-frozen',
                type: 'standard',
                is_payout_frozen: true,
                status: 'active',
              },
            ]),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/governance/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proposalId: 'prop-frozen-1', executorWallet: '0xExecutor1' }),
      });

      const res = await executeProposalHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('treasury_circuit_breaker_active');
      expect(data.circuitBreaker).toBe(true);
    });

    it('TC-EX-03: Community with status = "paused" returns HTTP 403 with circuitBreaker: true', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/proposals')) {
          return new Response(
            JSON.stringify([
              {
                id: 'prop-paused-1',
                community_id: 'comm-paused',
                status: 'passed',
                execution_status: 'pending',
              },
            ]),
            { status: 200 },
          );
        }
        if (url.includes('/rest/v1/communities')) {
          return new Response(
            JSON.stringify([
              {
                id: 'comm-paused',
                type: 'standard',
                is_payout_frozen: false,
                status: 'paused',
              },
            ]),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/governance/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proposalId: 'prop-paused-1', executorWallet: '0xExecutor1' }),
      });

      const res = await executeProposalHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('treasury_circuit_breaker_active');
      expect(data.circuitBreaker).toBe(true);
    });

    it('TC-EX-04: Double execution of already executed proposal returns HTTP 409', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/proposals')) {
          return new Response(
            JSON.stringify([
              {
                id: 'prop-already-done',
                community_id: 'comm-done',
                status: 'passed',
                execution_status: 'executed',
              },
            ]),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/governance/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proposalId: 'prop-already-done', executorWallet: '0xExecutor1' }),
      });

      const res = await executeProposalHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('already_executed');
    });
  });

  // ==========================================
  // Dynamic Ingress Route: /api/communities/:id/invites (TC-INV-01..03)
  // ==========================================
  describe('Dynamic Communities Invites Edge Route (TC-INV-01..03)', () => {
    it('TC-INV-01: GET /api/communities/chama-alpha/invites scopes query to chama-alpha', async () => {
      let queriedCommunityId: string | null = null;
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/members')) {
          return new Response(JSON.stringify([{ member_id: 'mem-1', role: 'admin', activation_status: 'active' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (url.includes('/rest/v1/community_invites')) {
          const match = url.match(/community_id=eq\.([^&]+)/);
          if (match) queriedCommunityId = decodeURIComponent(match[1]);
          return new Response(JSON.stringify([{ code: 'brz_alpha_1', community_id: 'chama-alpha' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/communities/chama-alpha/invites', {
        method: 'GET',
        headers: {
          'x-test-wallet-address': '0xOfficer1',
        },
      });

      const res = await dynamicInvitesHandler(req);
      expect(res.status).toBe(200);
      expect(queriedCommunityId).toBe('chama-alpha');
    });

    it('TC-INV-02: POST /api/communities/chama-alpha/invites injects communityId if omitted', async () => {
      let insertedBody: Record<string, unknown> | null = null;
      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/members')) {
          return new Response(JSON.stringify([{ member_id: 'mem-1', role: 'admin', activation_status: 'active' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (url.includes('/rest/v1/community_invites') && init?.method === 'POST') {
          insertedBody = JSON.parse(init.body as string);
          return new Response(
            JSON.stringify([
              {
                id: 'inv-123',
                community_id: insertedBody?.community_id,
                code: 'brz_test_invite',
              },
            ]),
            { status: 201, headers: { 'content-type': 'application/json' } },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/communities/chama-alpha/invites', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-test-wallet-address': '0xOfficer1',
        },
        body: JSON.stringify({ role: 'member' }), // Omitted communityId in body
      });

      const res = await dynamicInvitesHandler(req);
      expect(res.status).toBe(201);
      if (!insertedBody) throw new Error('Expected insertedBody to be populated');
      expect((insertedBody as Record<string, unknown>).community_id).toBe('chama-alpha');
    });

    it('TC-INV-03: Unauthenticated request to /api/communities/chama-alpha/invites is rejected', async () => {
      const req = new Request('https://api.baraza.org/api/communities/chama-alpha/invites', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ role: 'member' }),
      });

      const res = await dynamicInvitesHandler(req);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // Health & Readiness Observability (TC-HD-01..03)
  // ==========================================
  describe('Health Readiness Observability (TC-HD-01..03)', () => {
    it('TC-HD-01: When all environment keys are present, returns HTTP 200 with healthy minisend status', async () => {
      global.fetch = vi.fn(async () => {
        return new Response(JSON.stringify([{ id: 'comm-1' }]), { status: 200 });
      });

      process.env.MINISEND_API_KEY = 'ms_key_healthy';
      process.env.KOTANI_API_KEY = 'kotani_key_healthy';

      const req = new Request('https://api.baraza.org/api/health/ready', { method: 'GET' });
      const res = await readyHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.components?.minisend?.status).toBe('healthy');
      expect(data.components?.kotani?.status).toBe('healthy');
    });

    it('TC-HD-02: When MINISEND_API_KEY is missing, returns HTTP 200 with degraded minisend status', async () => {
      delete process.env.MINISEND_API_KEY;

      global.fetch = vi.fn(async () => {
        return new Response(JSON.stringify([{ id: 'comm-1' }]), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/health/ready', { method: 'GET' });
      const res = await readyHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.components?.minisend?.status).toBe('degraded');
      expect(data.components?.minisend?.message).toMatch(/not configured/i);
    });

    it('TC-HD-03: When database connection fails, returns HTTP 503 with unhealthy database status', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/communities')) {
          throw new Error('ECONNREFUSED');
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/health/ready', { method: 'GET' });
      const res = await readyHandler(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe('not_ready');
      expect(data.components?.database?.status).toBe('unhealthy');
    });
  });
});
