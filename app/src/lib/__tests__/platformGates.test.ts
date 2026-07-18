import { describe, expect, it } from 'vitest';
import { getPublicRpc } from '@/lib/programs/evmClient';
import { resolveAkiliCapability } from '@/lib/akiliCapabilities';
import {
  MAINNET_CHAINS,
  PURCHASABLE_VOTES,
  isMainnetChainAllowed,
} from '@/lib/platformGates';

describe('platform gates', () => {
  it('allows only Stellar mainnet', () => {
    expect(MAINNET_CHAINS).toEqual(['stellar']);
    expect(isMainnetChainAllowed('stellar')).toBe(true);
    expect(isMainnetChainAllowed('solana')).toBe(false);
    expect(isMainnetChainAllowed('base')).toBe(false);
    expect(isMainnetChainAllowed('celo')).toBe(false);
  });

  it('keeps purchasable votes as a disabled compliance-gated schema stub', () => {
    expect(PURCHASABLE_VOTES).toEqual({
      enabled: false,
      priceKes: null,
      complianceApprovalRequired: true,
    });

    const reply = resolveAkiliCapability('Can I buy votes?', {
      communities: [],
      decisions: [],
      bounties: [],
    });
    expect(reply.text).toContain('not available');
  });

  it('rejects EVM mainnet RPC selection while allowing testnets', () => {
    expect(() => getPublicRpc(8453)).toThrow('EVM mainnet access is disabled');
    expect(getPublicRpc(84532)).toBe('https://sepolia.base.org');
    expect(() => getPublicRpc(123456)).toThrow('Unsupported EVM chain ID');
  });
});

describe('runtime network selection', () => {
  it('keeps Solana on devnet when the product is in live mode', async () => {
    window.localStorage.setItem('baraza:environment', 'live');
    const network = await import('@/lib/network');

    expect(network.SOLANA_NETWORK).toBe('devnet');
    expect(network.RPC_ENDPOINT).toBe('https://api.devnet.solana.com');
    expect(network.STELLAR_NETWORK).toBe('mainnet');
  });
});
