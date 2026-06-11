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
// WARNING — SOURCE DISCREPANCY (2026-06-08):
// The Notion product spec table sums to 1,100,000,000 (110%), not 1B.
// Buckets affected: ecosystemGrants 17%, communityRewards 18%, events 5%,
// reserve 5%, liquidityPool 10% — together with the others they exceed supply.
// TODO: reconcile Notion allocation before changing this file.
// Until resolved, the existing allocation below is authoritative.

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
// Flows: join reward · vote reward · proposal reward · bounty payout · referral

export const BRZA_EMISSION = {
  total:               BRZA_ALLOCATION.communityRewards,
  monthlyCapTokens:    2_000_000,
  bountyPoolPct:       0.40,
  membershipRewardPct: 0.30,
  governanceRewardPct: 0.20,
  referralPct:         0.10,
} as const;

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
