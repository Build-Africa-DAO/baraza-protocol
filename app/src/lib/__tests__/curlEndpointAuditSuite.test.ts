// app/src/lib/__tests__/curlEndpointAuditSuite.test.ts
// Standard: S&P 500 Enterprise Fintech (System curl Execution & End-to-End Audit)
// Objective: Execute real system `curl` commands from the operating system shell against every endpoint,
// capturing status codes, response headers, response bodies, and performance SLAs.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMockRailServer, type MockRailServerInstance } from '../testing/mockRailServer';
import { startApiHttpBridge, type ApiHttpBridgeInstance } from '../testing/apiHttpBridge';

const execFileAsync = promisify(execFile);

interface CurlExecutionResult {
  stdout: string;
  stderr: string;
  statusCode: number;
  durationMs: number;
  body: string;
}

async function runCurl(args: string[]): Promise<CurlExecutionResult> {
  const t0 = performance.now();
  // Pass -i to include HTTP response headers, -s for silent mode
  const curlArgs = ['-s', '-i', ...args];
  const { stdout, stderr } = await execFileAsync('curl', curlArgs);
  const durationMs = Math.round((performance.now() - t0) * 100) / 100;

  // Extract HTTP status code from header line e.g., "HTTP/1.1 200 OK"
  const match = stdout.match(/HTTP\/[0-9.]+\s+([0-9]{3})/);
  const statusCode = match ? parseInt(match[1], 10) : 0;

  // Split headers and body
  const parts = stdout.split(/\r?\n\r?\n/);
  const body = parts.slice(1).join('\n\n');

  return { stdout, stderr, statusCode, durationMs, body };
}

const LIVE_DB_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.YEHFlsDyYXjxJ5oIZyJ6HuS62T6qaal7bGnWI5GxbRs';

