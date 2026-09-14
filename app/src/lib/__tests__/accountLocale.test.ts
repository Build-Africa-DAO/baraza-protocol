import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAccountCountry, readAccountCountry, writeAccountCountry } from '@/lib/accountLocale';

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

  it('never converts money: the module exposes no currency conversion', async () => {
    const mod = await import('@/lib/accountLocale');
    expect('convertKesToAccountCurrency' in mod).toBe(false);
    expect('formatAccountCurrency' in mod).toBe(false);
  });
});
