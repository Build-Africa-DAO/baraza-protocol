import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import {
  calculateArtizenSplit,
  validateStatutoryLiquidityReserve,
} from '../financial/artizenSplitEngine';
import { SafeSorobanClearingAdapter } from '../adapters/clearing/SafeSorobanClearingAdapter';
import { SwyptCustodialClearingAdapter } from '../adapters/clearing/SwyptCustodialClearingAdapter';
import kotaniWebhookHandler from '../../../api/webhooks/kotani.js';
import clearingWebhookHandler from '../../../api/webhooks/clearing.js';
import artizenWebhookHandler from '../../../api/webhooks/artizen.js';
import resolveExceptionHandler from '../../../api/payments/exceptions/resolve.js';

describe('Sprint 2 Clearing Rails, DLQ & Artizen Split Engine Suite', () => {
  const originalEnv = { ...process.env };
  const mockProxySecret = 'test_proxy_secret_sprint2_verified';

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.PAYMENT_ADAPTER_PROXY_SECRET = mockProxySecret;
    process.env.CLEARING_WEBHOOK_SECRET = mockProxySecret;
    process.env.ARTIZEN_WEBHOOK_SECRET = mockProxySecret;
    process.env.KOTANI_WEBHOOK_SECRET = 'kotani_test_secret_123';
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ==========================================
  // Invariant I5 & Numeric Bounds (TC-SPL-01..03)
  // ==========================================
  describe('Artizen Revenue Split Conservation (TC-SPL-01..03)', () => {
    it('TC-SPL-01: Amount: 100,000 minor units, fee: 500 bps yields fee 5,000, treasury 95,000, drift 0n', () => {
      const result = calculateArtizenSplit(100000n, 500);
      expect(result.totalRaisedMinor).toBe(100000n);
      expect(result.platformFeeMinor).toBe(5000n);
      expect(result.treasuryNetMinor).toBe(95000n);
      expect(result.drift).toBe(0n);
      expect(result.platformFeeMinor + result.treasuryNetMinor).toBe(result.totalRaisedMinor);
    });

    it('TC-SPL-02: Amount: 1 minor unit, fee: 500 bps yields fee 0, treasury 1, drift 0n', () => {
      const result = calculateArtizenSplit(1n, 500);
      expect(result.totalRaisedMinor).toBe(1n);
      expect(result.platformFeeMinor).toBe(0n); // Floor division: (1 * 500) / 10000 = 0
      expect(result.treasuryNetMinor).toBe(1n);
      expect(result.drift).toBe(0n);
      expect(result.platformFeeMinor + result.treasuryNetMinor).toBe(result.totalRaisedMinor);
    });

    it('TC-SPL-03: Amount: 10^15 minor units, fee: 500 bps calculates without 64-bit overflow', () => {
      const amount = 1000000000000000n; // 10^15
      const result = calculateArtizenSplit(amount, 500);
      expect(result.totalRaisedMinor).toBe(amount);
      expect(result.platformFeeMinor).toBe(50000000000000n); // 5 * 10^13
      expect(result.treasuryNetMinor).toBe(950000000000000n);
      expect(result.drift).toBe(0n);

      // Exceeding 10^15 throws RangeError (Numeric Bounds Guard)
      expect(() => calculateArtizenSplit(amount + 1n, 500)).toThrow(RangeError);
      // Negative amount throws RangeError
      expect(() => calculateArtizenSplit(-1n, 500)).toThrow(RangeError);
      // Invalid fee bps throws RangeError
      expect(() => calculateArtizenSplit(100n, 5001)).toThrow(RangeError);
    });
  });

  // ==========================================
  // SASRA Section 24 Statutory Liquidity (TC-SASRA-01)
  // ==========================================
  describe('SASRA Statutory Liquidity Reserve Guard (TC-SASRA-01)', () => {
    it('TC-SASRA-01: Correctly detects liquidity reserve compliance and shortfalls', () => {
      // 100,000 deposits with 15% reserve requirement = 15,000 required reserve
      const deposits = 100000n;

      // Case A: 14,000 available liquidity (Breach: Shortfall of 1,000)
      const breach = validateStatutoryLiquidityReserve(14000n, deposits, 1500);
      expect(breach.compliant).toBe(false);
      expect(breach.requiredReserveMinor).toBe(15000n);
      expect(breach.shortfallMinor).toBe(1000n);

      // Case B: 15,000 available liquidity (Exact threshold: Compliant)
      const exact = validateStatutoryLiquidityReserve(15000n, deposits, 1500);
      expect(exact.compliant).toBe(true);
      expect(exact.requiredReserveMinor).toBe(15000n);
      expect(exact.shortfallMinor).toBe(0n);

      // Case C: 20,000 available liquidity (Surplus: Compliant)
      const surplus = validateStatutoryLiquidityReserve(20000n, deposits, 1500);
      expect(surplus.compliant).toBe(true);
      expect(surplus.requiredReserveMinor).toBe(15000n);
      expect(surplus.shortfallMinor).toBe(0n);
    });
  });

  // ==========================================
  // Dead Letter Queue (DLQ) & Resolution (TC-DLQ-01..03)
  // ==========================================
  describe('Payment Exceptions DLQ & Webhook Resilience (TC-DLQ-01..03)', () => {
    it('TC-DLQ-01: Inbound Kotani webhook with non-existent order routes to payment_exceptions DLQ', async () => {
      let dlqInserted = false;
      let insertedPayload: Record<string, unknown> | null = null;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/payment_orders')) {
          // Order not found
          return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        if (url.includes('/rest/v1/payment_exceptions')) {
          dlqInserted = true;
          insertedPayload = JSON.parse(init?.body as string);
          return new Response(JSON.stringify([{ id: 'exc-1' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      // Valid Kotani HMAC signature simulation
      const rawBody = JSON.stringify({ reference: 'unknown_ord_999', status: 'completed', amount: 500 });
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('kotani_test_secret_123'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuf = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(rawBody));
      const signatureHex = Array.from(new Uint8Array(signatureBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const req = new Request('https://api.baraza.org/api/webhooks/kotani', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-kotani-signature': signatureHex,
        },
        body: rawBody,
      });

      const res = await kotaniWebhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
      expect(data.matched).toBe(false);
      expect(data.dlq).toBe(true);
      expect(dlqInserted).toBe(true);
      if (!insertedPayload) throw new Error('Expected insertedPayload to be defined');
      expect((insertedPayload as Record<string, unknown>).order_id).toBe('unknown_ord_999');
      expect((insertedPayload as Record<string, unknown>).status).toBe('PENDING');
    });

    it('TC-DLQ-02: Clearing webhook for unknown order routes to DLQ idempotently', async () => {
      let dlqInserted = false;
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/payment_orders')) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes('/rest/v1/payment_exceptions')) {
          dlqInserted = true;
          return new Response(JSON.stringify([{ id: 'exc-clearing-1' }]), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/webhooks/clearing', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-clearing-signature': mockProxySecret,
        },
        body: JSON.stringify({
          intentId: 'intent_123',
          orderId: 'unknown_clearing_order',
          status: 'SETTLED',
          clearedAmountMinor: 10000,
          currency: 'KES',
        }),
      });

      const res = await clearingWebhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.dlq).toBe(true);
      expect(dlqInserted).toBe(true);
    });

    it('TC-DLQ-03: Operator calls resolve_payment_exception_atomic(RETRY_MATCH) to resolve exception', async () => {
      let rpcInvoked = false;
      let rpcParams: Record<string, unknown> | null = null;

      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/rpc/resolve_payment_exception_atomic')) {
          rpcInvoked = true;
          rpcParams = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              success: true,
              exception_id: rpcParams?.p_exception_id,
              action: 'RETRY_MATCH',
              target_order_id: 'ord_matched_123',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/payments/exceptions/resolve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${mockProxySecret}`,
        },
        body: JSON.stringify({
          exceptionId: 'f0000000-0000-0000-0000-000000000001',
          action: 'RETRY_MATCH',
          targetOrderId: 'ord_matched_123',
        }),
      });

      const res = await resolveExceptionHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(rpcInvoked).toBe(true);
      if (!rpcParams) throw new Error('Expected rpcParams to be defined');
      expect((rpcParams as Record<string, unknown>).p_action).toBe('RETRY_MATCH');
      expect((rpcParams as Record<string, unknown>).p_target_order_id).toBe('ord_matched_123');
    });
  });

  // ==========================================
  // Clearing Rail Adapters Verification
  // ==========================================
  describe('Clearing Rail Adapters (Soroban & Swypt)', () => {
    it('SafeSorobanClearingAdapter: processes inbound clearing and disbursement with positive minor units', async () => {
      const adapter = new SafeSorobanClearingAdapter();
      expect(adapter.railType).toBe('SAFE_SOROBAN');

      const clearRes = await adapter.clearInbound({
        intentId: 'intent_soroban_1',
        communityId: 'comm_soroban',
        orderId: 'ord_soroban_1',
        sourceAccount: 'GBBD67W56J32QJGLS5I5SSTX6U2M2C7C4G3QO7YI7W552E4V375WCLMS',
        destinationAccount: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        amountMinor: 50000000n, // 50 XLM in stroops
        currency: 'XLM',
      });

      expect(clearRes.success).toBe(true);
      expect(clearRes.status).toBe('SETTLED');
      expect(clearRes.clearedAmountMinor).toBe(50000000n);
      expect(clearRes.txHash).toMatch(/^soroban_/);

      const disbRes = await adapter.disburse({
        disbursementId: 'disb_soroban_1',
        communityId: 'comm_soroban',
        recipientAddress: 'GBBD67W56J32QJGLS5I5SSTX6U2M2C7C4G3QO7YI7W552E4V375WCLMS',
        amountMinor: 25000000n,
        currency: 'XLM',
      });

      expect(disbRes.success).toBe(true);
      expect(disbRes.txHash).toMatch(/^soroban_disb_/);

      const balance = await adapter.getBalance('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', 'XLM');
      expect(balance).toBeGreaterThan(0n);
    });

    it('SwyptCustodialClearingAdapter: processes custodial escrow clearing and handles zero/negative bounds', async () => {
      const adapter = new SwyptCustodialClearingAdapter();
      expect(adapter.railType).toBe('CUSTODIAL_ESCROW');

      // Zero amount rejection
      const zeroClear = await adapter.clearInbound({
        intentId: 'intent_swypt_zero',
        communityId: 'comm_swypt',
        orderId: 'ord_swypt_0',
        sourceAccount: '0xSource',
        destinationAccount: '0xDest',
        amountMinor: 0n,
        currency: 'KES',
      });
      expect(zeroClear.success).toBe(false);
      expect(zeroClear.status).toBe('FAILED');

      // Valid clearing
      const validClear = await adapter.clearInbound({
        intentId: 'intent_swypt_1',
        communityId: 'comm_swypt',
        orderId: 'ord_swypt_1',
        sourceAccount: '0xSource',
        destinationAccount: '0xDest',
        amountMinor: 100000n, // 1,000.00 KES
        currency: 'KES',
      });
      expect(validClear.success).toBe(true);
      expect(validClear.status).toBe('SETTLED');
      expect(validClear.clearedAmountMinor).toBe(100000n);

      const disbRes = await adapter.disburse({
        disbursementId: 'disb_swypt_1',
        communityId: 'comm_swypt',
        recipientAddress: '0xBeneficiary',
        amountMinor: 50000n,
        currency: 'KES',
      });
      expect(disbRes.success).toBe(true);
    });
  });

  // ==========================================
  // Artizen Webhook & Settlement Trigger
  // ==========================================
  describe('Artizen Settlement Webhook', () => {
    it('CAMPAIGN_COMPLETED event invokes atomic settlement and returns settlement record', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/rest/v1/artizen_campaigns')) {
          return new Response(JSON.stringify([{ id: 'camp-101', status: 'PENDING_SETTLEMENT' }]), { status: 200 });
        }
        if (url.includes('/rest/v1/rpc/artizen_settle_campaign_atomic')) {
          return new Response(
            JSON.stringify({
              success: true,
              campaign_id: 'camp-101',
              total_raised_minor: 500000,
              platform_fee_minor: 25000,
              treasury_net_minor: 475000,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const req = new Request('https://api.baraza.org/api/webhooks/artizen', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-artizen-signature': mockProxySecret,
        },
        body: JSON.stringify({
          campaignId: 'camp-101',
          eventType: 'CAMPAIGN_COMPLETED',
          totalRaisedMinor: 500000,
        }),
      });

      const res = await artizenWebhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.settlement?.total_raised_minor).toBe(500000);
      expect(data.settlement?.platform_fee_minor).toBe(25000);
      expect(data.settlement?.treasury_net_minor).toBe(475000);
    });
  });
});
