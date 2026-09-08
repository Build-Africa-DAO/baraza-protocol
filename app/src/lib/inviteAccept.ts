import { sessionHeaders } from '@/lib/sessionHeaders';

export function extractInviteCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, 'https://barazaprotocol.com');
    const fromQuery = url.searchParams.get('invite');
    if (fromQuery && /^[a-zA-Z0-9_-]{6,32}$/.test(fromQuery)) return fromQuery;
  } catch {
    // Fall through to a raw code.
  }
  if (/^[a-zA-Z0-9_-]{6,32}$/.test(trimmed)) return trimmed;
  return null;
}

export async function acceptInviteCode(
  code: string,
  getAccessToken?: () => Promise<string | null>,
): Promise<{
  ok: boolean;
  status: number;
  communityId?: string;
  alreadyMember?: boolean;
  joined?: boolean;
  message?: string;
}> {
  const headers = await sessionHeaders(getAccessToken);
  try {
    const res = await fetch('/api/communities/invites/accept', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      communityId?: string;
      alreadyMember?: boolean;
      joined?: boolean;
      message?: string;
    };
    return {
      ok: res.ok && Boolean(data.communityId),
      status: res.status,
      communityId: data.communityId,
      alreadyMember: data.alreadyMember,
      joined: data.joined,
      message: data.message,
    };
  } catch {
    return { ok: false, status: 0, message: 'Could not reach the invite service.' };
  }
}
