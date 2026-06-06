import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchPaymentOrder,
  getPaymentOrderActivationSecret,
  storePaymentOrderActivationSecret,
} from '@/lib/payments';

afterEach(() => {
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('payment order activation credentials', () => {
  it('stores activation secrets in tab-scoped session storage', () => {
    storePaymentOrderActivationSecret('ord_test', 'activation-secret');

    expect(getPaymentOrderActivationSecret('ord_test')).toBe('activation-secret');
    expect(window.localStorage.getItem('baraza:payment-order-secret:ord_test')).toBeNull();
  });

  it('polls with an activation-secret header and keeps the secret out of the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ order_id: 'ord_test', status: 'PAYMENT_PENDING' }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchPaymentOrder('ord_test', 'activation-secret');

    expect(fetchMock).toHaveBeenCalledWith('/api/payment-orders/status?orderId=ord_test', {
      headers: { 'x-activation-secret': 'activation-secret' },
    });
    expect(fetchMock.mock.calls[0][0]).not.toContain('activation-secret');
  });
});
