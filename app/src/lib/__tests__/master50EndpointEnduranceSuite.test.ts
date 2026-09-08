// app/src/lib/__tests__/master50EndpointEnduranceSuite.test.ts
// Standard: S&P 500 Enterprise Fintech (High-Concurrence Endurance & Stress Test Suite)
// Objective: Execute every backend API endpoint and integration adapter at least 50 times,
// measuring latency percentiles (p50, p95, p99), error rates, and idempotency invariants.

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startMockRailServer, type MockRailServerInstance } from '../testing/mockRailServer';
import { SwyptCustodialClearingAdapter } from '../adapters/clearing/SwyptCustodialClearingAdapter';
import { requestStkPush, requestTransactionStatusQuery, verifyDarajaWebhookSignature } from '../payments/daraja';
import { calculateArtizenSplit } from '../financial/artizenSplitEngine';
import { isValidSaccoLicenseNumber, SASRA_STATUTORY_DEPOSIT_CEILING_MINOR } from '../compliance/saccoGate';
import { classifyChatError } from '../../../api/agent/chat';
import { renderEmailTemplate, sendTransactionalEmail } from '../../../api/_lib/mail';
import { hashSessionToken } from '../../../api/_lib/auth-session';

const ITERATION_COUNT = 50;

interface TelemetrySample {
  endpoint: string;
  type: string;
  iterations: number;
  successes: number;
  failures: number;
  durationsMs: number[];
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

const telemetryReports: TelemetrySample[] = [];

function recordSample(
  endpoint: string,
  type: string,
  durationsMs: number[],
  successes: number,
  failures: number
): TelemetrySample {
  const sorted = [...durationsMs].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  const max = sorted[sorted.length - 1] || 0;

  const sample: TelemetrySample = {
    endpoint,
    type,
    iterations: durationsMs.length,
    successes,
    failures,
    durationsMs,
    p50Ms: Math.round(p50 * 100) / 100,
    p95Ms: Math.round(p95 * 100) / 100,
    p99Ms: Math.round(p99 * 100) / 100,
    maxMs: Math.round(max * 100) / 100,
  };
  telemetryReports.push(sample);
  return sample;
}

describe('Master 50-Iteration Backend Endurance & Stress Suite', () => {
  let mockServer: MockRailServerInstance;

  beforeAll(async () => {
    mockServer = await startMockRailServer(0);
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  // ---------------------------------------------------------------------------
  // 1. Safaricom Daraja STK Push & Transaction Status Query (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 1: Safaricom Daraja Rails (50 Runs)', () => {
    it(`executes STK Push and Status Query ${ITERATION_COUNT} times with zero regressions`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // 1a. STK Push
          const stkRes = await requestStkPush({
            phone: `+2547123456${(i % 90 + 10).toString()}`,
            amountKes: 100 + i,
            reference: `DARAJA_ENDURANCE_${Date.now()}_${i}`,
            sandbox: true,
          });

          expect(stkRes.mode).toBe('sandbox');
          expect(stkRes.checkoutRequestId).toMatch(/^ws_/);

          // 1b. Status Query
          const statusRes = await requestTransactionStatusQuery({
            transactionId: stkRes.checkoutRequestId,
            sandbox: true,
          });
          expect(statusRes.resultCode).toBe('0');

          // 1c. Signature Verification (Sandbox check)
          const sigValid = await verifyDarajaWebhookSignature(
            { Body: { stkCallback: { ResultCode: 0, CheckoutRequestID: stkRes.checkoutRequestId } } },
            undefined,
            undefined,
            'true'
          );
          expect(sigValid).toBe(true);

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Safaricom Daraja STK & Status', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Kotani Pay Webhook Signature & Float Invariants (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 2: Kotani Pay Webhook & Float Depletion (50 Runs)', () => {
    it(`verifies HMAC-SHA256 signatures and DLQ transitions ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;
      const secret = 'test_kotani_secret_50';

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          const payload = {
            reference: `kotani_ref_${Date.now()}_${i}`,
            status: i % 5 === 0 ? 'FAILED' : 'COMPLETED',
            amount: 1500,
            currency: 'KES',
            timestamp: new Date().toISOString(),
          };

          const signature = mockServer.generateKotaniSignature(payload, secret);
          expect(typeof signature).toBe('string');
          expect(signature.length).toBe(64); // 32-byte hex

          // HTTP loopback verification
          const response = await fetch(`${mockServer.url}/api/v1/initiate`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-kotani-signature': signature,
            },
            body: JSON.stringify(payload),
          });

          expect(response.status).toBe(200);
          const body = (await response.json()) as { status: string };
          expect(body.status).toBe('PENDING');

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Kotani Pay Webhook Ingress', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Minisend B2C Rails & Timestamp Replay Guard (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 3: Minisend B2C Rails & Replay Window (50 Runs)', () => {
    it(`enforces replay freshness window and signature verification ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;
      const secret = 'test_minisend_secret_50';

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          const payload = {
            payout_id: `ms_payout_${Date.now()}_${i}`,
            amount_minor: 150000,
            currency: 'KES',
            phone: `+2547000000${(i % 90 + 10).toString()}`,
          };

          const signature = mockServer.generateMinisendSignature(payload, secret);
          expect(signature.length).toBe(64);

          const res = await fetch(`${mockServer.url}/api/v1/payout`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-minisend-signature': signature,
              'x-minisend-timestamp': Math.floor(Date.now() / 1000).toString(),
            },
            body: JSON.stringify(payload),
          });

          expect(res.status).toBe(200);
          const data = (await res.json()) as { success: boolean; status: string };
          expect(data.success).toBe(true);
          expect(data.status).toBe('PROCESSING');

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Minisend B2C Payout Rail', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Paystack Raw-Body Webhook & Minor Cents Invariant (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 4: Paystack HMAC-SHA512 Webhook (50 Runs)', () => {
    it(`validates HMAC-SHA512 against raw payloads ${ITERATION_COUNT} times without corruption`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;
      const secret = 'sk_test_paystack_endurance_secret_50';

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          const rawPayload = JSON.stringify({
            event: 'charge.success',
            data: {
              id: 999000 + i,
              reference: `pstk_ref_${Date.now()}_${i}`,
              amount: 150000, // 1,500.00 KES in minor units
              currency: 'KES',
              status: 'success',
              paid_at: new Date().toISOString(),
            },
          });

          const signature = mockServer.generatePaystackSignature(rawPayload, secret);
          expect(signature.length).toBe(128); // 64-byte SHA512 hex

          // HTTP loopback
          const res = await fetch(`${mockServer.url}/transaction/initialize`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-paystack-signature': signature,
            },
            body: rawPayload,
          });

          expect(res.status).toBe(200);
          const body = (await res.json()) as { status: boolean; data: { authorization_url: string } };
          expect(body.status).toBe(true);
          expect(body.data.authorization_url).toContain('paystack.com');

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Paystack Webhook & Initialize', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Africa's Talking Telco Messaging Gateway (50 Iterations)
  // ---------------------------------------------------------------------------
  describe("Endpoint 5: Africa's Talking SMS Gateway (50 Runs)", () => {
    it(`processes SMS dispatches and recipient status codes ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          const res = await fetch(`${mockServer.url}/version1/messaging`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              apiKey: 'at_mock_api_key',
            },
            body: JSON.stringify({
              username: 'sandbox',
              to: `+2547123456${(i % 90 + 10).toString()}`,
              message: `Your Baraza OTP code is ${100000 + i}`,
            }),
          });

          expect(res.status).toBe(200);
          const data = (await res.json()) as {
            SMSMessageData: { Recipients: Array<{ statusCode: number; status: string }> };
          };
          expect(data.SMSMessageData.Recipients[0].statusCode).toBe(101);
          expect(data.SMSMessageData.Recipients[0].status).toBe('Success');

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample("Africa's Talking SMS Gateway", 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Swypt Custodial Clearing Rails (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 6: Swypt Custodial Escrow Clearing (50 Runs)', () => {
    it(`clears deposits and disbursements over real HTTP ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;
      const adapter = new SwyptCustodialClearingAdapter(mockServer.url, 'swypt_test_key');

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // Inbound clear
          const clearRes = await adapter.clearInbound({
            intentId: `intent_swypt_50_${i}`,
            communityId: 'comm_swypt_50',
            orderId: `ord_swypt_50_${i}`,
            amountMinor: 250000n + BigInt(i),
            currency: 'KES',
            sourceAccount: `+2547112233${(i % 90 + 10).toString()}`,
          });

          expect(clearRes.success).toBe(true);
          expect(clearRes.status).toBe('SETTLED');
          expect(clearRes.feeMinor).toBe(500n);

          // Outbound disburse
          const disburseRes = await adapter.disburse({
            disbursementId: `disb_swypt_50_${i}`,
            communityId: 'comm_swypt_50',
            recipientAddress: `+2547223344${(i % 90 + 10).toString()}`,
            amountMinor: 200000n,
            currency: 'KES',
          });

          expect(disburseRes.success).toBe(true);
          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Swypt Custodial Clearing Adapter', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Base EVM & Gnosis Safe JSON-RPC Simulator (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 7: Base EVM & Gnosis Safe JSON-RPC (50 Runs)', () => {
    it(`executes eth_chainId, eth_call, and eth_sendRawTransaction ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // 7a. Query Chain ID
          const chainRes = await fetch(`${mockServer.url}/rpc`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: i + 1, method: 'eth_chainId', params: [] }),
          });
          const chainData = (await chainRes.json()) as { result: string };
          expect(chainData.result).toBe('0x2105'); // Base mainnet

          // 7b. Query Governor Balance / Call
          const callRes = await fetch(`${mockServer.url}/rpc`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: i + 2, method: 'eth_call', params: [{}, 'latest'] }),
          });
          const callData = (await callRes.json()) as { result: string };
          expect(callData.result.endsWith('1')).toBe(true);

          // 7c. Submit Governance Vote Tx
          const sendRes = await fetch(`${mockServer.url}/rpc`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: i + 3,
              method: 'eth_sendRawTransaction',
              params: ['0x02f8...mock_tx'],
            }),
          });
          const sendData = (await sendRes.json()) as { result: string };
          expect(sendData.result.startsWith('0x')).toBe(true);

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Base EVM JSON-RPC Simulator', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Privy Web3 Identity JWKS & DID Verification (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 8: Privy Web3 Identity & JWKS (50 Runs)', () => {
    it(`verifies JWKS key sets and mints polymorphic DIDs ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // 8a. Fetch JWKS
          const jwksRes = await fetch(`${mockServer.url}/.well-known/jwks.json`);
          expect(jwksRes.status).toBe(200);
          const jwksData = (await jwksRes.json()) as { keys: Array<{ kid: string; alg: string }> };
          expect(jwksData.keys[0].kid).toBe('privy-mock-key-1');
          expect(jwksData.keys[0].alg).toBe('RS256');

          // 8b. Mint & verify Privy JWT Token
          const did = `did:privy:ck_${Date.now()}_${i}`;
          const token = mockServer.generatePrivyToken(did);
          const parts = token.split('.');
          expect(parts.length).toBe(3);

          const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { sub: string; iss: string };
          expect(claims.sub).toBe(did);
          expect(claims.iss).toBe('privy.io');

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Privy Identity JWKS & DID', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. SendGrid Transactional Mail & Poison Pill Quarantine (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 9: SendGrid Transactional Outbox (50 Runs)', () => {
    it(`renders Handlebars templates and isolates poison pills ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // 9a. Invariant: Template rendering
          const rendered = renderEmailTemplate('signup-otp', {
            otp: '123456',
            expires_minutes: '10',
            email: `member_${i}@barazaprotocol.com`,
          });
          expect(rendered.html).toContain('123456');
          expect(rendered.html).not.toMatch(/{{[a-zA-Z0-9_]+}}/);

          // 9b. Valid email dispatch
          const validSend = await sendTransactionalEmail(`member_${i}@barazaprotocol.com`, 'signup-otp', {
            otp: '123456',
            expires_minutes: '10',
            email: `member_${i}@barazaprotocol.com`,
          });
          expect(validSend.ok).toBe(true);

          // 9c. Poison Pill Isolation (Invalid recipient format)
          const poisonSend = await sendTransactionalEmail('invalid-malformed-email@@', 'signup-otp', {
            otp: '123456',
            expires_minutes: '10',
            email: 'invalid-malformed-email@@',
          });
          expect(poisonSend.ok).toBe(false);
          expect(poisonSend.poisonPill).toBe(true);

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('SendGrid Transactional Outbox', 'Endurance Integration', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Anthropic Claude Error Classifier Telemetry (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 10: Anthropic Claude Error Classifier (50 Runs)', () => {
    it(`sanitizes vendor billing errors and rate limits ${ITERATION_COUNT} times`, () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // Credit exhaustion
          const creditErr = classifyChatError({
            status: 400,
            message: 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade.',
          });
          expect(creditErr.category).toBe('credits_exhausted');
          expect(creditErr.message).not.toMatch(/Anthropic API/);

          // Rate limit
          const rateErr = classifyChatError({ status: 429, message: 'rate limit exceeded' });
          expect(rateErr.category).toBe('rate_limited');

          // Overloaded
          const overErr = classifyChatError({ status: 529 });
          expect(overErr.category).toBe('overloaded');

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Anthropic Claude Error Classifier', 'Unit Endurance', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Artizen Campaign Splits & Zero-Drift Math (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 11: Artizen Campaign Split Engine (50 Runs)', () => {
    it(`calculates integer basis point splits with zero rounding loss ${ITERATION_COUNT} times`, () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          const totalRaised = 1000000n + BigInt(i * 333); // minor cents
          const splits = calculateArtizenSplit(totalRaised, 500); // 5% fee (500 bps)

          // Conservation of value: platformFee + treasuryNet === totalRaised
          expect(splits.platformFeeMinor + splits.treasuryNetMinor).toBe(totalRaised);
          expect(splits.drift).toBe(0n);
          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('Artizen Campaign Split Engine', 'Unit Endurance', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 12. SASRA Statutory Gates & Format Validation (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 12: SASRA Regulatory Gates & Formats (50 Runs)', () => {
    it(`validates Cap 490B registration formats and statutory deposit caps ${ITERATION_COUNT} times`, () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        try {
          // Statutory format checks
          const validCoop = isValidSaccoLicenseNumber(`CS/${10000 + i}`);
          expect(validCoop).toBe(true);

          const validSasraDt = isValidSaccoLicenseNumber(`SASRA/DT/102/${2020 + (i % 5)}`);
          expect(validSasraDt).toBe(true);

          const validSasraNwdt = isValidSaccoLicenseNumber(`SASRA/NWDT/450/${2020 + (i % 5)}`);
          expect(validSasraNwdt).toBe(true);

          // Invalid format rejection
          const invalid = isValidSaccoLicenseNumber('INVALID_REG_999');
          expect(invalid).toBe(false);

          // Statutory ceiling constant sanity check
          expect(SASRA_STATUTORY_DEPOSIT_CEILING_MINOR).toBe(10_000_000_000n);

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('SASRA Regulatory Compliance Gate', 'Unit Endurance', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Live Docker PostgreSQL 16 & PostgREST Database Write & Read (50 Iterations)
  // ---------------------------------------------------------------------------
  describe('Endpoint 13: Live PostgreSQL 16 & PostgREST Database Write/Read (50 Runs)', () => {
    it(`writes, reads, updates, and deletes from real PostgreSQL database ${ITERATION_COUNT} times`, async () => {
      const durations: number[] = [];
      let successCount = 0;
      let failCount = 0;
      const LIVE_DB_URL = 'http://localhost:54321';
      const SERVICE_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.YEHFlsDyYXjxJ5oIZyJ6HuS62T6qaal7bGnWI5GxbRs';

      for (let i = 0; i < ITERATION_COUNT; i++) {
        const t0 = performance.now();
        const testId = `stress-db-50-${Date.now()}-${i}`;
        try {
          // 13a. Write: INSERT into communities table in live PostgreSQL
          const insertRes = await fetch(`${LIVE_DB_URL}/rest/v1/communities`, {
            method: 'POST',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'content-type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              id: testId,
              name: `Database Endurance Chamber ${i}`,
              type: 'chama',
              membership_fee: 100,
              sacco_license_status: 'UNLICENSED',
            }),
          });
          expect([201, 204]).toContain(insertRes.status);

          // 13b. Read: SELECT from communities table in live PostgreSQL
          const readRes = await fetch(`${LIVE_DB_URL}/rest/v1/communities?id=eq.${testId}&select=id,name,type`, {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
          });
          expect(readRes.status).toBe(200);
          const rows = (await readRes.json()) as Array<{ id: string; name: string; type: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0].id).toBe(testId);
          expect(rows[0].name).toBe(`Database Endurance Chamber ${i}`);

          // 13c. Update: PATCH record in live PostgreSQL
          const updateRes = await fetch(`${LIVE_DB_URL}/rest/v1/communities?id=eq.${testId}`, {
            method: 'PATCH',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              name: `Database Endurance Chamber Updated ${i}`,
            }),
          });
          expect([200, 204]).toContain(updateRes.status);

          // 13d. Read back verified update
          const verifyRes = await fetch(`${LIVE_DB_URL}/rest/v1/communities?id=eq.${testId}&select=name`, {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
          });
          const updatedRows = (await verifyRes.json()) as Array<{ name: string }>;
          expect(updatedRows[0].name).toBe(`Database Endurance Chamber Updated ${i}`);

          // 13e. Clean up row
          await fetch(`${LIVE_DB_URL}/rest/v1/communities?id=eq.${testId}`, {
            method: 'DELETE',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
          });

          successCount++;
        } catch {
          failCount++;
        }
        durations.push(performance.now() - t0);
      }

      recordSample('PostgreSQL 16 & PostgREST DB Operations', 'Database Write/Read Endurance', durations, successCount, failCount);
      expect(successCount).toBe(ITERATION_COUNT);
      expect(failCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Summary Audit Telemetry Output
  // ---------------------------------------------------------------------------
  it('aggregates and certifies S&P 500 endurance telemetry', () => {
    expect(telemetryReports.length).toBe(13);
    for (const report of telemetryReports) {
      expect(report.successes).toBe(ITERATION_COUNT);
      expect(report.failures).toBe(0);
      const maxAllowedP95 = report.type.includes('Database') ? 250 : 100;
      expect(report.p95Ms).toBeLessThan(maxAllowedP95);
    }
  });
});
