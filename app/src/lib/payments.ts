import { getSupabaseClient } from '@/lib/communities';

/**
 * Mirrors the `status` CHECK constraint in
 * `supabase/migrations/002_payment_orders.sql`. Keep these in sync — the DB
 * will reject any value not in this list.
 */
export type PaymentOrderStatus =
  | 'CREATED'
  | 'PAYMENT_REQUESTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'MINT_QUEUED'
  | 'MINT_SUBMITTED'
  | 'MINT_CONFIRMED'
  | 'INDEXER_CONFIRMED'
  | 'RECONCILED'
  | 'PAYMENT_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'AMOUNT_MISMATCH'
  | 'MINT_FAILED_RETRYABLE'
  | 'MINT_FAILED_FINAL'
  | 'REFUND_QUEUED'
  | 'REFUND_SUBMITTED'
  | 'REFUND_CONFIRMED'
  | 'MANUAL_REVIEW';

/**
 * Forward-progress sequence. Used to compute the current display stage on
 * the join status page. Failure / refund states are not in this sequence —
 * the UI surfaces them as terminal error blocks.
 */
export const PAYMENT_HAPPY_PATH: PaymentOrderStatus[] = [
  'CREATED',
  'PAYMENT_REQUESTED',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'MINT_QUEUED',
  'MINT_SUBMITTED',
  'MINT_CONFIRMED',
  'INDEXER_CONFIRMED',
  'RECONCILED',
];

const FAILURE_STATUSES = new Set<PaymentOrderStatus>([
  'PAYMENT_EXPIRED',
  'PAYMENT_FAILED',
  'AMOUNT_MISMATCH',
  'MINT_FAILED_RETRYABLE',
  'MINT_FAILED_FINAL',
  'MANUAL_REVIEW',
]);

const REFUND_STATUSES = new Set<PaymentOrderStatus>([
  'REFUND_QUEUED',
  'REFUND_SUBMITTED',
  'REFUND_CONFIRMED',
]);

export function isFailureStatus(s: PaymentOrderStatus): boolean {
  return FAILURE_STATUSES.has(s);
}

export function isRefundStatus(s: PaymentOrderStatus): boolean {
  return REFUND_STATUSES.has(s);
}

export function isTerminalStatus(s: PaymentOrderStatus): boolean {
  return (
    s === 'RECONCILED' ||
    isFailureStatus(s) ||
    s === 'REFUND_CONFIRMED'
  );
}

export interface PaymentOrder {
  order_id: string;
  community_id: string;
  membership_tier_id: string | null;
  status: PaymentOrderStatus;
  amount_expected: number;
  amount_received: number | null;
  currency: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'order_id,community_id,membership_tier_id,status,amount_expected,amount_received,currency,confirmed_at,created_at,updated_at';

/**
 * Fetch a payment order by `order_id`. Returns null when Supabase is not
 * configured (caller should fall back to mock progression) OR when the
 * order does not exist.
 */
export async function fetchPaymentOrder(orderId: string): Promise<PaymentOrder | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('payment_orders')
    .select(SELECT_COLUMNS)
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throw error;
  return (data as PaymentOrder | null) ?? null;
}
