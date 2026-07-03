import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/payments/reconcile-brza-membership';

const ORDER = {
  order_id: 'ord_brza_test_123',
  provider: 'kotani',
  provider_reference: 'kotani-ref',
  status: 'PAYMENT_PENDING',
  amount_expected: 1000,
  currency: 'KES',
  expires_at: '2099-01-01T00:00:00.000Z',
};

function request(orderId = ORDER.order_id, secret = 'proxy-secret'): Request {
  return new Request('https://baraza.example/api/payments/reconcile-brza-membership', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ orderId }),
  });
}

beforeEach(() => {
  process.env.PAYMENT_ADAPTER_PROXY_SECRET = 'proxy-secret';
  process.env.SUPABASE_URL = 'https://supabase.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  process.env.KOTANI_PAY_API_KEY = 'kotani-key';
  process.env.KOTANI_API_BASE = 'https://kotani.example';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PAYMENT_ADAPTER_PROXY_SECRET;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.KOTANI_PAY_API_KEY;
  delete process.env.KOTANI_API_BASE;
});

describe('BRZA membership payment reconciliation API', () => {
  it('rejects untrusted calls before reading the ledger', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request(ORDER.order_id, 'wrong-secret'));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps an incomplete provider payment pending', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([ORDER]))
      .mockResolvedValueOnce(Response.json({ status: 'pending' }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    await expect(response.json()).resolves.toEqual({
      orderId: ORDER.order_id,
      status: 'PAYMENT_PENDING',
      changed: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('confirms an exact completed KES payment', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([ORDER]))
      .mockResolvedValueOnce(Response.json({ status: 'completed', kes_amount: 1000 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    await expect(response.json()).resolves.toMatchObject({ status: 'PAYMENT_CONFIRMED', changed: true });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toMatchObject({
      status: 'PAYMENT_CONFIRMED',
      amount_received: 1000,
    });
  });

  it('flags completed payments with the wrong amount', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([ORDER]))
      .mockResolvedValueOnce(Response.json({ status: 'completed', kes_amount: 900 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request());

    await expect(response.json()).resolves.toEqual({
      orderId: ORDER.order_id,
      status: 'AMOUNT_MISMATCH',
      changed: true,
    });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual({
      status: 'AMOUNT_MISMATCH',
      amount_received: 900,
    });
  });
});
