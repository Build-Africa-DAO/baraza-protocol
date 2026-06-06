import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/payment-orders/status';

const ACTIVATION_SECRET = 'activation-secret';

async function hashActivationSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function request(url = 'https://baraza.example/api/payment-orders/status?orderId=ord_test', secret?: string): Request {
  return new Request(url, {
    headers: secret ? { 'x-activation-secret': secret } : undefined,
  });
}

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://supabase.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('payment order status API', () => {
  it('rejects activation secrets supplied in the query string', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request(`https://baraza.example/api/payment-orders/status?orderId=ord_test&activationSecret=${ACTIVATION_SECRET}`));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a safe order when the activation-secret header matches', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json([{
      order_id: 'ord_test',
      community_id: 'community-test',
      membership_tier_id: null,
      status: 'PAYMENT_PENDING',
      amount_expected: 1000,
      amount_received: null,
      currency: 'KES',
      confirmed_at: null,
      created_at: '2026-05-31T00:00:00.000Z',
      updated_at: '2026-05-31T00:00:00.000Z',
      activation_secret_hash: await hashActivationSecret(ACTIVATION_SECRET),
    }]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(request(undefined, ACTIVATION_SECRET));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ order_id: 'ord_test', status: 'PAYMENT_PENDING' });
    expect(body).not.toHaveProperty('activation_secret_hash');
  });
});
