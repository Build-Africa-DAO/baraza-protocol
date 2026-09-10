// app/api/auth/verify.ts
// Standard: S&P 500 Enterprise Fintech (NIST SP 800-63B Rate Limiting & 256-bit CSPRNG Sessions)
// Reference: Custom Auth Specification §2.3

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { hashOtp } from './signup/request';
import { hashSessionToken } from '../_lib/auth-session';
import { enforceMaxActiveSessions } from '../_lib/crypto';

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32); // 256 bits of CSPRNG entropy
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `brz_sess_${hex}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  let body: { email?: string; code?: string; purpose?: string; fullName?: string };
  try {
    body = (await req.json()) as { email?: string; code?: string; purpose?: string; fullName?: string };
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  const purpose = body.purpose || 'signup';

  if (!email || !code) {
    return jsonResponse({ error: 'invalid_request', message: 'email and code are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Fetch Active Challenge
  const { data: challenge } = await supabase
    .from('auth_otp_challenges')
    .select('*')
    .eq('destination', email)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge || challenge.attempts_remaining <= 0) {
    return jsonResponse(
      { error: 'invalid_code', message: 'Verification code is invalid or has expired. Please request a new one.' },
      { status: 400 }
    );
  }

  // 2. Cryptographic Code Verification
  const pepper = process.env.PAYMENT_PHONE_HASH_PEPPER || process.env.OTP_PEPPER || 'baraza_otp_pepper_2026';
  const computedHash = await hashOtp(code, pepper);

  if (computedHash !== challenge.code_hash) {
    const remaining = challenge.attempts_remaining - 1;
    if (remaining <= 0) {
      // Invalidate on brute-force exhaustion
      await supabase
        .from('auth_otp_challenges')
        .update({ attempts_remaining: 0, consumed_at: new Date().toISOString() })
        .eq('id', challenge.id);

      return jsonResponse(
        {
          error: 'too_many_attempts',
          message: 'Too many incorrect attempts. This code has been invalidated for your security.',
        },
        { status: 400 }
      );
    }

    // Decrement attempts remaining
    await supabase
      .from('auth_otp_challenges')
      .update({ attempts_remaining: remaining })
      .eq('id', challenge.id);

    return jsonResponse(
      {
        error: 'incorrect_code',
        message: `Incorrect code. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
        attemptsRemaining: remaining,
      },
      { status: 400 }
    );
  }

  // 3. Consume Challenge
  await supabase
    .from('auth_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', challenge.id);

  // 4. Resolve or Create User Profile
  let userProfileId: string;
  let userRecord: { id: string; email: string; full_name?: string; role?: string };

  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    userProfileId = existingProfile.id;
    userRecord = existingProfile;
  } else {
    // Create new profile for signup
    const { data: newProfile, error: createErr } = await supabase
      .from('user_profiles')
      .insert({
        email,
        full_name: body.fullName || email.split('@')[0],
        role: 'member',
        is_active: true,
      })
      .select('id, email, full_name, role')
      .single();

    if (createErr || !newProfile) {
      return jsonResponse({ error: 'profile_creation_failed', message: createErr?.message }, { status: 500 });
    }
    userProfileId = newProfile.id;
    userRecord = newProfile;
  }

  // 5. Enforce Invariant I-AUTH-2: Bounded Concurrent Sessions (Max 5 active sessions)
  await enforceMaxActiveSessions(userProfileId);

  // 6. Mint 256-bit CSPRNG Bearer Session Token (30 Days TTL)
  const rawSessionToken = generateSessionToken();
  const sessionTokenHash = await hashSessionToken(rawSessionToken);
  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('auth_sessions').insert({
    user_profile_id: userProfileId,
    session_token_hash: sessionTokenHash,
    expires_at: sessionExpiresAt,
    user_agent: req.headers.get('user-agent'),
  });

  // 6. Set HttpOnly Cookie & Return Structured Auth Response
  const isSecure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const cookieValue = `BARAZA_SESSION=${rawSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${isSecure}`;

  return new Response(
    JSON.stringify({
      ok: true,
      sessionToken: rawSessionToken,
      user: userRecord,
      message: 'Authentication successful.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieValue,
      },
    }
  );
}
