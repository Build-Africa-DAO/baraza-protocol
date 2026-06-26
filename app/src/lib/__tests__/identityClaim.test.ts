import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  IDENTITY_CLAIM_CONSTANTS,
  buildVerificationProof,
  generateClaimCode,
  hashClaimCode,
  hashPhoneNumber,
  timingSafeEqualHex,
  verifyClaim,
  type PendingClaimSnapshot,
} from '@/lib/identity/claim';

const ORIG = { ...process.env };
beforeEach(() => {
  process.env.PAYMENT_PHONE_HASH_PEPPER = 'test-pepper-abc';
});
afterEach(() => {
  process.env = { ...ORIG };
});

describe('generateClaimCode', () => {
  it('returns a 6-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateClaimCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(IDENTITY_CLAIM_CONSTANTS.CODE_DIGITS);
    }
  });

  it('generates differing codes across calls (entropy sanity)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) set.add(generateClaimCode());
    // 200 draws from 1M-space should produce ~200 unique values
    expect(set.size).toBeGreaterThan(190);
  });
});

describe('hashClaimCode + timingSafeEqualHex', () => {
  it('hashClaimCode is deterministic', async () => {
    const a = await hashClaimCode('123456');
    const b = await hashClaimCode('123456');
    expect(a).toBe(b);
  });

  it('timingSafeEqualHex matches identical strings', async () => {
    const h = await hashClaimCode('123456');
    expect(timingSafeEqualHex(h, h)).toBe(true);
  });

  it('timingSafeEqualHex rejects mismatched strings', async () => {
    const a = await hashClaimCode('111111');
    const b = await hashClaimCode('222222');
    expect(timingSafeEqualHex(a, b)).toBe(false);
  });

  it('timingSafeEqualHex rejects different-length inputs without crashing', () => {
    expect(timingSafeEqualHex('abc', 'abcd')).toBe(false);
  });
});

describe('hashPhoneNumber', () => {
  it('returns a 64-char hex hash when pepper is set', async () => {
    const h = await hashPhoneNumber('+254712345678');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('throws when pepper is absent', async () => {
    delete process.env.PAYMENT_PHONE_HASH_PEPPER;
    await expect(hashPhoneNumber('+254712345678')).rejects.toThrow(/PEPPER/);
  });

  it('produces different hashes for different phone numbers', async () => {
    const a = await hashPhoneNumber('+254712345678');
    const b = await hashPhoneNumber('+254712999999');
    expect(a).not.toBe(b);
  });
});

describe('buildVerificationProof', () => {
  it('changes when the code or nonce changes', async () => {
    const a = await buildVerificationProof('111111', 'n1');
    const b = await buildVerificationProof('111111', 'n2');
    const c = await buildVerificationProof('222222', 'n1');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('is deterministic for the same code+nonce', async () => {
    const a = await buildVerificationProof('111111', 'n1');
    const b = await buildVerificationProof('111111', 'n1');
    expect(a).toBe(b);
  });
});

describe('verifyClaim — happy path', () => {
  it('accepts a valid code', async () => {
    const code = '424242';
    const codeHash = await hashClaimCode(code);
    const phoneHash = await hashPhoneNumber('+254712345678');
    const pending: PendingClaimSnapshot = {
      phoneHash,
      codeHash,
      initiatedBy: 'wallet',
      pendingWalletAddress: 'WALLET_A',
      attempts: 0,
      expiresAt: Date.now() + 60_000,
      consumedAt: null,
    };
    const r = await verifyClaim({ pending, submittedCode: code, walletAddress: 'WALLET_A' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.phoneHash).toBe(phoneHash);
      expect(r.walletAddress).toBe('WALLET_A');
    }
  });
});

describe('verifyClaim — rejection paths', () => {
  async function basePending(): Promise<PendingClaimSnapshot> {
    return {
      phoneHash: await hashPhoneNumber('+254712345678'),
      codeHash: await hashClaimCode('424242'),
      initiatedBy: 'wallet',
      pendingWalletAddress: 'WALLET_A',
      attempts: 0,
      expiresAt: Date.now() + 60_000,
      consumedAt: null,
    };
  }

  it('rejects expired claims', async () => {
    const pending = await basePending();
    pending.expiresAt = Date.now() - 1;
    const r = await verifyClaim({ pending, submittedCode: '424242', walletAddress: 'WALLET_A' });
    expect(r).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects already-consumed claims', async () => {
    const pending = await basePending();
    pending.consumedAt = Date.now() - 100;
    const r = await verifyClaim({ pending, submittedCode: '424242', walletAddress: 'WALLET_A' });
    expect(r).toEqual({ ok: false, reason: 'already_consumed' });
  });

  it('rejects claims with too many attempts', async () => {
    const pending = await basePending();
    pending.attempts = IDENTITY_CLAIM_CONSTANTS.MAX_VERIFY_ATTEMPTS;
    const r = await verifyClaim({ pending, submittedCode: '424242', walletAddress: 'WALLET_A' });
    expect(r).toEqual({ ok: false, reason: 'too_many_attempts' });
  });

  it('rejects wallet mismatch on wallet-initiated claims', async () => {
    const pending = await basePending();
    const r = await verifyClaim({ pending, submittedCode: '424242', walletAddress: 'WALLET_B' });
    expect(r).toEqual({ ok: false, reason: 'wallet_mismatch' });
  });

  it('accepts wallet mismatch on USSD-initiated claims (wallet supplied at verify time)', async () => {
    const pending = await basePending();
    pending.initiatedBy = 'ussd';
    pending.pendingWalletAddress = null;
    const r = await verifyClaim({ pending, submittedCode: '424242', walletAddress: 'WALLET_FROM_WEB' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.walletAddress).toBe('WALLET_FROM_WEB');
  });

  it('rejects invalid code', async () => {
    const pending = await basePending();
    const r = await verifyClaim({ pending, submittedCode: '999999', walletAddress: 'WALLET_A' });
    expect(r).toEqual({ ok: false, reason: 'invalid_code' });
  });
});
