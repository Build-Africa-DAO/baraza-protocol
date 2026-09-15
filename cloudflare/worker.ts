// cloudflare/worker.ts
// Standard: S&P 500 Enterprise Fintech (Cloudflare Edge Gateway & Scheduled Cron Dispatcher)
// Strict Zero-Any TypeScript Implementation

export interface Env {
  STELLAR_NETWORK?: string;
  STELLAR_HORIZON_URL?: string;
  STELLAR_SOROBAN_RPC?: string;
  VITE_SITE_URL?: string;
  CRON_SECRET?: string;
  ADMIN_SECRET?: string;
  API_BASE_URL?: string;
  WEBHOOK_QUEUE?: {
    send(message: unknown): Promise<void>;
  };
  HYPERDRIVE?: unknown;
}

export interface ScheduledController {
  cron: string;
  scheduledTime: number;
  noRetry(): void;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface CronDispatchResult {
  endpoint: string;
  status: number;
  ok: boolean;
  durationMs: number;
}

/**
 * Executes a single authenticated cron task against internal API endpoints.
 */
export async function executeCronTask(
  endpoint: string,
  method: 'GET' | 'POST',
  apiBaseUrl: string,
  cronSecret: string
): Promise<CronDispatchResult> {
  const start = Date.now();
  const url = `${apiBaseUrl.replace(/\/$/, '')}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Edge-Cron-Dispatcher/1.0',
      },
    });
    return {
      endpoint,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - start,
    };
  } catch {
    return {
      endpoint,
      status: 502,
      ok: false,
      durationMs: Date.now() - start,
    };
  }
}

export default {
  /**
   * HTTP Gateway Handler: Edge health checking, security headers, and request forwarding
   */
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // Edge Health Check Endpoint
    if (url.pathname === '/api/health' || url.pathname === '/healthz') {
      return new Response(
        JSON.stringify({
          ok: true,
          runtime: 'cloudflare_workers',
          edgeTimestamp: new Date().toISOString(),
          network: env.STELLAR_NETWORK || 'testnet',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Cron Trigger Ingress via Edge (gated by CRON_SECRET or ADMIN_SECRET)
    if (url.pathname === '/api/edge/trigger-crons' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization') || '';
      const secret = env.CRON_SECRET || env.ADMIN_SECRET || 'test_cron_secret';
      if (authHeader !== `Bearer ${secret}`) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const apiBase = env.API_BASE_URL || env.VITE_SITE_URL || 'http://127.0.0.1:3000';
      const results: CronDispatchResult[] = await Promise.all([
        executeCronTask('/api/cron/sweep-stale-orders', 'GET', apiBase, secret),
        executeCronTask('/api/compliance/sasra-monitoring', 'POST', apiBase, secret),
      ]);

      return new Response(JSON.stringify({ ok: true, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pass through to origin
    ctx.passThroughOnException();
    return fetch(req);
  },

  /**
   * Scheduled Cron Handler: Periodically sweeps stale orders and executes SASRA compliance monitoring
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const secret = env.CRON_SECRET || env.ADMIN_SECRET || 'test_cron_secret';
    const apiBase = env.API_BASE_URL || env.VITE_SITE_URL || 'http://127.0.0.1:3000';

    ctx.waitUntil(
      (async () => {
        const cronPattern = controller.cron;
        // Run sweep on every invocation (every 5 or 10 min)
        const tasks: Promise<CronDispatchResult>[] = [
          executeCronTask('/api/cron/sweep-stale-orders', 'GET', apiBase, secret),
        ];

        // Run SASRA monitoring every 10 min
        if (cronPattern.includes('10')) {
          tasks.push(executeCronTask('/api/compliance/sasra-monitoring', 'POST', apiBase, secret));
        }

        await Promise.allSettled(tasks);
      })()
    );
  },
};
