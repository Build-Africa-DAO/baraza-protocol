import { usdcToMobileMoney } from '@/lib/adapters/minisend';
import { TELCO_MAX_SINGLE_TX_MINOR } from '@/lib/payments/slippage';

/**
 * Officer sends (§13.18). Officers think in the group's currency; converting
 * that into a stablecoin amount is the server's job. Until an endpoint quotes
 * a send in the group currency there is no honest number to show, so
 * `requestPayoutQuote` returns `null` and the Send sheet says so instead of
 * multiplying by a rate the client made up (audit G69).
 *
 * Backend ask (frontend-post-login-audit.md §8, Phase 3): a quote endpoint
 * that takes `{ communityId, amountMinor, currency, phone }` and returns the
 * amount the provider will debit, the rate, and an expiry — plus session-based
 * officer auth so the client stops fabricating a wallet-proof header (G71).
 */

export interface PayoutQuote {
  usdcAmount: string;
  fiatMinor: number;
  currency: string;
  rate: number;
  expiresAt: string;
}

export async function requestPayoutQuote(_input: {
  communityId: string;
  amountMinor: number;
  currency: string;
  phone: string;
}): Promise<PayoutQuote | null> {
  return null;
}

/** Single M-Pesa transaction ceiling, in major units of KES. */
export const TELCO_MAX_SINGLE_TX_MAJOR = Number(TELCO_MAX_SINGLE_TX_MINOR) / 100;

/** How many transactions a KES send needs to stay under the telco ceiling. */
export function partsNeeded(amountMinor: number, currency: string): number {
  if (currency !== 'KES' || amountMinor <= 0) return 1;
  return Math.max(1, Math.ceil(amountMinor / Number(TELCO_MAX_SINGLE_TX_MINOR)));
}

export type PayoutStep = 'queued' | 'provider' | 'received' | 'failed';

export interface PayoutResult {
  ok: boolean;
  reference?: string;
  receivedMinor?: number;
  error?: string;
  onHold?: boolean;
}

/** Send one quoted part. Never called without a quote. */
export async function sendPayout(input: {
  communityId: string;
  proposalId: string;
  phone: string;
  quote: PayoutQuote;
  headers: Record<string, string>;
}): Promise<PayoutResult> {
  const result = await usdcToMobileMoney({
    communityId: input.communityId,
    proposalId: input.proposalId,
    phone: input.phone,
    usdcAmount: input.quote.usdcAmount,
    chain: 'stellar',
    currency: input.quote.currency as 'KES' | 'UGX' | 'GHS' | 'NGN',
    headers: input.headers,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      onHold: Boolean(result.circuitBreaker) || /frozen|circuit/i.test(result.error ?? ''),
    };
  }
  return { ok: true, reference: result.reference, receivedMinor: Math.round(result.kesAmount * 100) };
}