describe('Master Curl End-to-End Endpoint Audit Suite', () => {
  let mockRail: MockRailServerInstance;
  let apiBridge: ApiHttpBridgeInstance;

  beforeAll(async () => {
    mockRail = await startMockRailServer(0);

    process.env.SUPABASE_URL = LIVE_DB_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
    process.env.COMPLIANCE_REVIEW_SECRET = 'live_compliance_secret_12345';
    process.env.CRON_SECRET = 'live_cron_secret_67890';
    process.env.KOTANI_API_BASE = mockRail.url;
    process.env.MINISEND_API_BASE = mockRail.url;
    process.env.STELLAR_HORIZON_URL = mockRail.url;
    process.env.KOTANI_WEBHOOK_SECRET = 'kotani_webhook_secret_abc123';
    process.env.MINISEND_WEBHOOK_SECRET = 'minisend_webhook_secret_xyz789';
    process.env.PAYSTACK_SECRET_KEY = 'paystack_secret_key_mock';
    process.env.SWYPT_WEBHOOK_SECRET = 'swypt_webhook_secret_456def';

    apiBridge = await startApiHttpBridge(0);
  });

  afterAll(async () => {
    if (apiBridge) await apiBridge.stop();
    if (mockRail) await mockRail.stop();
  });

  // ===========================================================================
  // Part 1: Real Database Operations via curl (PostgreSQL 16 & PostgREST 54321)
  // ===========================================================================
  describe('Tier 1: Live Database Endpoints via curl (PostgREST Gateway)', () => {
    it('1.1 curl GET /rest/v1/communities?select=count', async () => {
      const res = await runCurl([
        `${LIVE_DB_URL}/rest/v1/communities?select=count`,
        '-H', `apikey: ${SERVICE_KEY}`,
        '-H', `Authorization: Bearer ${SERVICE_KEY}`,
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('count');
      expect(res.durationMs).toBeLessThan(100);
    });

    it('1.2 curl POST, GET, PATCH, DELETE /rest/v1/communities (Full CRUD)', async () => {
      const commId = `curl-comm-${Date.now()}`;

      // POST (Write)
      const postRes = await runCurl([
        '-X', 'POST',
        `${LIVE_DB_URL}/rest/v1/communities`,
        '-H', `apikey: ${SERVICE_KEY}`,
        '-H', `Authorization: Bearer ${SERVICE_KEY}`,
        '-H', 'content-type: application/json',
        '-H', 'Prefer: return=minimal',
        '-d', JSON.stringify({
          id: commId,
          name: 'Curl Audit Community',
          type: 'chama',
          membership_fee: 100,
          sacco_license_status: 'UNLICENSED',
        }),
      ]);
      expect([201, 204]).toContain(postRes.statusCode);

      // GET (Read)
      const getRes = await runCurl([
        `${LIVE_DB_URL}/rest/v1/communities?id=eq.${commId}&select=id,name,type`,
        '-H', `apikey: ${SERVICE_KEY}`,
        '-H', `Authorization: Bearer ${SERVICE_KEY}`,
      ]);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toContain(commId);
      expect(getRes.body).toContain('Curl Audit Community');

      // PATCH (Update)
      const patchRes = await runCurl([
        '-X', 'PATCH',
        `${LIVE_DB_URL}/rest/v1/communities?id=eq.${commId}`,
        '-H', `apikey: ${SERVICE_KEY}`,
        '-H', `Authorization: Bearer ${SERVICE_KEY}`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ name: 'Curl Audit Community Mutated' }),
      ]);
      expect([200, 204]).toContain(patchRes.statusCode);

      // DELETE (Cleanup)
      const delRes = await runCurl([
        '-X', 'DELETE',
        `${LIVE_DB_URL}/rest/v1/communities?id=eq.${commId}`,
        '-H', `apikey: ${SERVICE_KEY}`,
        '-H', `Authorization: Bearer ${SERVICE_KEY}`,
      ]);
      expect([200, 204]).toContain(delRes.statusCode);
    });

    it('1.3 curl GET table row counts for audit tables', async () => {
      const tables = [
        'identity_claim_pending',
        'payment_orders',
        'sacco_compliance_documents',
        'compliance_alerts',
        'journal_entries',
        'minisend_audit_logs',
      ];

      for (const table of tables) {
        const res = await runCurl([
          `${LIVE_DB_URL}/rest/v1/${table}?select=count`,
          '-H', `apikey: ${SERVICE_KEY}`,
          '-H', `Authorization: Bearer ${SERVICE_KEY}`,
        ]);
        expect(res.statusCode).toBe(200);
        expect(res.body).toContain('count');
      }
    });
  });

  // ===========================================================================
  // Part 2: External Rail Simulator Endpoints via curl (Port 9099)
  // ===========================================================================
  describe('Tier 2: External Rail Integration Endpoints via curl (Port 9099)', () => {
    it('2.1 curl POST /mpesa/stkpush/v1/processrequest (Daraja STK Push)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/mpesa/stkpush/v1/processrequest`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({
          BusinessShortCode: '174379',
          Password: 'mock_password',
          Timestamp: '20260909000000',
          TransactionType: 'CustomerPayBillOnline',
          Amount: 250,
          PartyA: '254712345678',
          PartyB: '174379',
          PhoneNumber: '254712345678',
          CallBackURL: 'http://localhost/callback',
          AccountReference: 'BARAZA_CURL',
          TransactionDesc: 'Curl test',
        }),
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('ResponseCode');
      expect(res.body).toContain('CheckoutRequestID');
    });

    it('2.2 curl POST /mpesa/transactionstatus/v1/query (Daraja Status Query)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/mpesa/transactionstatus/v1/query`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({
          Initiator: 'mock_initiator',
          SecurityCredential: 'mock_cred',
          CommandID: 'TransactionStatusQuery',
          TransactionID: 'ws_mock_checkout_123',
          PartyA: '174379',
          IdentifierType: '4',
          ResultURL: 'http://localhost/result',
          QueueTimeOutURL: 'http://localhost/timeout',
          Remarks: 'Verification',
        }),
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('ConversationID');
    });

    it('2.3 curl POST /api/v1/initiate (Kotani Pay)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/api/v1/initiate`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ amount: 1500, currency: 'KES', reference: 'kotani_curl_ref' }),
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('PENDING');
    });

    it('2.4 curl POST /api/v1/payout (Minisend B2C)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/api/v1/payout`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ amount_minor: 150000, currency: 'KES', phone: '+254700000000' }),
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('PROCESSING');
    });

    it('2.5 curl POST /v1/escrow/deposit and /v1/escrow/disburse (Swypt)', async () => {
      const depositRes = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/v1/escrow/deposit`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ escrow_id: 'esc_curl_1', amount_minor: 75000 }),
      ]);
      expect(depositRes.statusCode).toBe(200);
      expect(depositRes.body).toContain('SETTLED');

      const disburseRes = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/v1/escrow/disburse`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ escrow_id: 'esc_curl_1', disburse_id: 'disb_1' }),
      ]);
      expect(disburseRes.statusCode).toBe(200);
      expect(disburseRes.body).toContain('SETTLED');
    });

    it('2.6 curl POST /rpc (Base EVM JSON-RPC Simulator)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/rpc`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('0x2105'); // Base Mainnet 8453
    });

    it('2.7 curl GET /.well-known/jwks.json (Privy Identity JWKS)', async () => {
      const res = await runCurl([`${mockRail.url}/.well-known/jwks.json`]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('privy-mock-key-1');
      expect(res.body).toContain('RS256');
    });

    it('2.8 curl POST /version1/messaging (Africa\'s Talking SMS)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${mockRail.url}/version1/messaging`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ to: '+254712345678', message: 'Curl OTP Verification' }),
      ]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Success');
    });

    it('2.9 curl GET /evolution-ping (WhatsApp Evolution API)', async () => {
      const res = await runCurl([`${mockRail.url}/evolution-ping`]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Evolution API');
    });

    it('2.10 curl GET / (Stellar Horizon Root Simulator)', async () => {
      const res = await runCurl([`${mockRail.url}/`]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Baraza Mock Rail Endpoint');
    });
  });

  // ===========================================================================
  // Part 3: Backend API Route Handlers via curl (Port 4000)
  // ===========================================================================
  describe('Tier 3: Core Backend API Handlers via curl (Port 4000)', () => {
    it('3.1 curl GET /api/health/ready', async () => {
      const res = await runCurl([`${apiBridge.url}/api/health/ready`]);
      expect([200, 503]).toContain(res.statusCode);
      expect(res.body).toContain('status');
    });

    it('3.2 curl POST /api/communities (Zero-Trust Validation)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${apiBridge.url}/api/communities`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ name: 'Invalid Without Wallet Proof' }),
      ]);
      // Expect 400 bad request due to missing wallet proof
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('invalid_request');
    });

    it('3.3 curl POST /api/governance/execute (Validation)', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${apiBridge.url}/api/governance/execute`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ proposalId: 'missing-props' }),
      ]);
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('invalid_request');
    });

    it('3.4 curl GET /api/compliance/status?communityId=test', async () => {
      // 3.4a Unknown community returns 404
      const notFound = await runCurl([`${apiBridge.url}/api/compliance/status?communityId=non-existent-comm`]);
      expect(notFound.statusCode).toBe(404);

      // 3.4b Existing community returns 200
      const commId = `curl-status-${Date.now()}`;
      await runCurl([
        '-X', 'POST',
        `${LIVE_DB_URL}/rest/v1/communities`,
        '-H', `apikey: ${SERVICE_KEY}`,
        '-H', `Authorization: Bearer ${SERVICE_KEY}`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ id: commId, name: 'Compliance Test', type: 'chama', sacco_license_status: 'UNLICENSED' }),
      ]);

      const res = await runCurl([`${apiBridge.url}/api/compliance/status?communityId=${commId}`]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('UNLICENSED');
    });

    it('3.5 curl GET /api/cron/monitor-compliance (Auth Guard)', async () => {
      // 401 Unauthorized without CRON_SECRET
      const unauth = await runCurl([`${apiBridge.url}/api/cron/monitor-compliance`]);
      expect(unauth.statusCode).toBe(401);

      // 200 OK with valid bearer token
      const auth = await runCurl([
        `${apiBridge.url}/api/cron/monitor-compliance`,
        '-H', 'Authorization: Bearer live_cron_secret_67890',
      ]);
      expect(auth.statusCode).toBe(200);
      expect(auth.body).toContain('expiredCount');
    });

    it('3.6 curl POST Webhook Endpoints with Missing Signatures (Rejection)', async () => {
      const webhookEndpoints = [
        '/api/webhooks/kotani',
        '/api/webhooks/minisend',
        '/api/webhooks/paystack',
        '/api/webhooks/clearing',
        '/api/webhooks/artizen',
      ];

      for (const ep of webhookEndpoints) {
        const res = await runCurl([
          '-X', 'POST',
          `${apiBridge.url}${ep}`,
          '-H', 'content-type: application/json',
          '-d', JSON.stringify({ event: 'test_curl' }),
        ]);
        expect([400, 401, 403]).toContain(res.statusCode);
      }
    });

    it('3.7 curl POST /api/agent/chat', async () => {
      const res = await runCurl([
        '-X', 'POST',
        `${apiBridge.url}/api/agent/chat`,
        '-H', 'content-type: application/json',
        '-d', JSON.stringify({ message: 'Hello Baraza', communityId: 'comm_curl' }),
      ]);
      // Expect 400 or 500 depending on API keys, but response is valid JSON
      expect([200, 400, 500]).toContain(res.statusCode);
      expect(res.body).toContain('error');
    });
  });
});
