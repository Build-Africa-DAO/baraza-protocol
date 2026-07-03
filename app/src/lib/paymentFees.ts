export type PaymentRail = 'mobile-money' | 'privy' | 'bank-transfer';

export const ENDOWMENT_FEE_RATE = 0.1;

export interface PaymentFeeQuote {
  endowmentFeeKes: number;
  barazaTotalKes: number;
  providerFeeLabel: string;
  providerFeeDescription: string;
}

export function getPaymentFeeQuote(subtotalKes: number, rail: PaymentRail): PaymentFeeQuote {
  const safeSubtotal = Math.max(0, Math.round(subtotalKes));
  const endowmentFeeKes = Math.round(safeSubtotal * ENDOWMENT_FEE_RATE);

  const providerFee = rail === 'mobile-money'
    ? {
        providerFeeLabel: 'Confirmed by carrier',
        providerFeeDescription: 'Your mobile network shows its transaction fee before you approve the payment.',
      }
    : rail === 'bank-transfer'
      ? {
          providerFeeLabel: 'Quoted by bank',
          providerFeeDescription: 'Your sending or intermediary bank may charge a separate transfer fee.',
        }
      : {
          providerFeeLabel: 'KSh 0',
          providerFeeDescription: 'Baraza does not add a carrier fee to account payments.',
        };

  return {
    endowmentFeeKes,
    barazaTotalKes: safeSubtotal + endowmentFeeKes,
    ...providerFee,
  };
}
