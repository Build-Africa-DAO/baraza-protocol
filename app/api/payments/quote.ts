// app/api/payments/quote.ts
// Standard: S&P 500 Enterprise Fintech (Deterministic FX Quoting & SASRA Compliance Gate)
// Governing Specs: SASRA 2020 Non-Deposit Taking Regulations & POST_PR89_ADJUSTED_THEORETICAL_SOLUTION_DEFINITION.md §3 [BE-8]

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { resolveCallerIdentity } from '../_lib/auth-session';
import { computeHmacSha256 } from '../_lib/crypto';

export interface PayoutQuoteResponse {
  ok: boolean;
  quoteId: string;
  communityId: string;
  amountKes: number;
  grossDisbursementKes: number;
  telcoFeeKes: number;
  netMpesaReceivedKes: number;
  exchangeRate: number;
  usdcRequired: number;
  expiresAt: number;
  quoteToken: string;
  sasraCompliant: boolean;
}

/**
 * Standard Safaricom Daraja B2C tariff schedule (in KES).
 * Deterministic tiered telco disbursement fee.
 */
export function calculateTelcoB2cFee(amountKes: number): number {
  if (amountKes <= 100) return 0;
  if (amountKes <= 1000) return 15;
  if (amountKes <= 5000) return 23;
  if (amountKes <= 20000) return 35;
  if (amountKes <= 50000) return 55;
  return 105;
}

/**
 * Calculates the maximum permissible payout under the SASRA 15% statutory liquid reserve rule:
 * P_max = (V - 0.15 * D) / 0.85
 * Where V is liquid vault balance and D is total withdrawable deposits.
 */
