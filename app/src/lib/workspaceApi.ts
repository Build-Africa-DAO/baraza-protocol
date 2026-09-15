import { apiFetch } from '@/lib/api';

/**
 * Optional community workspace REST. The roadmap, suggestion and bounty routes
 * in the PRD do not exist on the backend yet; a 404, 405 or 501 means "not
 * built" and the caller keeps its local copy without inventing an API.
 */
export async function tryWorkspaceGet<T>(path: string): Promise<T | null> {
  const result = await apiFetch<T>(path);
  return result.ok ? result.data : null;
}

export async function tryWorkspaceMutate(
  path: string,
  init: { method?: 'POST' | 'PATCH' | 'DELETE'; headers?: Record<string, string>; body?: unknown },
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null; message?: string }> {
  const result = await apiFetch<Record<string, unknown>>(path, { method: init.method ?? 'POST', headers: init.headers, body: init.body });
  if (result.ok) return { ok: true, status: result.status, data: result.data ?? null };
  const data = result.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>) : null;
  return { ok: false, status: result.status, data, message: result.error.message };
}

export function asRecordList<T>(payload: unknown, key: string): T[] | null {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && key in (payload as Record<string, unknown>)) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return null;
}
