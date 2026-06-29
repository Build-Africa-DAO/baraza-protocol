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
// Public sale stages: phase0 → seed → strategic → launch (IDO)
// Source: Notion product spec 2026-06-08

export type BrzaPhase = 'phase0' | 'seed' | 'strategic' | 'launch' | 'market';

export const BRZA_PHASES = {
  phase0:    { priceUsd: 0.02, label: 'Pre-Sale — Community Seed' },
  seed:      { priceUsd: 0.04, label: 'Seed Round' },
  strategic: { priceUsd: 0.06, label: 'Strategic Round' },
  launch:    { priceUsd: 0.10, label: 'IDO Launch' },
  market:    { priceUsd: 0,    label: 'Market' },
} as const satisfies Record<BrzaPhase, { priceUsd: number; label: string }>;

export const CURRENT_PHASE: BrzaPhase = 'phase0';

// ── Token allocation ────────────────────────────────────────────────────────
// Total: 1,000,000,000 BRZA
// Products: Protocol (governance/treasury) · Baraza TV · IDO · DEX
//
// NOTION DISCREPANCY (2026-06-08, confirmed by audit 2026-06-14 — see
// `docs/TOKENOMICS_AUDIT_REPORT.md`): the Notion product spec table sums
// to 1,100,000,000 (110%) due to inflated ecosystemGrants/communityRewards/
// events/reserve/liquidityPool entries. This file is authoritative; the
// Notion side is the one that must change. Do NOT alter the allocation
// below to match Notion — confirm with the audit report instead.

export const BRZA_ALLOCATION = {
  communityRewards:  200_000_000,  // 20% — emission over 5yr, 2M/month cap
  founderA:           75_000_000,  //  7.5% — 1yr cliff, 3yr vest
  founderB:           75_000_000,  //  7.5% — 1yr cliff, 3yr vest
  operations:        150_000_000,  // 15% — milestone-gated tranches (30M each)
  publicSale:        120_000_000,  // 12% — Phase 0: 20M @ $0.02 · IDO: 100M @ $0.10
  reserve:           100_000_000,  // 10% — 1yr cliff, 3yr vest, protocol insurance
  liquidityPool:      80_000_000,  //  8% — unlock at IDO, locked 12 months
  grants:             80_000_000,  //  8% — ecosystem builders, 6mo cliff, 2yr vest
  referral:           50_000_000,  //  5% — per referral event, no cliff
  events:             40_000_000,  //  4% — hackathons, buildathons, community events
  barazaTvCreators:   30_000_000,  //  3% — Baraza TV creator fund, per content milestone
} as const;

// ── Vesting schedule ────────────────────────────────────────────────────────
// cliffDays: tokens locked until this many days post-TGE
// vestingDays: linear release period after cliff (4-year total for founders)

export const BRZA_VESTING = {
  founderA:    { cliffDays: 365, vestingDays: 1095, tokens: BRZA_ALLOCATION.founderA },
  founderB:    { cliffDays: 365, vestingDays: 1095, tokens: BRZA_ALLOCATION.founderB },
  // 1yr cliff added 2026-06-08 (was 0) — aligns with Notion spec
  operations:  { cliffDays: 365, vestingDays: 1095, tokens: BRZA_ALLOCATION.operations },
  // 2yr lock per Notion spec; actual release requires a governance vote (not just time)
  reserve:     { cliffDays: 730, vestingDays: 1095, tokens: BRZA_ALLOCATION.reserve },
  grants:      { cliffDays: 180, vestingDays:  730, tokens: BRZA_ALLOCATION.grants },
  // Public sale buyers: 6-month cliff, 12-month linear vest
  publicSale:  { cliffDays: 180, vestingDays:  365, tokens: BRZA_ALLOCATION.publicSale },
} as const;

// ── Community reward emission ───────────────────────────────────────────────
// Source: communityRewards pool (200M)
// Flows: join reward · vote reward · proposal reward · bounty payout
//
// Referral was previously listed here as `referralPct: 0.10`, which double-
// drew against the dedicated 50M Referral bucket (`BRZA_ALLOCATION.referral`).
// Zara flagged the double-draw 2026-06-19 (filing 2026-06-19T03-00-00Z-18f8).
// Akili council ruling 2026-06-19 (phase-6-referral-gate-cleared): referral
// payouts draw exclusively from the 50M bucket. See BRZA_REFERRAL below.
// The 10% slot is retained as `reservedPct` so the community-rewards monthly
// cap stays whole and any future flow has a clean home.

export const BRZA_EMISSION = {
  total:               BRZA_ALLOCATION.communityRewards,
  monthlyCapTokens:    2_000_000,
  bountyPoolPct:       0.40,
  membershipRewardPct: 0.30,
  governanceRewardPct: 0.20,
  reservedPct:         0.10,
} as const;

// ── Referral mechanic (Phase 6 — SHIP CONDITIONAL) ──────────────────────────
// Source: BRZA_ALLOCATION.referral (50M, 5%). Independent of BRZA_EMISSION.
//
// Council ruling 2026-06-19 (filings: kofi 351d, zara 18f8, nia 4c43, seku f025):
//   * Kofi cond 4(c): monthly sub-cap REQUIRED. Set here.
//   * Kofi cond 4(a): identity-continuity is PARTIAL. Phase 6 ships TIME-LIMITED
//     at Phase 0 ($0.02). Must NOT persist into IDO ($0.10) without Celo G$
//     or Soroban credential live. Enforced via `priceCeilingPhase`.
//   * Zara: 500/250 payout split (referrer/referee). Sybil dues floor KES 650
//     routes to product separately. Per-wallet cap 5/12-month rolling.
//   * Zara signal `referral_velocity_breach`: pause + human review at >5/30d.
//   * Seku: family-ring vector requires PAYMENT_PHONE_HASH_PEPPER dedup ACTIVE
//     before launch. See `requiresPepperDedupActive`.
//   * Nia: referrer progress signal required (UX, not payout). See
//     `components/ReferralProgress.tsx`.

export const BRZA_REFERRAL = {
  bucketTokens:                  BRZA_ALLOCATION.referral,
  // Conservative ceiling. Plateau drain modelled by Zara at ~27K BRZA/month;
  // this cap gives ~833 months runway and ~7x headroom vs the model.
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
// Source: barazaTvCreators pool (30M) + subscription/tip revenue

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

export const BRZA_TVL_TARGETS = {
  stellarPool: 50_000,
  solanaPool:  200_000,
  ido:         500_000,
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
  const elapsed = daysSinceTge - v.cliffDays;
  return Math.floor(v.tokens * Math.min(1, elapsed / v.vestingDays));
}
