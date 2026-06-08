import { swapExactSend } from '@/lib/adapters/stellar';
import * as kotaniAdapter from '@/lib/adapters/kotani';
import { convertToBrza, BRZA_FEES } from './constants';

export type OnRampCurrency = 'KES' | 'UGX' | 'NGN' | 'GHS' | 'ZAR' | 'USDC' | 'USDT' | 'XLM';

export interface OnRampQuote {
  inputAmount: number;
  inputCurrency: OnRampCurrency;
  brzaReceived: number;
  usdValue: number;
  rate: number;
  fee: number;
  netBrza: number;
  route: string;
  error?: string;
}

const ROUTES: Record<OnRampCurrency, string> = {
  KES:  'M-Pesa → XLM → BRZA',
  UGX:  'MTN MoMo → XLM → BRZA',
  NGN:  'OPay → XLM → BRZA',
  GHS:  'MTN MoMo → XLM → BRZA',
  ZAR:  'Bank → USDC → BRZA',
  USDC: 'USDC → BRZA',
  USDT: 'USDT → BRZA',
  XLM:  'XLM → BRZA',
};

export async function getOnRampQuote(
  amount: number,
  currency: OnRampCurrency,
): Promise<OnRampQuote> {
  const { brzaAmount, usdValue } = convertToBrza(amount, currency);
  const fee = brzaAmount * BRZA_FEES.treasuryTxPct;
  const netBrza = brzaAmount - fee;

  return {
    inputAmount: amount,
    inputCurrency: currency,
    brzaReceived: brzaAmount,
    usdValue,
    rate: brzaAmount / amount,
    fee,
    netBrza,
    route: ROUTES[currency],
  };
}

export async function executeOnRamp(params: {
  accountSecret: string;
  amount: number;
  currency: OnRampCurrency;
  communityTreasuryAddress: string;
  communityCode: string;
  phone?: string;
}): Promise<{
  success: boolean;
  brzaDelivered: number;
  txHash?: string;
  reference?: string;
  error?: string;
}> {
  const quote = await getOnRampQuote(params.amount, params.currency);

  if (['USDC', 'USDT', 'XLM'].includes(params.currency)) {
    const result = await swapExactSend({
      fromSecret: params.accountSecret,
      sendAsset: params.currency as 'USDC' | 'USDT' | 'XLM',
      sendAmount: params.amount.toFixed(7),
      receiveAsset: 'BRZA',
      minReceive: (quote.netBrza * 0.99).toFixed(7),
      destinationAddress: params.communityTreasuryAddress,
    });

    if (result.error) return { success: false, brzaDelivered: 0, error: result.error };
    return { success: true, brzaDelivered: quote.netBrza, txHash: result.txHash };
  }

  if (!params.phone) {
    return { success: false, brzaDelivered: 0, error: 'Phone number required for M-Pesa payment' };
  }

  const kotaniResult = await kotaniAdapter.mpesaToBrza({
    phone: params.phone,
    kesAmount: params.amount,
    destinationAddress: params.communityTreasuryAddress,
    communityCode: params.communityCode,
  });

  if (kotaniResult.status === 'failed') {
    return { success: false, brzaDelivered: 0, error: kotaniResult.error };
  }

  return { success: true, brzaDelivered: quote.netBrza, reference: kotaniResult.reference };
}
