// app/api/auth/logout.ts
// Standard: S&P 500 Enterprise Fintech (Instant Session Revocation & Cookie Clearing)
// Reference: Custom Auth Specification §2.5

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { hashSessionToken, parseCookies } from '../_lib/auth-session';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const cookies = parseCookies(req.headers.get('cookie'));
  const cookieToken = cookies['BARAZA_SESSION'] || cookies['baraza_session'];

  const authHeader = req.headers.get('authorization');
  let bearerToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const tokenToRevoke = cookieToken || bearerToken;

  if (tokenToRevoke && tokenToRevoke.startsWith('brz_sess_')) {
    const tokenHash = await hashSessionToken(tokenToRevoke);
    const supabase = getSupabaseAdmin();
    await supabase
      .from('auth_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_token_hash', tokenHash);
  }

  // Clear Session Cookie
  const isSecure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const clearCookie = `BARAZA_SESSION=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure}`;

  return new Response(JSON.stringify({ ok: true, message: 'Logged out successfully.' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie,
    },
  });
}
