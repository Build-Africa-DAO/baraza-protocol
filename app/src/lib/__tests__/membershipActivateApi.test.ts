import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/membership/activate';

const ACTIVATION_SECRET = 'activation-secret';
const BODY = {
  orderId: 'ord_brza_test',
  communityId: 'community-test',
  walletAddress: 'GBEQEOORBLDGA36MBIYBS2XI7YLT23BDJRBDNWP5RGDB6BFFRHWEBAHD',
  activationSecret: ACTIVATION_SECRET,
};
const OTHER_WALLET = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

function request(body = BODY): Request {
  return new Request('https://baraza.example/api/membership/activate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function hashActivationSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function paymentOrder(walletAddress: string | null, providerEnvironment = 'sandbox') {
  return {
    status: 'RECONCILED',
    community_id: BODY.communityId,
    provider_environment: providerEnvironment,
    activation_secret_hash: await hashActivationSecret(ACTIVATION_SECRET),
    wallet_address: walletAddress,
  };
}

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://supabase.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.VERCEL_ENV;
});

describe('membership activation API', () => {
  it('binds an unclaimed payment order before creating a membership', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([await paymentOrder(null)]))
      .mockResolvedValueOnce(Response.json([{ wallet_address: BODY.walletAddress }]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{}], { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, status: 'ACTIVE', created: true });
    expect(fetchMock.mock.calls[1][0]).toContain('wallet_address=is.null');
  });

  it('rejects sandbox payment orders when activating in production', async () => {
    process.env.VERCEL_ENV = 'production';
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json([await paymentOrder(null)]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Sandbox payment orders cannot activate production memberships.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a different-wallet replay when another activation wins the bind race', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([await paymentOrder(null)]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([await paymentOrder(OTHER_WALLET)]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Order is already bound to a different wallet.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('allows an idempotent same-wallet retry when another activation wins the bind race', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([await paymentOrder(null)]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([await paymentOrder(BODY.walletAddress)]))
      .mockResolvedValueOnce(Response.json([{ member_id: 'mem_existing', status: 'ACTIVE' }]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      memberId: 'mem_existing',
      status: 'ACTIVE',
      created: false,
    });
  });
});
