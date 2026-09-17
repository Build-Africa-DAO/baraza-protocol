// app/api/_lib/rate-limiter.ts
// Standard: S&P 500 Enterprise Fintech / Distributed Denial of Service (DDoS) Defense
// Dual-Engine: Upstash Redis Distributed Cluster with Process-Local Token-Bucket Fallback

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks and increments rate limit token bucket for a given key.
 *
 * @param key Unique rate limit key (e.g. `ratelimit:auth:${phone}` or `ratelimit:chat:${ip}`)
 * @param limit Maximum permitted operations within window
 * @param windowMs Time window in milliseconds (e.g. 60_000 for 1 minute)
 */
export async function checkDistributedRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis Distributed Cluster Engine
  if (upstashUrl && upstashToken) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);
      const res = await fetch(`${upstashUrl.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds, 'NX'],
          ['PTTL', key],
        ]),
      });

      if (res.ok) {
        const results = (await res.json()) as Array<{ result: number }>;
        const currentCount = Number(results[0]?.result ?? 1);
        const pttl = Number(results[2]?.result ?? windowMs);
        const resetAt = Date.now() + (pttl > 0 ? pttl : windowMs);

        return {
          allowed: currentCount <= limit,
          remaining: Math.max(0, limit - currentCount),
          resetAt,
        };
      }
    } catch {
      // Non-fatal: Fall through to in-memory store if Redis network request fails
    }
  }

  // 2. High-Fidelity In-Memory Token Bucket Fallback Engine
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Clears in-memory store for test isolation.
 */
export function clearRateLimiterStore(): void {
  memoryStore.clear();
}
