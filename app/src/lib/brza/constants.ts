import { getPublicEnv } from '@/lib/env';
import { STELLAR_HORIZON_URL, STELLAR_NETWORK } from '@/lib/network';

const _publicEnv = getPublicEnv();
const _siteUrl = _publicEnv.VITE_SITE_URL.replace(/\/$/, '');

// ── Token identity ─────────────────────────────────────────────────────────

export const BRZA_ASSET = {
  code: 'BRZA',
  name: 'Baraza Token',
  description: 'The Baraza community finance and governance token.',
  logoUrl: `${_siteUrl}/brza-token-logo.svg`,
  metadataUrl: `${_siteUrl}/brza-token.json`,
  websiteUrl: _siteUrl,
  issuerAddress: import.meta.env.VITE_BRZA_ISSUER_ADDRESS || '',
  distributorAddress: import.meta.env.VITE_BRZA_DISTRIBUTOR_ADDRESS || '',
  totalSupply: 1_000_000_000,
  decimals: 7,
  network: STELLAR_NETWORK,
  horizonUrl: STELLAR_HORIZON_URL,
} as const;

// ── Price phases ────────────────────────────────────────────────────────────
// Public sale stages: phase0 → seed → strategic → launch
// All prices are unset pending counsel review; `getBrzaPriceUsd` throws for
// any phase whose price is not configured.

export type BrzaPhase = 'phase0' | 'seed' | 'strategic' | 'launch' | 'market';

export const BRZA_PHASES = {
  phase0:    { priceUsd: 0, label: 'Pre-Sale — Community Seed' }, // PRICING_TBD — counsel-gated, set at launch
  seed:      { priceUsd: 0, label: 'Seed Round' },                // PRICING_TBD — counsel-gated, set at launch
  strategic: { priceUsd: 0, label: 'Strategic Round' },           // PRICING_TBD — counsel-gated, set at launch
  launch:    { priceUsd: 0, label: 'Launch' },                    // PRICING_TBD — counsel-gated, set at launch
  market:    { priceUsd: 0, label: 'Market' },
} as const satisfies Record<BrzaPhase, { priceUsd: number; label: string }>;

export const CURRENT_PHASE: BrzaPhase = 'phase0';

// ── Token allocation ────────────────────────────────────────────────────────
// Total supply: 1,000,000,000 BRZA (see BRZA_ASSET.totalSupply).
// Per-bucket allocation numbers are unset pending counsel review. The bucket
// keys are the stable public interface; the authoritative figures live in the
// counsel-gated offering documents and are set here at launch.

export const BRZA_ALLOCATION = {
  communityRewards:  0,  // PRICING_TBD — counsel-gated, set at launch
  founderA:          0,  // PRICING_TBD — counsel-gated, set at launch
  founderB:          0,  // PRICING_TBD — counsel-gated, set at launch
  operations:        0,  // PRICING_TBD — counsel-gated, set at launch
  publicSale:        0,  // PRICING_TBD — counsel-gated, set at launch
  reserve:           0,  // PRICING_TBD — counsel-gated, set at launch
  liquidityPool:     0,  // PRICING_TBD — counsel-gated, set at launch
  grants:            0,  // PRICING_TBD — counsel-gated, set at launch
  referral:          0,  // PRICING_TBD — counsel-gated, set at launch
  events:            0,  // PRICING_TBD — counsel-gated, set at launch
  barazaTvCreators:  0,  // PRICING_TBD — counsel-gated, set at launch
} as const;

// ── Vesting schedule ────────────────────────────────────────────────────────
// cliffDays: tokens locked until this many days post-TGE
// vestingDays: linear release period after cliff
// All day-counts are unset pending counsel review; set at launch.

