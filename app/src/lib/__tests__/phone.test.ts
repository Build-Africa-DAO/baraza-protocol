import { describe, expect, it } from 'vitest';
import { normaliseKenyanPhone, toE164Kenyan } from '@/lib/phone';

describe('normaliseKenyanPhone', () => {
  it('accepts 9-digit local form starting with 7', () => {
    expect(normaliseKenyanPhone('712345678')).toBe('712345678');
    expect(normaliseKenyanPhone('7XX XXX XXX'.replace(/X/g, '0'))).toBe('700000000');
  });

  it('accepts 10-digit form with leading 0', () => {
    expect(normaliseKenyanPhone('0712345678')).toBe('712345678');
    expect(normaliseKenyanPhone('0712 345 678')).toBe('712345678');
  });

  it('accepts 12-digit form with country code', () => {
    expect(normaliseKenyanPhone('254712345678')).toBe('712345678');
    expect(normaliseKenyanPhone('+254 712 345 678')).toBe('712345678');
    expect(normaliseKenyanPhone('+254712345678')).toBe('712345678');
  });

  it('strips spaces, dashes, and parentheses', () => {
    expect(normaliseKenyanPhone('0712-345-678')).toBe('712345678');
    expect(normaliseKenyanPhone('(0712) 345 678')).toBe('712345678');
  });

  it('returns null for non-Kenyan or malformed input', () => {
    expect(normaliseKenyanPhone('')).toBeNull();
    expect(normaliseKenyanPhone('123')).toBeNull();
    expect(normaliseKenyanPhone('12345678')).toBeNull();          // 8 digits
    expect(normaliseKenyanPhone('512345678')).toBeNull();          // 9 digits but starts with 5
    expect(normaliseKenyanPhone('06123456789')).toBeNull();        // 11 digits, not 254-prefixed
    expect(normaliseKenyanPhone('+1 555 123 4567')).toBeNull();    // US format
  });
});

describe('toE164Kenyan', () => {
  it('returns +254-prefixed number for valid inputs', () => {
    expect(toE164Kenyan('0712345678')).toBe('+254712345678');
    expect(toE164Kenyan('712345678')).toBe('+254712345678');
    expect(toE164Kenyan('+254 712 345 678')).toBe('+254712345678');
  });

  it('returns null for invalid inputs', () => {
    expect(toE164Kenyan('')).toBeNull();
    expect(toE164Kenyan('not a phone')).toBeNull();
  });
});
