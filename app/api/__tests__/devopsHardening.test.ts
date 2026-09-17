// @vitest-environment node
/**
 * =============================================================================
 * DevOps & Infrastructure Hardening Test Suite: Baraza Protocol
 * Standard: S&P 500 Enterprise Fintech / NIST SP 800-63B / Zero-Trust Architecture
 *
 * Exhaustively evaluates:
 *   1. Emergency Circuit Breaker (Migration 042 & Master Runbook §8.1)
 *   2. Dual-Engine Distributed Rate Limiter (NET-05 / DDoS Defense)
 *   3. Dead-Letter Queue (DLQ) Alerting & Telemetry
 *   4. Critical Financial Endpoints Fail-Closed Circuit Breaker Integration
 * =============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import {
  isCircuitBreakerActive,
  setCircuitBreakerState,
  clearCircuitBreakerMemoryCache,
  resetCircuitBreakerForTesting,
} from '../_lib/circuit-breaker';
import {
  checkDistributedRateLimit,
  clearRateLimiterStore,
} from '../_lib/rate-limiter';
import { alertDeadLetterQueue } from '../_lib/observability';
import minisendHandler from '../payments/minisend';
import stkPushHandler from '../mpesa/stk-push';
import { POST as cronPromoteHandler } from '../cron/promote-orders';

describe('DevOps & Production Reliability Hardening Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...originalEnv };
    clearCircuitBreakerMemoryCache();
    clearRateLimiterStore();
    vi.restoreAllMocks();
    await resetCircuitBreakerForTesting();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    clearCircuitBreakerMemoryCache();
    clearRateLimiterStore();
    vi.restoreAllMocks();
    await resetCircuitBreakerForTesting();
  });

  afterAll(async () => {
    process.env = { ...originalEnv };
    await resetCircuitBreakerForTesting();
  });

  // ---------------------------------------------------------------------------
  // 1. Emergency Circuit Breaker (Migration 042)
  // ---------------------------------------------------------------------------
  describe('Global Emergency Circuit Breaker', () => {
    it('defaults to inactive when no killswitch or DB state is active', async () => {
      delete process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE;
      clearCircuitBreakerMemoryCache();

      const result = await isCircuitBreakerActive('mpesa');
      expect(result.active).toBe(false);
      expect(result.reason).toBe('');
    });

    it('immediately activates when process environment override killswitch is set', async () => {
      process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE = 'true';
      process.env.EMERGENCY_CIRCUIT_BREAKER_REASON = 'Regulatory inspection freeze';

      const result = await isCircuitBreakerActive('minisend');
      expect(result.active).toBe(true);
      expect(result.reason).toBe('Regulatory inspection freeze');
    });

    it('enforces rail-specific isolation when specified in state', async () => {
      delete process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE;

      // Mock database state via setCircuitBreakerState or direct injection
      const mockState = {
        isPaused: true,
        reason: 'Safaricom Daraja Maintenance',
        pausedAt: new Date().toISOString(),
        pausedBy: 'devops-lead@baraza.network',
        affectedRails: ['mpesa'],
      };

      try {
        // When checking mpesa rail, should be active
        const mpesaResult = await setCircuitBreakerState(mockState);
        expect(mpesaResult.isPaused).toBe(true);

        const checkMpesa = await isCircuitBreakerActive('mpesa');
        expect(checkMpesa.active).toBe(true);
        expect(checkMpesa.reason).toBe('Safaricom Daraja Maintenance');

        // When checking minisend rail, should remain unpaused
        const checkMinisend = await isCircuitBreakerActive('minisend');
        expect(checkMinisend.active).toBe(false);
      } finally {
        await resetCircuitBreakerForTesting();
      }
    });

    it('utilizes in-memory caching to avoid database thrashing', async () => {
      delete process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE;

      try {
        await setCircuitBreakerState({
          isPaused: true,
          reason: 'Cached Emergency Freeze',
          pausedAt: new Date().toISOString(),
          pausedBy: 'admin',
          affectedRails: ['mpesa', 'minisend', 'cron'],
        });

        // Subsequent call should hit cache without network errors
        const result1 = await isCircuitBreakerActive('cron');
        const result2 = await isCircuitBreakerActive('cron');

        expect(result1.active).toBe(true);
        expect(result2.active).toBe(true);
      } finally {
        await resetCircuitBreakerForTesting();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Dual-Engine Distributed Rate Limiter
  // ---------------------------------------------------------------------------
  describe('Distributed Rate Limiter', () => {
    it('enforces token-bucket rate limit under local memory engine', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const testKey = 'ratelimit:test:user1';
      const limit = 3;
      const windowMs = 5000;

      // First 3 requests permitted
      for (let i = 1; i <= limit; i++) {
        const res = await checkDistributedRateLimit(testKey, limit, windowMs);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(limit - i);
      }

      // 4th request rejected
      const blockedRes = await checkDistributedRateLimit(testKey, limit, windowMs);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
    });

    it('resets counters after clearRateLimiterStore is invoked', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const testKey = 'ratelimit:test:reset';
      await checkDistributedRateLimit(testKey, 1, 60_000);
      const blocked = await checkDistributedRateLimit(testKey, 1, 60_000);
      expect(blocked.allowed).toBe(false);

      clearRateLimiterStore();

      const fresh = await checkDistributedRateLimit(testKey, 1, 60_000);
      expect(fresh.allowed).toBe(true);
    });

    it('falls back seamlessly to in-memory store if Redis returns network error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      // Mock fetch rejection to test fail-safe fallback
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Redis connection timeout'));

      try {
        const res = await checkDistributedRateLimit('ratelimit:failover:test', 5, 60_000);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(4);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Dead-Letter Queue (DLQ) Alerting & Telemetry
  // ---------------------------------------------------------------------------
  describe('Observability & DLQ Alerting', () => {
    it('dispatches DLQ notification to Slack webhook when configured', async () => {
      process.env.OPS_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/MOCK/WEBHOOK/123';

      let dispatchedPayload: { text?: string } | null = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url, opts) => {
        if (typeof url === 'string' && url.includes('slack.com')) {
          dispatchedPayload = JSON.parse(opts?.body as string);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return originalFetch(url, opts);
      });

      try {
        await alertDeadLetterQueue({
          orderId: 'ord_test_dlq_123',
          rail: 'mpesa',
          errorMessage: 'Telco timeout after 60s',
          severity: 'CRITICAL',
          amount: '5000',
          currency: 'KES',
        });

        const payload = dispatchedPayload as { text?: string } | null;
        expect(payload).not.toBeNull();
        expect(payload?.text).toContain('ord_test_dlq_123');
        expect(payload?.text).toContain('CRITICAL');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('fails safely and non-fatally if Slack notification fails', async () => {
      process.env.OPS_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/BROKEN';

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Slack gateway 504'));

      try {
        // Should not throw
        await expect(
          alertDeadLetterQueue({
            orderId: 'ord_silent_fail',
            rail: 'minisend',
            errorMessage: 'Gateway disconnect',
            severity: 'HIGH',
          }),
        ).resolves.not.toThrow();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Financial Endpoints Fail-Closed Circuit Breaker Integration
  // ---------------------------------------------------------------------------
  describe('Endpoint Fail-Closed Tripwires', () => {
    it('Minisend rejects with HTTP 503 when circuit breaker is active', async () => {
      process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE = 'true';
      process.env.EMERGENCY_CIRCUIT_BREAKER_REASON = 'Emergency Liquidity Halting';

      const req = new Request('https://barazaprotocol.com/api/payments/minisend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: '254712345678',
          usdcAmount: '10',
          chain: 'stellar',
        }),
      });

      const res = await minisendHandler(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.circuitBreaker).toBe(true);
      expect(data.message).toContain('Emergency Liquidity Halting');
    });

    it('M-Pesa STK Push rejects with HTTP 503 when circuit breaker is active', async () => {
      process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE = 'true';
      process.env.EMERGENCY_CIRCUIT_BREAKER_REASON = 'Safaricom Maintenance Outage';

      const req = new Request('https://barazaprotocol.com/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '254712345678',
          amount: 100,
        }),
      });

      const res = await stkPushHandler(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.circuitBreaker).toBe(true);
      expect(data.message).toContain('Safaricom Maintenance Outage');
    });

    it('Cron Order Promoter halts execution with HTTP 503 when circuit breaker is active', async () => {
      process.env.CRON_SECRET = 'super-secret-cron-token';
      process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE = 'true';
      process.env.EMERGENCY_CIRCUIT_BREAKER_REASON = 'Settlement ledger freeze';

      const req = new Request('https://barazaprotocol.com/api/cron/promote-orders', {
        method: 'POST',
        headers: {
          authorization: 'Bearer super-secret-cron-token',
        },
      });

      const res = await cronPromoteHandler(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe('emergency_paused');
      expect(data.reason).toBe('Settlement ledger freeze');
    });
  });
});
