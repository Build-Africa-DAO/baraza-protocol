import { describe, expect, it } from 'vitest';
import {
  createCommunityTreasury,
  getBrzaAsset,
  massPay,
  minimumTreasuryStartingBalance,
  stellarAdapter,
} from '@/lib/adapters/stellar';

const VALID_PUBLIC_KEY = 'GBEQEOORBLDGA36MBIYBS2XI7YLT23BDJRBDNWP5RGDB6BFFRHWEBAHD';

describe('Stellar BRZA adapter guards', () => {
  it('fails closed when the BRZA issuer is not configured', () => {
    expect(() => getBrzaAsset()).toThrow(/issuer address/i);
  });

  it('calculates a treasury starting balance with signer reserve buffer', () => {
    expect(minimumTreasuryStartingBalance(1)).toBe('5');
    expect(minimumTreasuryStartingBalance(4)).toBe('7');
    expect(() => minimumTreasuryStartingBalance(0)).toThrow(/at least one admin/i);
  });

  it('rejects invalid treasury thresholds before network access', async () => {
    await expect(createCommunityTreasury({
      adminPublicKeys: [VALID_PUBLIC_KEY],
      threshold: 2,
      fundingSecret: '',
    })).resolves.toMatchObject({
      address: '',
      error: expect.stringMatching(/threshold/i),
    });
  });

  it('rejects empty mass-payment batches before network access', async () => {
    await expect(massPay({ fromSecret: '', recipients: [] })).resolves.toMatchObject({
      count: 0,
      error: expect.stringMatching(/at least one BRZA recipient/i),
    });
  });

  it('keeps browser treasury payments disabled', async () => {
    await expect(stellarAdapter.treasury?.pay({
      communityId: 'community-test',
      recipient: VALID_PUBLIC_KEY,
      amount: '1',
      currency: 'BRZA',
    })).resolves.toEqual({
      ok: false,
      chain: 'stellar',
      error: 'Stellar treasury payments require trusted server signing.',
    });
  });
});
