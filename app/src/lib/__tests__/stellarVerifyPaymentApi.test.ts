import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/stellar/verify-payment';

const TX_HASH = 'a'.repeat(64);

function request(): Request {
  return new Request('https://baraza.example/api/stellar/verify-payment', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      communityId: 'community-test',
      txHash: TX_HASH,
      amountXlm: 1,
    }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.STELLAR_NETWORK;
  delete process.env.STELLAR_HORIZON_URL;
  delete process.env.STELLAR_TREASURY_ACCOUNT;
});

describe('Stellar payment verification API', () => {
  it('rejects mainnet verification without a configured treasury account', async () => {
    process.env.STELLAR_NETWORK = 'mainnet';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: 'stellar_verifier_not_configured',
      message: 'STELLAR_TREASURY_ACCOUNT is required for Stellar mainnet verification.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed configured treasury accounts before calling Horizon', async () => {
    process.env.STELLAR_TREASURY_ACCOUNT = 'not-a-stellar-account';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: 'stellar_verifier_not_configured',
      message: 'STELLAR_TREASURY_ACCOUNT must be a valid Stellar G-account.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows treasury-less verification on testnet for local review', async () => {
    process.env.STELLAR_NETWORK = 'testnet';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ hash: TX_HASH, ledger: 123, successful: true }))
      .mockResolvedValueOnce(Response.json({
        _embedded: {
          records: [{ type: 'payment', asset_type: 'native', amount: '1.0000000', to: 'GDESTINATION' }],
        },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'PAYMENT_CONFIRMED',
      rail: 'stellar',
      persisted: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
