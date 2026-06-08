import { swapExactSend } from '@/lib/adapters/stellar';
import { BRZA_FEES, getBrzaPriceUsd, FIAT_RATES } from './constants';

export type OffRampDestination = 'mpesa' | 'usdc_wallet' | 'usdt_wallet' | 'xlm_wallet';

export interface OffRampQuote {
  brzaInput: number;
  outputAmount: number;
  outputCurrency: string;
  fee: number;
  netBrza: number;
  usdValue: number;
  route: string;
  error?: string;
}

export async function getOffRampQuote(
  brzaAmount: number,
  destination: OffRampDestination,
): Promise<OffRampQuote> {
  const fee = brzaAmount * BRZA_FEES.swapPct;
  const netBrza = brzaAmount - fee;
  const usdValue = netBrza * getBrzaPriceUsd();

  const routes: Record<OffRampDestination, { currency: string; route: string; estimate: number }> = {
    mpesa:       { currency: 'KES',  route: 'BRZA → USDC → M-Pesa', estimate: usdValue / FIAT_RATES.KES },
    usdc_wallet: { currency: 'USDC', route: 'BRZA → USDC',          estimate: usdValue },
    usdt_wallet: { currency: 'USDT', route: 'BRZA → USDT',          estimate: usdValue },
    xlm_wallet:  { currency: 'XLM',  route: 'BRZA → XLM',           estimate: usdValue / FIAT_RATES.XLM },
  };

  const r = routes[destination];
  return {
    brzaInput: brzaAmount,
    outputAmount: r.estimate,
    outputCurrency: r.currency,
    fee,
    netBrza,
    usdValue,
    route: r.route,
  };
}

export async function executeOffRamp(params: {
  accountSecret: string;
  brzaAmount: number;
  destination: OffRampDestination;
  phone?: string;
  destinationWallet?: string;
}): Promise<{
  success: boolean;
  outputAmount: number;
  txHash?: string;
  reference?: string;
  error?: string;
}> {
  const quote = await getOffRampQuote(params.brzaAmount, params.destination);

  if (params.destination === 'usdc_wallet' || params.destination === 'mpesa') {
    const swapResult = await swapExactSend({
      fromSecret: params.accountSecret,
      sendAsset: 'BRZA',
      sendAmount: quote.netBrza.toFixed(7),
      receiveAsset: 'USDC',
      minReceive: (quote.outputAmount * 0.99).toFixed(7),
      destinationAddress: params.destinationWallet,
    });

    if (swapResult.error) return { success: false, outputAmount: 0, error: swapResult.error };

    if (params.destination === 'mpesa' && params.phone) {
      const { usdcToMpesa } = await import('@/lib/adapters/minisend');
      const mpesaResult = await usdcToMpesa({
        phone: params.phone,
        usdcAmount: quote.outputAmount.toFixed(7),
        chain: 'stellar',
      });

      if (mpesaResult.error) return { success: false, outputAmount: 0, error: mpesaResult.error };
      return { success: true, outputAmount: mpesaResult.kesAmount, reference: mpesaResult.reference };
    }

    return { success: true, outputAmount: quote.outputAmount, txHash: swapResult.txHash };
  }

  const targetAsset = params.destination === 'xlm_wallet' ? 'XLM' : 'USDT';
  const swapResult = await swapExactSend({
    fromSecret: params.accountSecret,
    sendAsset: 'BRZA',
    sendAmount: quote.netBrza.toFixed(7),
    receiveAsset: targetAsset,
    minReceive: (quote.outputAmount * 0.99).toFixed(7),
    destinationAddress: params.destinationWallet,
  });

  if (swapResult.error) return { success: false, outputAmount: 0, error: swapResult.error };
  return { success: true, outputAmount: quote.outputAmount, txHash: swapResult.txHash };
}
