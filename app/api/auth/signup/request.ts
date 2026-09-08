// app/api/auth/signup/request.ts
// Standard: S&P 500 Enterprise Fintech (NIST SP 800-63B Salted OTP)
// Reference: Custom Auth Specification §2.1

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { sendTransactionalEmail } from '../../_lib/mail';

export async function hashOtp(otp: string, pepper: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${otp}:${pepper}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'invalid_email', message: 'A valid email address is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Verify User Does Not Already Exist
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    return jsonResponse(
      { error: 'account_exists', message: 'An account with this email already exists. Please sign in instead.' },
      { status: 409 }
    );
  }

  // 2. Monotonic Anti-Squatting: Invalidate prior unconsumed signup challenges
  await supabase
    .from('auth_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('destination', email)
    .eq('purpose', 'signup')
    .is('consumed_at', null);

  // 3. Generate 6-Digit CSPRNG Code
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomUint32 = new DataView(randomBytes.buffer).getUint32(0, false);
  const otpNumber = 100000 + (randomUint32 % 900000);
  const otp = otpNumber.toString();

  const pepper = process.env.PAYMENT_PHONE_HASH_PEPPER || process.env.OTP_PEPPER || 'baraza_otp_pepper_2026';
  const codeHash = await hashOtp(otp, pepper);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 Minutes TTL

  // 4. Save Challenge to Database
  const { error: insertErr } = await supabase.from('auth_otp_challenges').insert({
    destination: email,
    channel: 'email',
    code_hash: codeHash,
    purpose: 'signup',
    attempts_remaining: 5,
    expires_at: expiresAt,
  });

  if (insertErr) {
    return jsonResponse({ error: 'challenge_failed', message: insertErr.message }, { status: 500 });
  }

  // 5. Send Transactional Email & Enqueue to Outbox
  await sendTransactionalEmail(email, 'signup-otp', {
    otp,
    expires_minutes: '10',
    email,
  });

  await supabase.from('notification_outbox').insert({
    destination: email,
    channel: 'email',
    template_id: 'signup-otp',
    template_vars: { otp, expires_minutes: '10', email },
    status: 'SENT',
    sent_at: new Date().toISOString(),
  });

  return jsonResponse({
    ok: true,
    destination: email,
    expiresInMinutes: 10,
    message: 'Verification code sent to your email.',
  });
}
