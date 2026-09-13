import { apiFetch, type ApiError } from '@/lib/api';

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
  error?: ApiError;
}> {
  const token = getAccessToken ? await getAccessToken().catch(() => null) : null;
  const result = await apiFetch<{ ok?: boolean; communityId?: string; alreadyMember?: boolean; joined?: boolean; message?: string }>(
    '/api/communities/invites/accept',
    { method: 'POST', body: { code }, headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (!result.ok) {
    return { ok: false, status: result.status, message: inviteErrorCopy(result.error), error: result.error };
  }
  const data = result.data ?? {};
  return {
    ok: Boolean(data.communityId),
    status: result.status,
    communityId: data.communityId,
    alreadyMember: data.alreadyMember,
    joined: data.joined,
    message: data.message,
  };
}

/** Member-facing sentences for the invite route's documented failures. */
export function inviteErrorCopy(error: ApiError): string {
  switch (error.code) {
    case 'not_found':
      return 'That invite does not exist. Check the link or ask the member who sent it.';
    case 'expired':
      return 'That invite has expired. Ask an officer for a new link.';
    case 'capacity_exhausted':
      return 'That invite has been used up. Ask an officer for a new link.';
    case 'forbidden':
      return 'This group is not accepting members right now.';
    default:
      break;
  }
  if (error.kind === 'rate_limited') return 'Too many attempts. Wait a minute and try the link again.';
  if (error.kind === 'auth') return 'Sign in to accept this invite.';
  return error.message;
}
