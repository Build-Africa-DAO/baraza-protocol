import { getAccessToken, hadWorkingSession } from '@/lib/auth/tokenProvider';

/**
 * The one HTTP client for `/api/*`.
 *
 * - Prefixes `VITE_API_BASE` when the API lives on another origin (a Worker
 *   or a separate Pages project). Unset means same-origin, the default.
 * - Attaches `Authorization: Bearer …` from whichever sign-in provider is
 *   registered (see `lib/auth/tokenProvider.ts`).
 * - Normalises the six error shapes the backend returns into one `ApiError`
 *   so screens never branch on raw status codes or raw bodies.
 * - Never throws for HTTP or network failures; callers get `{ ok: false }`.
 */

export type ApiErrorKind =
  | 'network'
  | 'auth'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'gone'
  | 'validation'
  | 'rate_limited'
  | 'misconfigured'
  | 'server'
  | 'unknown';

export interface ApiError {
  kind: ApiErrorKind;
  status: number;
  /** Snake-case code from the body (`error`, or Akili's `category`), else derived from the status. */
  code: string;
  /** Human sentence from the body, else a sentence for the kind. */
  message: string;
  /** Seconds to wait when the server said so. */
  retryAfterSec?: number;
  /** The raw body, for the few callers that need an extra field (`circuitBreaker`, `recommendedTranches`, …). */
  body: unknown;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T; response: Response }
  | { ok: false; status: number; error: ApiError; data: unknown; response: Response | null };

export interface ApiRequest {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Objects are JSON-encoded. Strings and FormData pass through. */
  body?: unknown;
  headers?: Record<string, string>;
  /** `attach` (default) adds the bearer token when one exists; `omit` never does. */
  auth?: 'attach' | 'omit';
  /** How to read the body. `json` (default), `text`, or `none` for blobs and streams (read `response` yourself). */
  parse?: 'json' | 'text' | 'none';
  signal?: AbortSignal;
}

export const API_COPY = {
  network: 'We could not reach Baraza. Check your connection and try again.',
  auth: 'Sign in to continue.',
  authExpired: 'You were signed out, possibly on another device. Sign in again to continue.',
  forbidden: 'Your account is not allowed to do this.',
  not_found: 'We could not find that on Baraza.',
  conflict: 'That was already done. Refresh to see the latest.',
  gone: 'That link has expired or has been used up.',
  validation: 'Baraza did not accept that. Check the details and try again.',
  rate_limited: 'Too many attempts. Wait a minute and try again.',
  misconfigured: 'Baraza is not set up for this yet. Nothing was changed.',
  server: 'Baraza had a problem on its side. Nothing was changed. Try again shortly.',
  unknown: 'Something went wrong. Try again.',
} as const;

/** Resolve a `/api/...` path against `VITE_API_BASE` when the API is on another origin. */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.trim().replace(/\/$/, '');
  if (!base || !path.startsWith('/api')) return path;
  return `${base}${path}`;
}

function kindFor(status: number): ApiErrorKind {
  if (status === 0) return 'network';
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 410) return 'gone';
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'misconfigured';
  if (status === 400 || status === 405 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

function messageFor(kind: ApiErrorKind): string {
  if (kind === 'auth') return hadWorkingSession() ? API_COPY.authExpired : API_COPY.auth;
  return API_COPY[kind];
}

/**
 * Collapse every backend error shape into one object.
 * Shapes seen in `app/api`: `{error, message}`, `{error}` alone, `{category, message}`
 * (Akili, often with HTTP 200), a raw PostgreSQL string in `{error}`, and plain text.
 */
export function normalizeApiError(status: number, body: unknown, statusText = '', retryAfter?: string | null): ApiError {
  const kind = kindFor(status);
  let code: string = kind;
  let message: string | undefined;

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const rawCode = record.category ?? record.error;
    if (typeof rawCode === 'string' && rawCode.trim()) {
      const looksLikeCode = /^[a-z0-9_]+$/i.test(rawCode.trim()) && rawCode.length <= 64;
      if (looksLikeCode) code = rawCode.trim();
      else message = rawCode; // a raw database or provider sentence in `error`
    }
    if (typeof record.message === 'string' && record.message.trim()) message = record.message.trim();
  } else if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) {
    message = body.trim();
  }

  // Server sentences that are not for members.
  if (message && /^(bad request|forbidden|method not allowed|unauthorized)$/i.test(message)) message = undefined;
  if (kind === 'auth' || kind === 'misconfigured' || kind === 'network' || kind === 'rate_limited') message = undefined;

  const retry = retryAfter ? Number(retryAfter) : undefined;
  return {
    kind,
    status,
    code,
    message: message ?? messageFor(kind) ?? statusText,
    retryAfterSec: Number.isFinite(retry) ? retry : undefined,
    body,
  };
}

function networkError(err: unknown): ApiError {
  const aborted = err instanceof DOMException && err.name === 'AbortError';
  return {
    kind: 'network',
    status: 0,
    code: aborted ? 'aborted' : 'network',
    message: API_COPY.network,
    body: null,
  };
}

async function readBody(response: Response, parse: ApiRequest['parse']): Promise<unknown> {
  if (parse === 'none') return null;
  const text = await response.text().catch(() => '');
  if (parse === 'text') return text;
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(path: string, init: ApiRequest = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !isForm && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
    headers['content-type'] = 'application/json';
  }
  if ((init.auth ?? 'attach') === 'attach' && !Object.keys(headers).some((h) => h.toLowerCase() === 'authorization')) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: init.method ?? (hasBody ? 'POST' : 'GET'),
      headers,
      body: hasBody ? (isForm || typeof init.body === 'string' ? (init.body as BodyInit) : JSON.stringify(init.body)) : undefined,
      signal: init.signal,
    });
  } catch (err) {
    return { ok: false, status: 0, error: networkError(err), data: null, response: null };
  }

  const body = await readBody(response, init.parse ?? 'json');

  // Akili returns HTTP 200 with `{category, message}` when the model call failed.
  const inBandError =
    response.ok && body && typeof body === 'object' && typeof (body as { category?: unknown }).category === 'string';

  if (!response.ok || inBandError) {
    const error = normalizeApiError(inBandError ? 502 : response.status, body, response.statusText, response.headers.get('retry-after'));
    if (inBandError) error.status = response.status;
    return { ok: false, status: response.status, error, data: body, response };
  }
  return { ok: true, status: response.status, data: body as T, response };
}

/** Read one extra field off an error body without repeating the type dance everywhere. */
export function errorField<T = unknown>(error: ApiError | undefined, key: string): T | undefined {
  if (!error || !error.body || typeof error.body !== 'object') return undefined;
  return (error.body as Record<string, unknown>)[key] as T | undefined;
}

/**
 * Submit-once guard. The backend has no idempotency key on any mutation, so
 * the client must make sure a double tap sends one request, not two.
 */
export function createSubmitGuard() {
  const pending = new Set<string>();
  return {
    isPending(key: string): boolean {
      return pending.has(key);
    },
    /** Runs `fn` unless the same key is already in flight, in which case it resolves `undefined`. */
    async run<T>(key: string, fn: () => Promise<T>): Promise<T | undefined> {
      if (pending.has(key)) return undefined;
      pending.add(key);
      try {
        return await fn();
      } finally {
        pending.delete(key);
      }
    },
  };
}

/** Module-wide guard for mutations that can be triggered from more than one component. */
export const submitGuard = createSubmitGuard();
