// app/api/auth/signin/request.ts
// Standard: S&P 500 Enterprise Fintech (NIST SP 800-63B Sign-In Challenge)
// Reference: Custom Auth Specification §2.2

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { sendTransactionalEmail } from '../../_lib/mail';
import { hashOtp } from '../signup/request';

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

  // 1. Verify User Exists
  const { data: user } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, is_active')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return jsonResponse(
      { error: 'user_not_found', message: 'No account found with this email. Please sign up first.' },
      { status: 404 }
    );
  }

  if (user.is_active === false) {
    return jsonResponse(
      { error: 'account_suspended', message: 'This account has been suspended. Please contact support.' },
      { status: 403 }
    );
  }

  // 2. Invalidate prior unconsumed signin challenges
  await supabase
    .from('auth_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('destination', email)
    .eq('purpose', 'signin')
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
    purpose: 'signin',
    attempts_remaining: 5,
    expires_at: expiresAt,
  });

  if (insertErr) {
    return jsonResponse({ error: 'challenge_failed', message: insertErr.message }, { status: 500 });
  }

  // Extract client metadata for sign-in security alert
  const userAgent = req.headers.get('user-agent') || 'Browser';
  const signedInAt = new Date().toUTCString();

  // 5. Dispatch Email & Outbox Record
  await sendTransactionalEmail(email, 'signin-otp', {
    otp,
    expires_minutes: '10',
    email,
    device: 'Desktop/Mobile',
    browser: userAgent.slice(0, 40),
    location: 'Verified IP',
    signed_in_at: signedInAt,
  });

  await supabase.from('notification_outbox').insert({
    destination: email,
    channel: 'email',
    template_id: 'signin-otp',
    template_vars: {
      otp,
      expires_minutes: '10',
      email,
      device: 'Desktop/Mobile',
      browser: userAgent.slice(0, 40),
      location: 'Verified IP',
      signed_in_at: signedInAt,
    },
    status: 'SENT',
    sent_at: new Date().toISOString(),
  });

  return jsonResponse({
    ok: true,
    destination: email,
    expiresInMinutes: 10,
    message: 'Sign-in code sent to your email.',
  });
}
