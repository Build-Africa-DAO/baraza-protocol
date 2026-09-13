import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth/tokenProvider';

/**
 * Headers for an authenticated JSON call. Prefer `apiFetch`, which does this
 * itself; this stays for the few callers that hand headers to another module
 * (the statement fetcher, the payout adapter).
 *
 * With no explicit token getter it asks the registered sign-in provider.
 */
export async function sessionHeaders(
  getToken?: () => Promise<string | null>,
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'content-type': 'application/json', ...extra };
  try {
    const token = getToken ? await getToken() : await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // The API returns 401 if a session is required.
  }
  return headers;
}

/** Thin compatibility wrapper over `apiFetch` for callers that want `{ok, status, data, message}`. */
export async function readApiJson<T>(
  input: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; message?: string }> {
  const result = await apiFetch<T>(input, {
    method: (init?.method as 'GET' | 'POST' | 'PATCH' | 'DELETE' | undefined) ?? 'GET',
    body: typeof init?.body === 'string' ? init.body : undefined,
    headers: (init?.headers as Record<string, string> | undefined) ?? undefined,
  });
  if (result.ok) return { ok: true, status: result.status, data: result.data };
  return { ok: false, status: result.status, data: (result.data as T | null) ?? null, message: result.error.message };
}
