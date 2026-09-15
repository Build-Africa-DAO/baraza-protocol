import { describe, expect, it } from 'vitest';
import { digitsOnly, formatPrivyAuthError, isCompletePrivyOtp } from '@/lib/privyAuth';

describe('digitsOnly', () => {
  it('keeps leading zeros and caps at six digits', () => {
    expect(digitsOnly('073394')).toBe('073394');
    expect(digitsOnly('73-394')).toBe('73394');
    expect(digitsOnly('1234567')).toBe('123456');
  });
});

describe('isCompletePrivyOtp', () => {
  it('accepts only a full 6-digit Privy code', () => {
    expect(isCompletePrivyOtp('73394')).toBe(false);
    expect(isCompletePrivyOtp('073394')).toBe(true);
  });
});

describe('formatPrivyAuthError', () => {
  it('explains the 6-digit Privy requirement in plain language', () => {
    expect(formatPrivyAuthError({
      message: '[Input error] `code`: Verification code must have 6 digits.',
    })).toBe('Enter all 6 digits, including a 0 at the start if there is one.');
  });
});
