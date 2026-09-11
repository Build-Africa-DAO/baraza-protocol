// app/api/_lib/crypto.ts
// Standard: S&P 500 Enterprise Fintech (Cryptographic Invariants, Constant-Time HMAC & Security Primitives)
// Reference: NIST SP 800-63B §5.1.1, OWASP API Security Top 10 (2023), Invariants I-SEC-1, I-SEC-2, I-AUTH-2

import crypto from 'node:crypto';
import { getSupabaseAdmin } from './supabase';

/**
 * Constant-time string comparison eliminating timing side-channels (Invariant I-SEC-2).
 * Both inputs are hashed with SHA-256 to ensure equal 32-byte buffers prior to invoking
 * `crypto.timingSafeEqual`, preventing unhandled RangeError exceptions on unequal lengths.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Computes an HMAC-SHA256 hexadecimal digest for a given secret and payload.
 */
export function computeHmacSha256(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

export interface WebhookSignatureVerificationResult {
  valid: boolean;
  reason?: 'MISSING_SECRET' | 'MISSING_SIGNATURE' | 'INVALID_SIGNATURE';
}

/**
 * Verifies inbound webhook signatures enforcing Invariant I-SEC-1 (Fail-Closed).
 * Supports both HMAC-SHA256 digest comparison against raw body and direct constant-time token comparison.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string | null | undefined,
  secret: string | undefined
): WebhookSignatureVerificationResult {
  if (!secret || secret.trim() === '') {
    return { valid: false, reason: 'MISSING_SECRET' };
  }
  if (!signature || signature.trim() === '') {
    return { valid: false, reason: 'MISSING_SIGNATURE' };
  }

  const cleanSig = signature.replace(/^Bearer\s+/i, '').replace(/^sha256=/i, '').trim();
  const cleanSecret = secret.trim();

  // Mode 1: Signature is an HMAC-SHA256 digest of the request body
  const expectedHmac = computeHmacSha256(cleanSecret, body);
  if (constantTimeCompare(cleanSig, expectedHmac)) {
    return { valid: true };
  }

  // Mode 2: Direct shared secret token comparison (e.g. apikey header)
  if (constantTimeCompare(cleanSig, cleanSecret)) {
    return { valid: true };
  }

  return { valid: false, reason: 'INVALID_SIGNATURE' };
}

/**
 * Resolves client IP following the Trusted Proxy Chain Model (OWASP API8 / NET-01).
 * Inspects `cf-connecting-ip` (Cloudflare), `x-real-ip` (Nginx), or the rightmost
 * untrusted hop of `x-forwarded-for` to prevent header spoofing attacks.
 */
export function resolveClientIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) return xRealIp.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return '127.0.0.1';
}

/**
 * Enforces Invariant I-AUTH-2: Bounded Concurrent Sessions (Max 5 active sessions).
 * When active session count >= maxActive, automatically revokes the oldest active
 * session in FIFO sequence.
 */
export async function enforceMaxActiveSessions(userId: string, maxActive = 5): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: activeSessions, error } = await supabase
    .from('auth_sessions')
    .select('id, created_at')
    .eq('user_profile_id', userId)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: true });

  if (error || !activeSessions) return;

  const excessCount = activeSessions.length - (maxActive - 1);
  if (excessCount > 0) {
    const toRevoke = activeSessions.slice(0, excessCount).map((s) => s.id);
    await supabase
      .from('auth_sessions')
      .update({ revoked_at: now })
      .in('id', toRevoke);
  }
}

/**
 * Redacts sensitive credentials (e.g. 6-digit OTP code) from notification_outbox
 * post-transmission in accordance with NIST SP 800-63B §5.1.1 and ODPC 2019 §25.
 */
export async function sanitizeOutboxOtp(outboxId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from('notification_outbox')
    .select('id, template_vars')
    .eq('id', outboxId)
    .maybeSingle();

  if (!row || !row.template_vars || typeof row.template_vars !== 'object') return;

  const sanitized = { ...(row.template_vars as Record<string, unknown>) };
  if ('code' in sanitized) sanitized.code = '******';
  if ('otp' in sanitized) sanitized.otp = '******';
  if ('token' in sanitized) sanitized.token = '******';

  await supabase
    .from('notification_outbox')
    .update({ template_vars: sanitized })
    .eq('id', outboxId);
}
