// app/functions/api/[[catchall]].ts
// Standard: S&P 500 Enterprise Fintech (Cloudflare Pages Functions Catchall API Ingress)
// Strict Zero-Any TypeScript Implementation

import { dispatchApiRoute } from '../../../cloudflare/edgeRouter';

export interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export async function onRequest(context: EventContext): Promise<Response> {
  return dispatchApiRoute(context.request);
}
