export async function sessionHeaders(
  getAccessToken?: () => Promise<string | null>,
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'content-type': 'application/json', ...extra };
  try {
    const token = await getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Profile/officer calls still proceed; the API returns 401 if a session is required.
  }
  return headers;
}

export async function readApiJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; message?: string }> {
  try {
    const res = await fetch(input, init);
    const data = (await res.json().catch(() => null)) as T | { message?: string } | null;
    const message = data && typeof data === 'object' && 'message' in data
      ? String((data as { message?: string }).message ?? '')
      : undefined;
    return { ok: res.ok, status: res.status, data: res.ok ? (data as T) : (data as T | null), message };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      message: err instanceof Error ? err.message : 'Network error. Try again.',
    };
  }
}
