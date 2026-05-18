import { describe, expect, it } from 'vitest';
import { CHAINS, CHAIN_LIST, readStoredChain, writeStoredChain } from '@/lib/chain';

describe('CHAINS metadata', () => {
  it('exposes solana, stellar, base, ethereum entries', () => {
    expect(CHAINS.solana).toBeDefined();
    expect(CHAINS.stellar).toBeDefined();
    expect(CHAINS.base).toBeDefined();
    expect(CHAINS.ethereum).toBeDefined();
  });

  it('marks only Solana as enabled; others are placeholders', () => {
    expect(CHAINS.solana.enabled).toBe(true);
    expect(CHAINS.stellar.enabled).toBe(false);
    expect(CHAINS.base.enabled).toBe(false);
    expect(CHAINS.ethereum.enabled).toBe(false);
  });

  it('uses correct comingSoon labels', () => {
    expect(CHAINS.stellar.comingSoon).toBe('Phase 2');
    expect(CHAINS.base.comingSoon).toBe('Soon');
    expect(CHAINS.ethereum.comingSoon).toBe('Soon');
  });

  it('uses brand-correct badge colors', () => {
    expect(CHAINS.solana.badgeBg.toUpperCase()).toBe('#14F195');
    expect(CHAINS.stellar.badgeBg.toUpperCase()).toBe('#0066FF');
    expect(CHAINS.base.badgeBg.toUpperCase()).toBe('#0052FF');
    expect(CHAINS.ethereum.badgeBg.toUpperCase()).toBe('#627EEA');
  });

  it('CHAIN_LIST orders Solana first, then Stellar, Base, Ethereum', () => {
    expect(CHAIN_LIST.map((c) => c.id)).toEqual(['solana', 'stellar', 'base', 'ethereum']);
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
