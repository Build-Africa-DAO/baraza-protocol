import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  convertKesToAccountCurrency,
  formatAccountCurrency,
  getAccountCountry,
  readAccountCountry,
  writeAccountCountry,
} from '@/lib/accountLocale';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('account locale', () => {
  it('stores and reads the account country', () => {
    writeAccountCountry('NG');

    expect(readAccountCountry()).toBe('NG');
    expect(getAccountCountry().currency).toBe('NGN');
  });

  it('converts the KES reference amount into the selected account currency', () => {
    expect(convertKesToAccountCurrency(1_000, 'KE')).toBe(1_000);
    expect(convertKesToAccountCurrency(1_000, 'US')).toBeCloseTo(7.7);
  });

  it('formats money using the selected country currency', () => {
    expect(formatAccountCurrency(1_000, 'KE')).toMatch(/KES|Ksh/i);
    expect(formatAccountCurrency(1_000, 'NG')).toMatch(/NGN|₦/);
    expect(formatAccountCurrency(1_000, 'US')).toMatch(/\$7\.70/);
  });
});
