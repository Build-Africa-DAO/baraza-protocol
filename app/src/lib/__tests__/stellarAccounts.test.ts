import { describe, expect, it } from 'vitest';
import {
  clearLinkedStellarAccount,
  getLinkedStellarAccount,
  saveLinkedStellarAccount,
} from '@/lib/stellarAccounts';

const OWNER = 'solana-wallet-1';
const STELLAR_ACCOUNT = 'GBEQEOORBLDGA36MBIYBS2XI7YLT23BDJRBDNWP5RGDB6BFFRHWEBAHD';

describe('linked Stellar accounts', () => {
  it('returns null when no account is linked', () => {
    expect(getLinkedStellarAccount(OWNER)).toBeNull();
  });

  it('saves a valid Stellar account per owner wallet', () => {
    saveLinkedStellarAccount(OWNER, STELLAR_ACCOUNT);
    expect(getLinkedStellarAccount(OWNER)).toBe(STELLAR_ACCOUNT);
    expect(getLinkedStellarAccount('another-wallet')).toBeNull();
  });

  it('trims whitespace before saving', () => {
    saveLinkedStellarAccount(OWNER, `  ${STELLAR_ACCOUNT}  `);
    expect(getLinkedStellarAccount(OWNER)).toBe(STELLAR_ACCOUNT);
  });

  it('rejects invalid Stellar accounts', () => {
    expect(() => saveLinkedStellarAccount(OWNER, 'not-stellar')).toThrow(/valid stellar/i);
  });

  it('clears a linked account', () => {
    saveLinkedStellarAccount(OWNER, STELLAR_ACCOUNT);
    clearLinkedStellarAccount(OWNER);
    expect(getLinkedStellarAccount(OWNER)).toBeNull();
  });
});
