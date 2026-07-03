/**
 * Identity continuity — pure helpers for the claim flow (Phase 9).
 *
 * Council ruling 2026-06-19: phone_hash is canonical. Wallets are pointers.
 * Bidirectional claim flow: USSD-initiated and wallet-initiated paths
 * converge on the same `identity_links` table.
 *
 * Security posture:
 *   - 6-digit numeric code (1,000,000 combinations) is the proof of phone
 *     access. Codes are SHA-256-hashed at rest; comparison is constant-time
 *     via timingSafeEqual.
 *   - Pepper-derived phone_hash matches payment_orders.user_id_hash so
 *     identity joins are consistent across the stack.
 *   - Attempts counter on the pending row; the API enforces a hard cap
 *     (5 attempts) before the claim is killed.
 *   - TTL 10 minutes; expired claims are dead.
 */

const CODE_DIGITS = 6;
const CLAIM_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export const IDENTITY_CLAIM_CONSTANTS = {
  CODE_DIGITS,
  CLAIM_TTL_MS,
  MAX_VERIFY_ATTEMPTS,
} as const;

/**
 * Generate a zero-padded 6-digit numeric code via crypto.getRandomValues.
 * `Math.random()` is not permissible here — the code is a security token.
 */
export function generateClaimCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  // Map 4 bytes → 0..10^6 by modulo. The bias from 2^32 % 10^6 is ~58
  // codes out of 4.29B (negligible for 1M-entropy use), and SHA-256-hash
  // storage means the code never sits readable at rest.
  const n = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return (n % 1_000_000).toString().padStart(CODE_DIGITS, '0');
}

export async function hashClaimCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pepper-derived phone hash. Identical algorithm to payment_orders'
 * `hashUserId()` in `api/stellar/verify-payment.ts` so the keys match.
 */
export async function hashPhoneNumber(phone: string): Promise<string> {
  const pepper = process.env.PAYMENT_PHONE_HASH_PEPPER?.trim();
  if (!pepper) {
    throw new Error('PAYMENT_PHONE_HASH_PEPPER is required for identity claims');
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(phone));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison. Same primitive used in
 * `payment-orders/status.ts:timingSafeEqual` — kept here to keep the
 * identity module self-contained.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface PendingClaimSnapshot {
  phoneHash: string;
  codeHash: string;
  initiatedBy: 'ussd' | 'wallet';
  pendingWalletAddress: string | null;
  attempts: number;
  expiresAt: number;
  consumedAt: number | null;
}

export type VerifyClaimResult =
  | { ok: true; phoneHash: string; walletAddress: string }
  | { ok: false; reason: 'expired' | 'already_consumed' | 'too_many_attempts' | 'invalid_code' | 'wallet_mismatch' };

/**
 * Pure verifier. The API layer fetches the pending row, calls this with
 * the snapshot + submitted code + the wallet address that should be linked,
 * and on `ok: true` writes the identity_link + marks the pending row
 * consumed. On `ok: false` the API increments `attempts` and either
 * retries or kills the claim.
 */
export async function verifyClaim(args: {
  pending: PendingClaimSnapshot;
  submittedCode: string;
  walletAddress: string;
  now?: number;
}): Promise<VerifyClaimResult> {
  const now = args.now ?? Date.now();
  const p = args.pending;

  if (p.consumedAt !== null) return { ok: false, reason: 'already_consumed' };
  if (p.expiresAt <= now) return { ok: false, reason: 'expired' };
  if (p.attempts >= MAX_VERIFY_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' };

  // If the claim was wallet-initiated, the verifying wallet must match.
  if (
    p.initiatedBy === 'wallet' &&
    p.pendingWalletAddress &&
    p.pendingWalletAddress !== args.walletAddress
  ) {
    return { ok: false, reason: 'wallet_mismatch' };
  }

  const submittedHash = await hashClaimCode(args.submittedCode);
  if (!timingSafeEqualHex(submittedHash, p.codeHash)) {
    return { ok: false, reason: 'invalid_code' };
  }

  return { ok: true, phoneHash: p.phoneHash, walletAddress: args.walletAddress };
}

/**
 * Audit proof — HMAC of (code || nonce) under the same pepper. Stored on
 * the identity_link row so we can later prove the claim event happened
 * without retaining the code itself.
 */
export async function buildVerificationProof(
  code: string,
  nonce: string,
): Promise<string> {
  const pepper = process.env.PAYMENT_PHONE_HASH_PEPPER?.trim();
  if (!pepper) {
    throw new Error('PAYMENT_PHONE_HASH_PEPPER required for verification proof');
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${code}|${nonce}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
