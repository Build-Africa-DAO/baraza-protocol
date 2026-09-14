import { describe, expect, it } from 'vitest';
import { formatMajor, formatMoney, groupCurrency } from '@/lib/money';

describe('formatMajor', () => {
  it('puts the currency code first and groups thousands', () => {
    expect(formatMajor(1200, 'KES')).toBe('KES 1,200');
    expect(formatMajor(234500)).toBe('KES 234,500');
  });
  it('shows two decimals only when the amount has a fraction', () => {
    expect(formatMajor(3.85, 'KES')).toBe('KES 3.85');
    expect(formatMajor(500, 'UGX')).toBe('UGX 500');
  });
  it('keeps the sign in front of the code', () => {
    expect(formatMajor(-40, 'KES')).toBe('-KES 40');
  });
  it('falls back to KES for missing or malformed codes', () => {
    expect(formatMajor(10, null)).toBe('KES 10');
    expect(formatMajor(10, 'shillings')).toBe('KES 10');
  });
  it('does not convert: a KES amount is the same for every viewer', () => {
    window.localStorage.setItem('baraza.accountCountry.v1', 'US');
    expect(formatMajor(500, 'KES')).toBe('KES 500');
  });
});

describe('formatMoney', () => {
  it('formats minor units', () => {
    expect(formatMoney(120050, 'KES')).toBe('KES 1,200.50');
    expect(formatMoney(50000)).toBe('KES 500');
  });
});

describe('groupCurrency', () => {
  it('reads the community currency and defaults to KES', () => {
    expect(groupCurrency({ currency: 'tzs' })).toBe('TZS');
    expect(groupCurrency({})).toBe('KES');
    expect(groupCurrency(null)).toBe('KES');
  });
});
