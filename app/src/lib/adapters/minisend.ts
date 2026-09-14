/**
 * Minisend Client Domain Adapter — Multi-Chain Stablecoin to Mobile Money Off-Ramp
 *
 * Conforms to SAD §5, Launch Memo 3 §3, and Minisend Architecture Spec v3.1 (§8.3).
 * Invokes the secure Edge API proxy (/api/payments/minisend) with cryptographic wallet proof.
 */

import { apiFetch, errorField } from '@/lib/api';

export interface MinisendOffRampParams {
  communityId?: string;
  proposalId?: string;
  callerWallet?: string;
  phone: string;
  usdcAmount: string;
  chain: 'stellar' | 'base' | 'polygon' | 'celo';
  currency?: 'KES' | 'UGX' | 'GHS' | 'NGN';
  memo?: string;
  headers?: Record<string, string>;
}

export interface MinisendOffRampResult {
  ok: boolean;
  orderId?: string;
  reference: string;
  kesAmount: number;
  error?: string;
  circuitBreaker?: boolean;
  /** Present on a 422 when the amount exceeds the telco per-transaction ceiling. */
  recommendedTranches?: number;
  maxAllowedMinor?: number;
  status?: number;
}

/**
 * Initiates an off-ramp disbursement converting on-chain USDC to recipient mobile money.
 */
export async function usdcToMobileMoney(params: MinisendOffRampParams): Promise<MinisendOffRampResult> {
  try {
    const proxySecret = typeof window === 'undefined' ? process.env.PAYMENT_ADAPTER_PROXY_SECRET : undefined;
    const { headers: extraHeaders, ...body } = params;
    const headers: Record<string, string> = { ...extraHeaders };
    if (proxySecret) headers.authorization = `Bearer ${proxySecret}`;

    const result = await apiFetch<{ orderId?: string; reference?: string; kesAmount?: number }>('/api/payments/minisend', {
      method: 'POST',
      headers,
      body: { ...body, currency: body.currency?.toUpperCase() as MinisendOffRampParams['currency'] },
    });

    if (!result.ok) {
      return {
        ok: false,
        reference: '',
        kesAmount: 0,
        status: result.status,
        error: result.error.message,
        circuitBreaker: Boolean(errorField<boolean>(result.error, 'circuitBreaker')),
        recommendedTranches: errorField<number>(result.error, 'recommendedTranches'),
        maxAllowedMinor: errorField<number>(result.error, 'maxAllowedMinor'),
      };
    }

    return {
      ok: true,
      orderId: result.data?.orderId,
      reference: result.data?.reference || '',
      kesAmount: Number(result.data?.kesAmount || 0),
    };
  } catch (err) {
    return {
      ok: false,
      reference: '',
      kesAmount: 0,
      error: err instanceof Error ? err.message : 'Network error during Minisend off-ramp.',
    };
  }
}

/**
 * Backward-compatible alias for legacy caller components.
 */
export async function usdcToMpesa(params: {
  phone: string;
  usdcAmount: string;
  chain: 'base' | 'polygon' | 'celo' | 'stellar';
}): Promise<{ reference: string; kesAmount: number; error?: string }> {
  const res = await usdcToMobileMoney({
    phone: params.phone,
    usdcAmount: params.usdcAmount,
    chain: params.chain,
    currency: 'KES',
  });

  return {
    reference: res.reference,
    kesAmount: res.kesAmount,
    error: res.error,
  };
}
