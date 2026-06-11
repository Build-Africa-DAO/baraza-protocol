import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BRZA_ASSET,
  convertToBrza,
  formatLocal,
  getBrzaPriceUsd,
  vestedAmount,
} from '@/lib/brza/constants';
import {
  fetchTreasuryBalance,
  fetchTreasuryByCommunityId,
  registerTreasury,
} from '@/lib/brza/treasury';
import { fetchPlatformTvl, getNextTarget, getPhase } from '@/lib/brza/tvl';
import { getBrzaBalance } from '@/lib/adapters/stellar';

vi.mock('@/lib/adapters/stellar', () => ({
  getBrzaBalance: vi.fn(),
}));

const mockGetBrzaBalance = vi.mocked(getBrzaBalance);

beforeEach(() => {
  mockGetBrzaBalance.mockReset();
});

describe('BRZA pricing', () => {
  it('publishes cache-safe token metadata URLs', () => {
    expect(BRZA_ASSET.logoUrl).toBe('https://baraza-protocol.vercel.app/brza-token-logo.svg');
    expect(BRZA_ASSET.metadataUrl).toBe('https://baraza-protocol.vercel.app/brza-token.json');
  });

  it('converts supported fiat currencies at the configured phase price', () => {
    expect(convertToBrza(1000, 'KES')).toEqual({ brzaAmount: 385, usdValue: 7.7 });
    expect(convertToBrza(10, 'USD', 'launch')).toEqual({ brzaAmount: 100, usdValue: 10 });
  });

  it('rejects unsupported currencies instead of treating them as USD', () => {
    expect(() => convertToBrza(1000, 'KSH')).toThrow(/unsupported fiat currency/i);
    expect(() => formatLocal(10, 'KSH')).toThrow(/unsupported fiat currency/i);
  });

  it('rejects market valuation until a market price source is configured', () => {
    expect(() => getBrzaPriceUsd('market')).toThrow(/market price is not configured/i);
    expect(() => convertToBrza(1000, 'KES', 'market')).toThrow(/market price is not configured/i);
  });
});

describe('BRZA vesting', () => {
  it('honors cliffs and caps the vested amount', () => {
    // founderA: 365-day cliff + 1095-day vest = full vesting at day 1460
    expect(vestedAmount('founderA', 364)).toBe(0);   // just before cliff
    expect(vestedAmount('founderA', 365)).toBe(0);   // cliff day — 0 days elapsed in vest period
    expect(vestedAmount('founderA', 1460)).toBe(75_000_000);  // cliff (365) + vestingDays (1095) = full
  });

  it('rejects negative elapsed time', () => {
    expect(() => vestedAmount('operations', -1)).toThrow(/non-negative/i);
  });
});

describe('BRZA treasury reads', () => {
  it('formats a valid Stellar balance using phase pricing', async () => {
    mockGetBrzaBalance.mockResolvedValue({ balance: '1000', formatted: '1,000 BRZA' });
    await expect(fetchTreasuryBalance('GACCOUNT', 'KES')).resolves.toEqual({
      brza: '1,000 BRZA',
      local: 'KES 2,597',
      raw: 1000,
    });
  });

  it('rejects malformed Stellar balances', async () => {
    mockGetBrzaBalance.mockResolvedValue({ balance: 'nope', formatted: 'NaN BRZA' });
    await expect(fetchTreasuryBalance('GACCOUNT')).resolves.toMatchObject({
      raw: 0,
      error: expect.stringMatching(/invalid BRZA balance/i),
    });
  });

  it('reads a registered community treasury', async () => {
    mockGetBrzaBalance.mockResolvedValue({ balance: '5', formatted: '5 BRZA' });
    registerTreasury({ communityId: 'community-test', stellarAddress: 'GACCOUNT', localCurrency: 'USD' });
    await expect(fetchTreasuryByCommunityId('community-test')).resolves.toMatchObject({
      brza: '5 BRZA',
      local: 'USD 0',
      raw: 5,
    });
  });
});

describe('BRZA TVL', () => {
  it('tracks milestones and clamps progress below zero', () => {
    expect(getPhase(49_999)).toBe('building');
    expect(getPhase(50_000)).toBe('stellar_pool_ready');
    expect(getPhase(500_000)).toBe('ido_ready');
    expect(getNextTarget(-1).pct).toBe(0);
  });

  it('ignores malformed balances when aggregating TVL', async () => {
    mockGetBrzaBalance
      .mockResolvedValueOnce({ balance: '100', formatted: '100 BRZA' })
      .mockResolvedValueOnce({ balance: 'nope', formatted: 'NaN BRZA' });
    await expect(fetchPlatformTvl(['GONE', 'GTWO'], 2, 3)).resolves.toMatchObject({
      totalBrza: 100,
      totalUsd: 2,
      communityCount: 2,
      memberCount: 3,
    });
  });
});
