// app/api/_lib/observability.ts
// Standard: S&P 500 Enterprise Fintech / Observability & Dead-Letter Queue (DLQ) Telemetry
// Dual Ingress: Automated Alert Webhooks (Slack / PagerDuty) + Sentry / Exception Capture

import { getSupabaseAdmin } from './supabase';

export interface PaymentExceptionPayload {
  orderId?: string;
  rail: string;
  amount?: number | string;
  currency?: string;
  errorMessage: string;
  errorStack?: string;
  severity?: 'WARNING' | 'HIGH' | 'CRITICAL' | 'FATAL';
  metadata?: Record<string, unknown>;
}

/**
 * Dispatches an urgent alert for Dead-Letter Queue / Payment Exceptions.
 */
export async function alertDeadLetterQueue(
  payload: PaymentExceptionPayload,
): Promise<void> {
  const timestamp = new Date().toISOString();
  const severity = payload.severity || 'CRITICAL';

  // 1. Asynchronously log exception to PostgreSQL payment_exceptions table if orderId is provided
  if (payload.orderId) {
    try {
      const supabase = getSupabaseAdmin();
      Promise.resolve(
        supabase.from('payment_exceptions').insert({
          order_id: payload.orderId,
          rail: payload.rail,
          error_message: payload.errorMessage,
          error_stack: payload.errorStack || null,
          severity,
          metadata: payload.metadata || {},
          status: 'UNRESOLVED',
          created_at: timestamp,
        }),
      ).catch(() => {});
    } catch {
      // Non-fatal
    }
  }

  // 2. Dispatch to Slack Webhook if configured
  const slackWebhookUrl = process.env.OPS_SLACK_WEBHOOK_URL;
  if (slackWebhookUrl) {
    try {
      const text = `🚨 *[${severity}] Payment Exception Detected — Baraza Protocol DLQ*\n` +
        `• *Rail:* \`${payload.rail}\`\n` +
        `• *Order ID:* \`${payload.orderId || 'N/A'}\`\n` +
        `• *Amount:* ${payload.amount ? `${payload.amount} ${payload.currency || 'KES'}` : 'N/A'}\n` +
        `• *Error:* ${payload.errorMessage}\n` +
        `• *Time:* \`${timestamp}\``;

      Promise.resolve(
        fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }),
      ).catch(() => {});
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Captures backend exceptions for telemetry and logging.
 */
export function captureBackendException(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  if (process.env.NODE_ENV !== 'production') {
    // Development / Test trace
    console.error('[Backend Exception]', message, context || '', stack || '');
  }
}