export const BRZA_VESTING = {
  founderA:    { cliffDays: 0, vestingDays: 0, tokens: BRZA_ALLOCATION.founderA },   // PRICING_TBD — counsel-gated, set at launch
  founderB:    { cliffDays: 0, vestingDays: 0, tokens: BRZA_ALLOCATION.founderB },   // PRICING_TBD — counsel-gated, set at launch
  operations:  { cliffDays: 0, vestingDays: 0, tokens: BRZA_ALLOCATION.operations }, // PRICING_TBD — counsel-gated, set at launch
  // Reserve release additionally requires a governance vote (not just time)
  reserve:     { cliffDays: 0, vestingDays: 0, tokens: BRZA_ALLOCATION.reserve },    // PRICING_TBD — counsel-gated, set at launch
  grants:      { cliffDays: 0, vestingDays: 0, tokens: BRZA_ALLOCATION.grants },     // PRICING_TBD — counsel-gated, set at launch
  publicSale:  { cliffDays: 0, vestingDays: 0, tokens: BRZA_ALLOCATION.publicSale }, // PRICING_TBD — counsel-gated, set at launch
} as const;

// ── Community reward emission ───────────────────────────────────────────────
// Source: communityRewards pool
// Flows: join reward · vote reward · proposal reward · bounty payout
//
// Referral was previously listed here as a pct slot, which double-drew
// against the dedicated Referral bucket (`BRZA_ALLOCATION.referral`).
// Zara flagged the double-draw 2026-06-19 (filing 2026-06-19T03-00-00Z-18f8).
// Akili council ruling 2026-06-19 (phase-6-referral-gate-cleared): referral
// payouts draw exclusively from the referral bucket. See BRZA_REFERRAL below.
// The slot is retained as `reservedPct` so the community-rewards monthly
// cap stays whole and any future flow has a clean home.

export const BRZA_EMISSION = {
  total:               BRZA_ALLOCATION.communityRewards,
  monthlyCapTokens:    0, // PRICING_TBD — counsel-gated, set at launch
  bountyPoolPct:       0.40,
  membershipRewardPct: 0.30,
  governanceRewardPct: 0.20,
  reservedPct:         0.10,
} as const;

// ── Referral mechanic (Phase 6 — SHIP CONDITIONAL) ──────────────────────────
// Source: BRZA_ALLOCATION.referral. Independent of BRZA_EMISSION.
//
// Council ruling 2026-06-19 (filings: kofi 351d, zara 18f8, nia 4c43, seku f025):
//   * Kofi cond 4(c): monthly sub-cap REQUIRED. Set here.
//   * Kofi cond 4(a): identity-continuity is PARTIAL. Phase 6 ships TIME-LIMITED
//     at Phase 0. Must NOT persist into later phases without Celo G$
//     or Soroban credential live. Enforced via `priceCeilingPhase`.
//   * Zara: referrer/referee payout split. Sybil dues floor KES 650
//     routes to product separately. Per-wallet cap 5/12-month rolling.
//   * Zara signal `referral_velocity_breach`: pause + human review at >5/30d.
//   * Seku: family-ring vector requires PAYMENT_PHONE_HASH_PEPPER dedup ACTIVE
//     before launch. See `requiresPepperDedupActive`.
//   * Nia: referrer progress signal required (UX, not payout). See
//     `components/ReferralProgress.tsx`.

export const BRZA_REFERRAL = {
  bucketTokens:                  BRZA_ALLOCATION.referral,
  monthlySubCapTokens:           50_000,
  payoutReferrerTokens:          500,
  payoutRefereeTokens:           250,
  gateMinDaysActive:             90,
  gateMinPaymentsMade:           3,
  maxPairsPerReferrerRolling12mo: 5,
  velocityBreachPairsPer30d:     5,
  // Hard ceiling — referral mechanic disabled at any phase priced above this
  // until identity continuity is live (Kofi cond 4a).
  priceCeilingPhase:             'phase0' as BrzaPhase,
  // Seku cond — block payouts at runtime if pepper dedup is not configured.
  requiresPepperDedupActive:     true,
  // Kofi cond 4(d) — UNRESOLVED at ship time. Named multi-sig signers must
  // be filled before any disbursement batch. Ship-time override-log entry
  // required if disbursements run with this empty.
  multiSigSignersWallets:        [] as readonly string[],
} as const;