export function calculateSasraMaxPayout(vaultLiquidMinor: number, depositsMinor: number, reserveRatio = 0.15): number {
  const numerator = vaultLiquidMinor - reserveRatio * depositsMinor;
  if (numerator <= 0) return 0;
  const denominator = 1 - reserveRatio;
  return Math.floor(numerator / denominator);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, x-wallet-address, x-wallet-signature, x-wallet-message, x-test-wallet-address, x-test-privy-did, x-test-user-profile-id',
      },
    });
  }

  const quoteSecret = (process.env.PAYMENT_QUOTE_SECRET || process.env.PAYOUT_QUOTE_SECRET || process.env.MINISEND_API_KEY)?.trim();
  if (!quoteSecret) {
    return jsonResponse(
      { error: 'service_unavailable', message: 'Quote service temporarily unavailable' },
      { status: 503 },
    );
  }

  // 2. Dual/Unified Auth Ingress
  const identity = await resolveCallerIdentity(req, 'payments-quote');
  if (!identity || (!identity.walletAddress && !identity.privyDid && !identity.userProfileId)) {
    return jsonResponse(
      { error: 'unauthorized', message: 'Authentication required via Web3 wallet proof, Privy session, or user session.' },
      { status: 401 },
    );
  }

  // 3. Extract inputs from GET or POST
  let communityId: string;
  let amountKes: number;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    communityId = url.searchParams.get('communityId') || '';
    amountKes = parseFloat(url.searchParams.get('amount') || url.searchParams.get('amountKes') || '0');
  } else if (req.method === 'POST') {
    try {
      const body = await req.json();
      communityId = (body.communityId || '').trim();
      amountKes = parseFloat(body.amount || body.amountKes || '0');
    } catch {
      return jsonResponse({ error: 'invalid_json', message: 'Malformed JSON payload' }, { status: 400 });
    }
  } else {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  if (!communityId) {
    return jsonResponse({ error: 'invalid_request', message: 'communityId is required' }, { status: 400 });
  }

  if (!Number.isFinite(amountKes) || amountKes <= 0 || !Number.isInteger(amountKes)) {
    return jsonResponse(
      { error: 'invalid_amount', message: 'Amount must be a positive integer in KES' },
      { status: 400 },
    );
  }

  if (amountKes > 250000) {
    return jsonResponse(
      { error: 'amount_exceeds_limit', message: 'Amount exceeds maximum single transaction limit of KES 250,000' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // 4. Fetch community financial state to evaluate SASRA 15% liquid reserve rule
  const { data: community, error: commError } = await supabase
    .from('communities')
    .select('id, status, is_payout_frozen, liquid_vault_balance_minor, withdrawable_deposits_minor, fund_balance')
    .eq('id', communityId)
    .maybeSingle();

  if (commError) {
    return jsonResponse({ error: 'database_error', message: commError.message }, { status: 500 });
  }

  if (!community) {
    return jsonResponse({ error: 'community_not_found', message: 'Community does not exist' }, { status: 404 });
  }

  if (community.is_payout_frozen || community.status === 'paused') {
    return jsonResponse(
      { error: 'payouts_frozen', message: 'Community payouts are currently frozen' },
      { status: 403 },
    );
  }

  // Liquid vault reserves (V) and deposits (D) in minor currency units (cents)
  const vaultLiquidMinor = Number(community.liquid_vault_balance_minor ?? (community.fund_balance ? Math.round(Number(community.fund_balance) * 100) : 0));
  const depositsMinor = Number(community.withdrawable_deposits_minor ?? vaultLiquidMinor);

  // If deposits exist, assert SASRA 15% prudential reserve limit: P_max = (V - 0.15D) / 0.85
  if (depositsMinor > 0) {
    const pMaxMinor = calculateSasraMaxPayout(vaultLiquidMinor, depositsMinor, 0.15);
    const requestedDisbursementMinor = amountKes * 100;

    if (requestedDisbursementMinor > pMaxMinor) {
      return jsonResponse(
        {
          error: 'insufficient_reserve',
          message: 'Payout exceeds SASRA 15% liquid reserve limit',
          details: {
            maxPermissibleDisbursementKes: Math.floor(pMaxMinor / 100),
            requestedKes: amountKes,
          },
        },
        { status: 400 },
      );
    }
  }

  // 5. Fixed-Point FX Arithmetic (Integer minor units)
  const telcoFeeKes = calculateTelcoB2cFee(amountKes);
  const grossDisbursementKes = amountKes + telcoFeeKes;
  const netMpesaReceivedKes = amountKes;

  const rawFxRate = parseFloat(process.env.FX_RATE_KES_PER_USDC || '128.50');
  const fxRate = Number.isFinite(rawFxRate) && rawFxRate > 0 ? rawFxRate : 128.50;

  // Rate in cents per USDC (e.g. 128.50 KES = 12850 cents)
  const rateCentsPerUsdc = Math.round(fxRate * 100);

  // Total KES minor units to fund (gross disbursement = principal + fee)
  const totalCents = grossDisbursementKes * 100;

  // USDC micro-units (10^6): floor((totalCents * 10^6) / rateCentsPerUsdc)
  const usdcMicro = Math.floor((totalCents * 1_000_000) / rateCentsPerUsdc);
  const usdcRequired = Number((usdcMicro / 1_000_000).toFixed(2));

  // 6. Cryptographic HMAC Token with 90s TTL
  const quoteId = `quot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = Date.now() + 90 * 1000; // 90 seconds from issuance

  const messageToSign = `${quoteId}:${communityId}:${amountKes}:${usdcRequired}:${expiresAt}`;
  const quoteToken = computeHmacSha256(quoteSecret, messageToSign);

  const responsePayload: PayoutQuoteResponse = {
    ok: true,
    quoteId,
    communityId,
    amountKes,
    grossDisbursementKes,
    telcoFeeKes,
    netMpesaReceivedKes,
    exchangeRate: fxRate,
    usdcRequired,
    expiresAt,
    quoteToken,
    sasraCompliant: true,
  };

  return jsonResponse(responsePayload, { status: 200 });
}
