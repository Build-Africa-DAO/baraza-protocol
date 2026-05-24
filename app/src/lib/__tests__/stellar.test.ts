import { describe, expect, it, vi } from 'vitest';
import {
  confirmStellarTransaction,
  isValidStellarPublicKey,
  isValidStellarSecret,
  memoFromText,
  normaliseStellarAmount,
} from '@/lib/stellar';

const VALID_PUBLIC_KEY = 'GBEQEOORBLDGA36MBIYBS2XI7YLT23BDJRBDNWP5RGDB6BFFRHWEBAHD';
const VALID_SECRET = 'SBPUWJXEVOMKI6M3QZF5FBNBHZM3NYFPA44PQHRPBRRU6KMUM2TV4OY6';

describe('Stellar address validation', () => {
  it('accepts a valid public key', () => {
    expect(isValidStellarPublicKey(VALID_PUBLIC_KEY)).toBe(true);
  });

  it('rejects invalid public keys', () => {
    expect(isValidStellarPublicKey('not-a-stellar-account')).toBe(false);
  });

  it('accepts a valid secret seed', () => {
    expect(isValidStellarSecret(VALID_SECRET)).toBe(true);
  });

  it('rejects invalid secret seeds', () => {
    expect(isValidStellarSecret(VALID_PUBLIC_KEY)).toBe(false);
  });
});

describe('normaliseStellarAmount', () => {
  it('formats positive values with Stellar precision', () => {
    expect(normaliseStellarAmount('1')).toBe('1');
    expect(normaliseStellarAmount(1.23456789)).toBe('1.2345679');
    expect(normaliseStellarAmount('0.5000000')).toBe('0.5');
  });

  it('rejects zero, negative, and non-numeric values', () => {
    expect(() => normaliseStellarAmount(0)).toThrow(/greater than zero/i);
    expect(() => normaliseStellarAmount(-1)).toThrow(/greater than zero/i);
    expect(() => normaliseStellarAmount('nope')).toThrow(/greater than zero/i);
  });
});

describe('memoFromText', () => {
  it('returns undefined for empty memo text', () => {
    expect(memoFromText(undefined)).toBeUndefined();
    expect(memoFromText('   ')).toBeUndefined();
  });

  it('rejects memos above the Stellar text limit', () => {
    expect(() => memoFromText('x'.repeat(29))).toThrow(/28 bytes/i);
  });
});

describe('confirmStellarTransaction', () => {
  it('rejects malformed transaction hashes before network access', async () => {
    await expect(confirmStellarTransaction('bad-hash')).rejects.toThrow(/transaction hash/i);
  });

  it('returns a normalized confirmation result', async () => {
    const call = vi.fn().mockResolvedValue({
      hash: 'a'.repeat(64),
      ledger: 123,
      successful: true,
    });
    const server = {
      transactions: () => ({
        transaction: (hash: string) => {
          expect(hash).toBe('a'.repeat(64));
          return { call };
        },
      }),
    };

    await expect(confirmStellarTransaction('a'.repeat(64), undefined, server)).resolves.toEqual({
      hash: 'a'.repeat(64),
      ledger: 123,
      successful: true,
    });
  });
});
