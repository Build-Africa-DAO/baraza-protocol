// app/api/payments/exceptions/resolve.ts
// Standard: S&P 500 Enterprise Fintech (DLQ Two-Phase Exception Resolution)
// Reference: CR-007 §3.2 & Theoretical Solution Specification v3.0 §4.4

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../../_lib/supabase';
import { resolveCallerIdentity } from '../../_lib/auth-session';

interface ResolveExceptionRequest {
  exceptionId: string;
  action: 'RETRY_MATCH' | 'MANUAL_REFUND' | 'FORCE_FAIL' | 'DISCARD';
  targetOrderId?: string;
  note?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-wallet-signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const secret = process.env.PAYMENT_ADAPTER_PROXY_SECRET;
  const authHeader = req.headers.get('authorization');
  const isServiceSecret = Boolean(secret && authHeader === `Bearer ${secret}`);

  // Resolve caller identity
  const identity = await resolveCallerIdentity(req, 'resolve-payment-exception');
  if (!isServiceSecret && !identity) {
    return jsonResponse(
      { error: 'unauthorized', message: 'Restricted to operators and authorized backend services.' },
      { status: 401 }
    );
  }

  const operatorIdentifier = isServiceSecret
    ? 'service:proxy'
    : identity?.walletAddress || identity?.privyDid || 'operator:unknown';

  let body: ResolveExceptionRequest;
  try {
    body = (await req.json()) as ResolveExceptionRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { exceptionId, action, targetOrderId } = body;
  if (!exceptionId) {
    return jsonResponse({ error: 'invalid_request', message: 'exceptionId is required.' }, { status: 400 });
  }

  const allowedActions = ['RETRY_MATCH', 'MANUAL_REFUND', 'FORCE_FAIL', 'DISCARD'];
  if (!action || !allowedActions.includes(action)) {
    return jsonResponse(
      { error: 'invalid_request', message: `action must be one of: ${allowedActions.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    // Invoke stored procedure for Dijkstra monotonic resolution
    const { data, error } = await supabase.rpc('resolve_payment_exception_atomic', {
      p_exception_id: exceptionId,
      p_action: action,
      p_target_order_id: targetOrderId || null,
      p_operator: operatorIdentifier,
    });

    if (error) {
      if (error.code === 'P0002') {
        return jsonResponse({ error: 'not_found', message: error.message }, { status: 404 });
      }
      if (error.code === '22000') {
        return jsonResponse({ error: 'conflict', message: error.message }, { status: 409 });
      }
      return jsonResponse({ error: 'resolution_failed', message: error.message }, { status: 500 });
    }

    return jsonResponse({
      ok: true,
      result: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown exception resolution error';
    return jsonResponse({ error: 'internal_error', message }, { status: 500 });
  }
}
