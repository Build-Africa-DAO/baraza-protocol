// app/api/auth/me.ts
// Standard: S&P 500 Enterprise Fintech (Authenticated Profile Introspection)
// Reference: Custom Auth Specification §2.6

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { resolveCallerIdentity } from '../_lib/auth-session';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const identity = await resolveCallerIdentity(req, 'get-current-user');
  if (!identity) {
    return jsonResponse({ error: 'unauthorized', message: 'No active session or valid credentials found.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  if (identity.userProfileId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_active, phone_e164, created_at')
      .eq('id', identity.userProfileId)
      .maybeSingle();

    if (!profile) {
      return jsonResponse({ error: 'profile_not_found', message: 'User profile not found.' }, { status: 404 });
    }

    return jsonResponse({
      ok: true,
      user: profile,
      authMethod: identity.authMethod,
    });
  }

  if (identity.walletAddress) {
    return jsonResponse({
      ok: true,
      user: {
        walletAddress: identity.walletAddress,
        role: 'member',
      },
      authMethod: identity.authMethod,
    });
  }

  if (identity.privyDid) {
    return jsonResponse({
      ok: true,
      user: {
        privyDid: identity.privyDid,
        role: 'member',
      },
      authMethod: identity.authMethod,
    });
  }

  return jsonResponse({ error: 'unauthorized', message: 'Unable to resolve user profile.' }, { status: 401 });
}