/**
 * Runtime guard: referral payouts may not fire unless all four council
 * conditions are satisfied. Returns the blocking reason or null when clear.
 *
 * `identityContinuityLive` lifts Kofi's phase ceiling once Phase 9
 * (bidirectional identity claim flow) is in production AND the operator
 * affirms enough wallets are linked. Until then, payouts above Phase 0
 * remain blocked.
 */
export function referralPayoutBlockedReason(args: {
  currentPhase: BrzaPhase;
  paymentPhoneHashPepperConfigured: boolean;
  monthlyDisbursedTokens: number;
  identityContinuityLive?: boolean;
}): string | null {
  // Kofi cond 4a — price ceiling lifts only when identity continuity is live.
  const phaseRanks: Record<BrzaPhase, number> = {
    phase0: 0, seed: 1, strategic: 2, launch: 3, market: 4,
  };
  const aboveCeiling =
    phaseRanks[args.currentPhase] > phaseRanks[BRZA_REFERRAL.priceCeilingPhase];
  if (aboveCeiling && !args.identityContinuityLive) {
    return 'referral_disabled_above_phase0_until_identity_continuity_live';
  }
  // Seku cond — pepper dedup required
  if (BRZA_REFERRAL.requiresPepperDedupActive && !args.paymentPhoneHashPepperConfigured) {
    return 'referral_disabled_pepper_dedup_not_configured';
  }
  // Kofi cond 4c — monthly sub-cap enforcement
  if (args.monthlyDisbursedTokens >= BRZA_REFERRAL.monthlySubCapTokens) {
    return 'referral_monthly_sub_cap_exhausted';
  }
  // Kofi cond 4d — named multi-sig signers required for any disbursement
  if (BRZA_REFERRAL.multiSigSignersWallets.length < 3) {
    return 'referral_disabled_multisig_signers_unnamed';
  }
  return null;
}

// ── Baraza TV creator economics ─────────────────────────────────────────────
// Source: barazaTvCreators pool + subscription/tip revenue

export const BARAZA_TV = {
  creatorRevSharePct:   0.70,  // 70% of subscription revenue to creator
  communityRevSharePct: 0.20,  // 20% back to community DAO treasury
  protocolFeePct:       0.10,  // 10% to protocol reserve vault
  membershipRequired:   true,  // creator must hold active community membership
} as const;

// ── Fees ────────────────────────────────────────────────────────────────────

export const BRZA_FEES = {
  treasuryTxPct: 0.02,
  swapPct:       0.005,
} as const;

// ── Loan terms (hardcoded — never configurable per product spec) ────────────

export const LOAN_TERMS = {
  maxLtvPct:    0.50,   // 50% loan-to-value
  aprPct:       0.05,   // 5% APR
  termMonths:   12,
} as const;

// ── TVL milestones ──────────────────────────────────────────────────────────
// Targets are unset pending counsel review; set at launch.

export const BRZA_TVL_TARGETS = {
  stellarPool: 0, // PRICING_TBD — counsel-gated, set at launch
  solanaPool:  0, // PRICING_TBD — counsel-gated, set at launch
  launch:      0, // PRICING_TBD — counsel-gated, set at launch
} as const;

// ── Fiat conversion ─────────────────────────────────────────────────────────

export const FIAT_RATES: Record<string, number> = {
  KES: 0.0077,  UGX: 0.00027, TZS: 0.00039,
  NGN: 0.00063, GHS: 0.067,   ZAR: 0.054,
  ETB: 0.0091,  USD: 1.0,     EUR: 1.08,   GBP: 1.27,
};

export function convertToBrza(
  amount: number,
  currency: string,
  phase: BrzaPhase = CURRENT_PHASE,
): { brzaAmount: number; usdValue: number } {
  const rate = getFiatRate(currency);
  const priceUsd = getBrzaPriceUsd(phase);
  const usdValue = amount * rate;
  const brzaAmount = Math.round((usdValue / priceUsd) * 1e7) / 1e7;
  return { brzaAmount, usdValue };
}

