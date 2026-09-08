/**
 * Optional community workspace REST. Roadmap / suggestions / bounty routes in the
 * PRD are not shipped yet — 404/405 falls back to local storage without inventing APIs.
 */
export async function tryWorkspaceGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (res.status === 404 || res.status === 405 || res.status === 501) return null;
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function tryWorkspaceMutate(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  try {
    const res = await fetch(path, init);
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export function asRecordList<T>(payload: unknown, key: string): T[] | null {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && key in (payload as Record<string, unknown>)) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return null;
}
