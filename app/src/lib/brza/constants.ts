import { getPublicEnv } from '@/lib/env';

const _publicEnv = getPublicEnv();
const _stellarNetwork = _publicEnv.VITE_STELLAR_NETWORK;
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
  network: _stellarNetwork as 'testnet' | 'mainnet',
  horizonUrl: _publicEnv.VITE_STELLAR_HORIZON_URL,
} as const;

// ── Price phases ────────────────────────────────────────────────────────────

export type BrzaPhase = 'phase0' | 'launch' | 'market';

export const BRZA_PHASES = {
  phase0: { priceUsd: 0.02,  label: 'Phase 0 — Community Seed' },
  launch: { priceUsd: 0.10,  label: 'IDO Launch' },
  market: { priceUsd: 0,     label: 'Market' },
} as const satisfies Record<BrzaPhase, { priceUsd: number; label: string }>;

export const CURRENT_PHASE: BrzaPhase = 'phase0';

// ── Token allocation ────────────────────────────────────────────────────────

export const BRZA_ALLOCATION = {
  communityRewards: 200_000_000,
  founderA:          75_000_000,
  founderB:          75_000_000,
  operations:       150_000_000,
  publicSale:       120_000_000,
  reserve:          100_000_000,
  liquidityPool:     80_000_000,
  referral:          80_000_000,
  grants:            70_000_000,
  events:            50_000_000,
} as const;

// ── Vesting schedule ────────────────────────────────────────────────────────
// cliffDays: tokens locked until this many days post-TGE
// vestingDays: linear release period after cliff

export const BRZA_VESTING = {
  founderA:   { cliffDays: 365, vestingDays: 730,  tokens: BRZA_ALLOCATION.founderA },
  founderB:   { cliffDays: 365, vestingDays: 730,  tokens: BRZA_ALLOCATION.founderB },
  operations: { cliffDays:   0, vestingDays: 1095, tokens: BRZA_ALLOCATION.operations },
  reserve:    { cliffDays: 180, vestingDays: 1095, tokens: BRZA_ALLOCATION.reserve },
} as const;

// ── Community reward emission ───────────────────────────────────────────────

export const BRZA_EMISSION = {
  total:               BRZA_ALLOCATION.communityRewards,
  monthlyCapTokens:    2_000_000,
  bountyPoolPct:       0.40,
  membershipRewardPct: 0.30,
  governanceRewardPct: 0.20,
  referralPct:         0.10,
} as const;

// ── Fees ────────────────────────────────────────────────────────────────────

export const BRZA_FEES = {
  treasuryTxPct: 0.02,
  swapPct:       0.005,
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
