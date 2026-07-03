import { describe, expect, it } from 'vitest';
import { getPaymentFeeQuote } from '@/lib/paymentFees';

describe('payment fee quotes', () => {
  it('adds a 10% endowment fee to the Baraza charge', () => {
    expect(getPaymentFeeQuote(6500, 'mobile-money')).toMatchObject({
      endowmentFeeKes: 650,
      barazaTotalKes: 7150,
    });
  });

  it('applies the endowment fee to setup add-ons', () => {
    expect(getPaymentFeeQuote(11500, 'privy')).toMatchObject({
      endowmentFeeKes: 1150,
      barazaTotalKes: 12650,
      providerFeeLabel: 'KSh 0',
    });
  });

  it('keeps variable provider fees outside the Baraza total', () => {
    expect(getPaymentFeeQuote(6500, 'mobile-money').providerFeeLabel).toBe('Confirmed by carrier');
    expect(getPaymentFeeQuote(6500, 'bank-transfer').providerFeeLabel).toBe('Quoted by bank');
  });
});
