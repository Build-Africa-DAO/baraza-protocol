// app/api/webhooks/clearing.ts
// Subsystem: Clearing Rail Webhook Confirmation & DLQ Fallback
// Standard: S&P 500 Enterprise Fintech (HMAC Verification, DLQ Poison Pill Isolation)
// Reference: CR-007 §3.2 & Theoretical Solution Specification v3.0 §4.5

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { verifyWebhookSignature } from '../_lib/crypto';

export interface ClearingWebhookPayload {
  intentId: string;
  orderId: string;
  status: 'SETTLED' | 'FAILED' | 'REVERSED';
  clearedAmountMinor: number;
  currency: string;
  txHash?: string;
  externalRef?: string;
  failureReason?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const rawBody = await req.text();
  const webhookSecret = process.env.CLEARING_WEBHOOK_SECRET || process.env.PAYMENT_ADAPTER_PROXY_SECRET;
  const signature = req.headers.get('x-clearing-signature') || req.headers.get('x-signature');

  // Invariant I-SEC-1: Fail-Closed HMAC & Constant-Time Verification
  const authCheck = verifyWebhookSignature(rawBody, signature, webhookSecret);
  if (!authCheck.valid) {
    if (authCheck.reason === 'MISSING_SECRET') {
      return jsonResponse(
        { error: 'server_misconfigured', message: 'Clearing webhook secret is not configured' },
        { status: 503 }
      );
    }
    return jsonResponse(
      { error: 'unauthorized', message: 'Invalid clearing webhook signature' },
      { status: 401 }
    );
  }

  let payload: ClearingWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ClearingWebhookPayload;
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Payload must be valid JSON' }, { status: 400 });
  }

  const { orderId, status, clearedAmountMinor, currency, txHash, failureReason } = payload;
  if (!orderId) {
    return jsonResponse({ error: 'invalid_payload', message: 'orderId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Look up target order
  const { data: order, error: orderLookupErr } = await supabase
    .from('payment_orders')
    .select('order_id, community_id, status, amount_expected, currency')
    .eq('order_id', orderId)
    .maybeSingle();

  // 2. Invariant I8: Dead Letter Queue (DLQ) Isolation for Missing / Orphaned Orders
  if (orderLookupErr || !order) {
    // Record to payment_exceptions DLQ with status = 'PENDING' if not already pending
    const { data: existingPending } = await supabase
      .from('payment_exceptions')
      .select('id')
      .eq('order_id', orderId)
      .eq('provider', 'swypt')
      .eq('status', 'PENDING')
      .maybeSingle();

    if (!existingPending) {
      await supabase.from('payment_exceptions').insert({
        order_id: orderId,
        provider: 'swypt',
        payload: payload as unknown as Record<string, unknown>,
        error_code: 'ORDER_NOT_FOUND',
        error_message: `Webhook received for non-existent order ${orderId}`,
        status: 'PENDING',
      });
    }

    // Return HTTP 200 to acknowledge webhook receipt and prevent upstream endless retry hammering
    return jsonResponse({
      ok: true,
      dlq: true,
      orderId,
      message: 'Order not found; routed to payment_exceptions DLQ.',
    });
  }

  // 3. Process Settlement or Failure
  if (status === 'SETTLED') {
    await supabase
      .from('payment_orders')
      .update({
        status: 'PAYMENT_CONFIRMED',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // If linked to a community treasury, post settlement journal entry
    if (order.community_id && clearedAmountMinor > 0) {
      await supabase.from('journal_entries').insert({
        community_id: order.community_id,
        reference_type: 'clearing_settlement',
        reference_id: orderId,
        debit_account: 'baraza:escrow_clearing',
        credit_account: 'baraza:community_treasury',
        amount_minor: clearedAmountMinor,
        currency: currency || order.currency || 'KES',
        memo: `Clearing settlement confirmed via tx ${txHash || 'N/A'}`,
      });
    }

    return jsonResponse({ ok: true, status: 'confirmed', orderId });
  }

  if (status === 'FAILED' || status === 'REVERSED') {
    await supabase
      .from('payment_orders')
      .update({
        status: 'PAYMENT_FAILED',
        failure_reason: failureReason || 'Clearing provider reported failure',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    return jsonResponse({ ok: true, status: 'failed', orderId });
  }

  return jsonResponse({ ok: true, status: 'ignored', orderId });
}
