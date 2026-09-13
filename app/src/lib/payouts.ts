import { usdcToMobileMoney } from '@/lib/adapters/minisend';
import { TELCO_MAX_SINGLE_TX_MINOR } from '@/lib/payments/slippage';

/**
 * Officer sends (§13.18), built on the contract `POST /api/payments/minisend`
 * actually exposes and on the statuses the backend writes to `payment_orders`.
 *
 * Two things are still the server's to provide before a send can run:
 *
 * 1. A quote in the group's currency. Officers think in KES; converting that
 *    into a stablecoin amount is the server's job. Until an endpoint quotes a
 *    send, `requestPayoutQuote` returns `null` and the Send sheet says so
 *    instead of multiplying by a rate the client made up.
 * 2. A readable status for a payout order. Payout orders are created without
 *    an activation secret, so `GET /api/payment-orders/status` cannot read
 *    them. The tracker therefore stops at "sent to the provider" and says
 *    that receipt is confirmed by the provider's webhook, not by this page.
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
export function partsNeeded(amountMinor: number, currency: string, maxAllowedMinor: number = Number(TELCO_MAX_SINGLE_TX_MINOR)): number {
  if (currency !== 'KES' || amountMinor <= 0) return 1;
  return Math.max(1, Math.ceil(amountMinor / maxAllowedMinor));
}

/**
 * Split one send into equal parts under the ceiling. The last part carries the
 * remainder so the parts sum exactly to the original amount.
 */
export function tranchePlan(amountMinor: number, currency: string, maxAllowedMinor: number = Number(TELCO_MAX_SINGLE_TX_MINOR)): number[] {
  const parts = partsNeeded(amountMinor, currency, maxAllowedMinor);
  if (parts <= 1) return [amountMinor];
  const base = Math.floor(amountMinor / parts);
  const plan = Array.from({ length: parts }, () => base);
  plan[parts - 1] += amountMinor - base * parts;
  return plan;
}

/**
 * The statuses the backend writes for a payout order, in order. `SETTLED`,
 * `FAILED` and `REVERSAL_DETECTED` come from the provider webhook.
 */
export type PayoutStatus = 'OFFRAMP_INITIATED' | 'PROVIDER_PENDING_VERIFICATION' | 'SETTLED' | 'FAILED' | 'REVERSAL_DETECTED';

export const PAYOUT_STEPS = [
  { label: 'Reserved from group funds' },
  { label: 'Sent to the provider' },
  { label: 'Received on the phone' },
] as const;

export function payoutStepIndex(status: PayoutStatus): number {
  switch (status) {
    case 'OFFRAMP_INITIATED':
      return 0;
    case 'PROVIDER_PENDING_VERIFICATION':
      return 1;
    case 'SETTLED':
      return 3;
    case 'FAILED':
      return 1;
    case 'REVERSAL_DETECTED':
      return 2;
  }
}

export function payoutStatusLabel(status: PayoutStatus): string {
  switch (status) {
    case 'OFFRAMP_INITIATED':
      return 'Reserved';
    case 'PROVIDER_PENDING_VERIFICATION':
      return 'With the Provider';
    case 'SETTLED':
      return 'Received';
    case 'FAILED':
      return 'Failed';
    case 'REVERSAL_DETECTED':
      return 'Reversed';
  }
}

export interface PayoutResult {
  ok: boolean;
  status: PayoutStatus;
  orderId?: string;
  reference?: string;
  /** Fiat the provider quoted for this part, in minor units. */
  fiatMinor?: number;
  error?: string;
  onHold?: boolean;
  /** Set when the server refused the amount for the telco ceiling. */
  ceiling?: { maxAllowedMinor: number; recommendedTranches: number };
}

/** Send one quoted part. Never called without a quote. */
export async function sendPayout(input: {
  communityId: string;
  /** Deterministic per part: `<proposalId>-tranche-<n>` when split, so a retry can be matched. */
  proposalId: string;
  phone: string;
  quote: PayoutQuote;
  headers?: Record<string, string>;
}): Promise<PayoutResult> {
  const result = await usdcToMobileMoney({
    communityId: input.communityId,
    proposalId: input.proposalId,
    phone: input.phone,
    usdcAmount: input.quote.usdcAmount,
    chain: 'stellar',
    currency: input.quote.currency.toUpperCase() as 'KES' | 'UGX' | 'GHS' | 'NGN',
    headers: input.headers,
  });
  if (!result.ok) {
    return {
      ok: false,
      status: 'FAILED',
      error: result.error,
      onHold: Boolean(result.circuitBreaker) || /frozen|circuit/i.test(result.error ?? ''),
      ceiling:
        result.status === 422 && typeof result.maxAllowedMinor === 'number' && typeof result.recommendedTranches === 'number'
          ? { maxAllowedMinor: result.maxAllowedMinor, recommendedTranches: result.recommendedTranches }
          : undefined,
    };
  }
  // A 200 means the order is with the provider. Receipt arrives by webhook.
  return {
    ok: true,
    status: 'PROVIDER_PENDING_VERIFICATION',
    orderId: result.orderId,
    reference: result.reference,
    fiatMinor: Math.round(result.kesAmount * 100),
  };
}
