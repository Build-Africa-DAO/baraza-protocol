// app/api/system/pricing.ts
// Standard: S&P 500 Enterprise Fintech (Deterministic System Pricing & Launch Waiver Gate)
export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';

export interface SystemPricingPayload {
  globalPlatformFeeBps: number;
  communityActivationMinor: number;
  memberActivationMinor: number;
  waiverActive: boolean;
  waiverExpiresAt: string;
  effectiveDate: string;
  carrierPassThrough: boolean;
}

export interface SystemPricingResponse {
  ok: boolean;
  pricing: SystemPricingPayload;
}

const DEFAULT_PRICING: SystemPricingPayload = {
  globalPlatformFeeBps: 150,
  communityActivationMinor: 25000,
  memberActivationMinor: 10000,
  waiverActive: true,
  waiverExpiresAt: '2026-10-10T00:00:00Z',
  effectiveDate: '2026-10-10T00:00:00Z',
  carrierPassThrough: true,
};

let memoryCache: { payload: SystemPricingResponse; cachedAt: number } | null = null;
const CACHE_TTL_MS = 15000;

export function resetPricingCache(): void {
  memoryCache = null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
  }

  const now = Date.now();
  if (memoryCache && now - memoryCache.cachedAt < CACHE_TTL_MS) {
    return jsonResponse(memoryCache.payload, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'pricing_rules')
      .maybeSingle();

    if (error || !data?.value) {
      return jsonResponse({ ok: true, pricing: DEFAULT_PRICING }, { status: 200 });
    }

    const val = data.value as {
      global_platform_fee_bps?: number;
      community_activation_minor?: number;
      member_activation_minor?: number;
      community_launch_waiver_active?: boolean;
      community_launch_waiver_expires_at?: string;
      carrier_pass_through?: boolean;
      effective_date?: string;
    };

    const payload: SystemPricingResponse = {
      ok: true,
      pricing: {
        globalPlatformFeeBps: val.global_platform_fee_bps ?? DEFAULT_PRICING.globalPlatformFeeBps,
        communityActivationMinor: val.community_activation_minor ?? DEFAULT_PRICING.communityActivationMinor,
        memberActivationMinor: val.member_activation_minor ?? DEFAULT_PRICING.memberActivationMinor,
        waiverActive: val.community_launch_waiver_active ?? DEFAULT_PRICING.waiverActive,
        waiverExpiresAt: val.community_launch_waiver_expires_at ?? DEFAULT_PRICING.waiverExpiresAt,
        effectiveDate: val.effective_date ?? DEFAULT_PRICING.effectiveDate,
        carrierPassThrough: val.carrier_pass_through ?? DEFAULT_PRICING.carrierPassThrough,
      },
    };

    memoryCache = { payload, cachedAt: now };
    return jsonResponse(payload, { status: 200 });
  } catch {
    return jsonResponse({ ok: true, pricing: DEFAULT_PRICING }, { status: 200 });
  }
}