export function formatBrza(amount: number): string {
  return `${amount.toLocaleString('en-KE', { maximumFractionDigits: 2 })} BRZA`;
}

export function formatLocal(usdValue: number, currency = 'KES'): string {
  const rate = getFiatRate(currency);
  const local = usdValue / rate;
  return `${currency} ${local.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export function getFiatRate(currency: string): number {
  const normalized = currency.trim().toUpperCase();
  const rate = FIAT_RATES[normalized];
  if (!rate) throw new Error(`Unsupported fiat currency: ${currency}`);
  return rate;
}

/**
 * Whether a phase has a configured (non-placeholder) USD price. All phase
 * prices ship unset pending counsel review; display surfaces should render
 * a zero/unavailable state rather than calling `getBrzaPriceUsd` blind.
 */
export function isBrzaPriceConfigured(phase: BrzaPhase = CURRENT_PHASE): boolean {
  return BRZA_PHASES[phase].priceUsd > 0;
}

export function getBrzaPriceUsd(phase: BrzaPhase = CURRENT_PHASE): number {
  const priceUsd = BRZA_PHASES[phase].priceUsd;
  if (priceUsd <= 0) {
    throw new Error(`BRZA ${phase} price is not configured.`);
  }
  return priceUsd;
}

// ── XLM/USD reference rate (MVP placeholder) ────────────────────────────────
// Pinned at payment-intent creation time so brza_allocated is reproducible:
// the same intent token always derives the same BRZA amount regardless of
// rate drift between intent creation and Horizon verification.
//
// Replace with a live oracle (Stellar SDB pool, CoinGecko, Chainlink CCIP)
// at intent creation when one is wired in. The verify step never re-fetches —
// it trusts the signed value from the intent payload.

export const XLM_USD_RATE_MVP = 0.10;

/**
 * Resolve the XLM/USD rate for browser-side display. Edge functions should
 * read `process.env.XLM_USD_RATE_MVP` directly instead of importing this,
 * since this module pulls in Vite-only `import.meta.env`.
 */
export function getXlmUsdRate(): number {
  const fromEnv = import.meta.env.VITE_XLM_USD_RATE_MVP;
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return XLM_USD_RATE_MVP;
}

/**
 * Pure conversion: XLM amount × XLM/USD rate ÷ BRZA price (USD) = BRZA amount.
 * Both rates must be passed explicitly so the caller controls source-of-truth
 * (signed intent payload at verify time, live oracle at intent-creation time).
 * Rounds to 7 decimals to match BRZA_ASSET.decimals.
 */
export function convertXlmToBrza(
  amountXlm: number,
  xlmUsdRate: number,
  brzaPriceUsd: number,
): number {
  if (!Number.isFinite(amountXlm) || amountXlm <= 0) {
    throw new Error('amountXlm must be a positive number');
  }
  if (!Number.isFinite(xlmUsdRate) || xlmUsdRate <= 0) {
    throw new Error('xlmUsdRate must be a positive number');
  }
  if (!Number.isFinite(brzaPriceUsd) || brzaPriceUsd <= 0) {
    throw new Error('brzaPriceUsd must be a positive number');
  }
  const usdValue = amountXlm * xlmUsdRate;
  return Math.round((usdValue / brzaPriceUsd) * 1e7) / 1e7;
}

export function vestedAmount(
  bucket: keyof typeof BRZA_VESTING,
  daysSinceTge: number,
): number {
  if (!Number.isFinite(daysSinceTge) || daysSinceTge < 0) {
    throw new Error('daysSinceTge must be a non-negative number.');
  }
  const v = BRZA_VESTING[bucket];
  if (daysSinceTge < v.cliffDays) return 0;
  // Guard for unconfigured (placeholder) schedules: no vesting curve means
  // everything past the cliff is treated as vested.
  if (v.vestingDays <= 0) return v.tokens;
  const elapsed = daysSinceTge - v.cliffDays;
  return Math.floor(v.tokens * Math.min(1, elapsed / v.vestingDays));
}
