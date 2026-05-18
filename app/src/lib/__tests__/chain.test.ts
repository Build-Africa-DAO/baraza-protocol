import { describe, expect, it } from 'vitest';
import { CHAINS, CHAIN_LIST, readStoredChain, writeStoredChain } from '@/lib/chain';

describe('CHAINS metadata', () => {
  it('exposes both solana and stellar entries', () => {
    expect(CHAINS.solana).toBeDefined();
    expect(CHAINS.stellar).toBeDefined();
  });

  it('marks solana as enabled and stellar as Phase 2', () => {
    expect(CHAINS.solana.enabled).toBe(true);
    expect(CHAINS.stellar.enabled).toBe(false);
    expect(CHAINS.stellar.comingSoon).toBe('Phase 2');
  });

  it('uses brand-correct badge colors', () => {
    // Solana green per https://solana.com/branding
    expect(CHAINS.solana.badgeBg.toUpperCase()).toBe('#14F195');
    // Stellar blue per Baraza palette tokens
    expect(CHAINS.stellar.badgeBg.toUpperCase()).toBe('#0066FF');
  });

  it('CHAIN_LIST renders solana before stellar', () => {
    expect(CHAIN_LIST[0].id).toBe('solana');
    expect(CHAIN_LIST[1].id).toBe('stellar');
  });
});

describe('readStoredChain', () => {
  it('returns solana as default when localStorage is empty', () => {
    expect(readStoredChain()).toBe('solana');
  });

  it('returns stored solana when set', () => {
    writeStoredChain('solana');
    expect(readStoredChain()).toBe('solana');
  });

  it('returns stored stellar when set', () => {
    writeStoredChain('stellar');
    expect(readStoredChain()).toBe('stellar');
  });

  it('falls back to solana when localStorage holds a garbage value', () => {
    window.localStorage.setItem('baraza:chain', 'ethereum');
    expect(readStoredChain()).toBe('solana');
  });

  it('falls back to solana when localStorage holds an empty string', () => {
    window.localStorage.setItem('baraza:chain', '');
    expect(readStoredChain()).toBe('solana');
  });
});

describe('writeStoredChain', () => {
  it('persists the chain under the baraza:chain key', () => {
    writeStoredChain('stellar');
    expect(window.localStorage.getItem('baraza:chain')).toBe('stellar');
  });

  it('overwrites a previous value', () => {
    writeStoredChain('solana');
    writeStoredChain('stellar');
    expect(readStoredChain()).toBe('stellar');
  });
});
