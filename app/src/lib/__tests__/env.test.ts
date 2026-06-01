import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function clearEnv(key: 'VITE_STELLAR_HORIZON_URL' | 'VITE_STELLAR_NETWORK_PASSPHRASE') {
  delete import.meta.env[key];
}

describe('public env defaults', () => {
  it('derives mainnet Stellar defaults from the selected network', async () => {
    vi.stubEnv('VITE_STELLAR_NETWORK', 'mainnet');
    clearEnv('VITE_STELLAR_HORIZON_URL');
    clearEnv('VITE_STELLAR_NETWORK_PASSPHRASE');

    const { validatePublicEnv } = await import('@/lib/env');
    const env = validatePublicEnv();

    expect(env.VITE_STELLAR_HORIZON_URL).toBe('https://horizon.stellar.org');
    expect(env.VITE_STELLAR_NETWORK_PASSPHRASE).toBe('Public Global Stellar Network ; September 2015');
  });

  it('keeps Stellar runtime config aligned with validated defaults', async () => {
    vi.stubEnv('VITE_STELLAR_NETWORK', 'mainnet');
    clearEnv('VITE_STELLAR_HORIZON_URL');
    clearEnv('VITE_STELLAR_NETWORK_PASSPHRASE');

    const { getStellarConfig } = await import('@/lib/stellar');

    expect(getStellarConfig()).toMatchObject({
      network: 'mainnet',
      horizonUrl: 'https://horizon.stellar.org',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    });
  });
});
