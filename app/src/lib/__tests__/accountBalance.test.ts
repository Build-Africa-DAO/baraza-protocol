import { describe, expect, it, vi } from 'vitest';
import { fetchAccountBalanceEstimate } from '@/lib/accountBalance';

vi.mock('@/lib/adapters', () => ({
  getChainAdapter: () => ({ balance: { getNative: vi.fn().mockResolvedValue(0) } }),
}));

describe('account balance estimate', () => {
  it('formats an empty wallet without requesting a price quote', async () => {
    const result = await fetchAccountBalanceEstimate('wallet-address', {
      code: 'KE',
      name: 'Kenya',
      currency: 'KES',
      locale: 'en-KE',
      timeZone: 'Africa/Nairobi',
      usdPerUnit: 0.0077,
    });

    expect(result).toEqual({ formatted: 'KSh 0', nativeAmount: 0 });
  });
});
