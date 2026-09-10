// app/api/webhooks/artizen.ts
// Subsystem: Artizen Campaign Integration & Settlement Webhook
// Standard: S&P 500 Enterprise Fintech (Atomic Settlement, SASRA Liquidity Guard)
// Reference: CR-007 §3.2 & Theoretical Solution Specification v3.0 §4.6

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { verifyWebhookSignature } from '../_lib/crypto';

export interface ArtizenWebhookPayload {
  campaignId: string;
  eventType: 'CAMPAIGN_COMPLETED' | 'CAMPAIGN_UPDATED';
  totalRaisedMinor: number;
  txHash?: string;
  operator?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const rawBody = await req.text();
  const webhookSecret = process.env.ARTIZEN_WEBHOOK_SECRET || process.env.PAYMENT_ADAPTER_PROXY_SECRET;
  const signature = req.headers.get('x-artizen-signature') || req.headers.get('x-signature');

  // Invariant I-SEC-1: Fail-Closed HMAC & Constant-Time Verification
  const authCheck = verifyWebhookSignature(rawBody, signature, webhookSecret);
  if (!authCheck.valid) {
    if (authCheck.reason === 'MISSING_SECRET') {
      return jsonResponse(
        { error: 'server_misconfigured', message: 'Artizen webhook secret is not configured' },
        { status: 503 }
      );
    }
    return jsonResponse(
      { error: 'unauthorized', message: 'Invalid Artizen webhook signature' },
      { status: 401 }
    );
  }

  let payload: ArtizenWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ArtizenWebhookPayload;
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Payload must be valid JSON' }, { status: 400 });
  }

  const { campaignId, eventType, totalRaisedMinor, txHash, operator } = payload;
  if (!campaignId) {
    return jsonResponse({ error: 'invalid_payload', message: 'campaignId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (eventType === 'CAMPAIGN_COMPLETED') {
    // Update campaign raised total if provided
    if (typeof totalRaisedMinor === 'number' && totalRaisedMinor > 0) {
      await supabase
        .from('artizen_campaigns')
        .update({
          total_raised_minor: totalRaisedMinor,
          status: 'PENDING_SETTLEMENT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }

    // Attempt atomic settlement
    const { data, error } = await supabase.rpc('artizen_settle_campaign_atomic', {
      p_campaign_id: campaignId,
      p_operator: operator || 'artizen:webhook',
      p_tx_hash: txHash || `artizen_${Date.now()}`,
    });

    if (error) {
      if (error.code === '54000') {
        return jsonResponse(
          {
            error: 'sasra_reserve_violation',
            message: error.message,
            circuitBreaker: true,
          },
          { status: 403 }
        );
      }
      return jsonResponse({ error: 'settlement_failed', message: error.message }, { status: 500 });
    }

    return jsonResponse({
      ok: true,
      settlement: data,
    });
  }

  if (eventType === 'CAMPAIGN_UPDATED' && typeof totalRaisedMinor === 'number') {
    await supabase
      .from('artizen_campaigns')
      .update({
        total_raised_minor: totalRaisedMinor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return jsonResponse({ ok: true, updated: true, campaignId });
  }

  return jsonResponse({ ok: true, ignored: true, campaignId });
}
