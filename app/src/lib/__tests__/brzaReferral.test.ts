import { describe, expect, it } from 'vitest';
import {
  BRZA_ALLOCATION,
  BRZA_EMISSION,
  BRZA_REFERRAL,
  referralPayoutBlockedReason,
} from '@/lib/brza/constants';

describe('BRZA_EMISSION — double-draw fixed', () => {
  it('no longer carries a referralPct field', () => {
    expect((BRZA_EMISSION as Record<string, unknown>).referralPct).toBeUndefined();
  });

  it('exposes reservedPct in place of referralPct', () => {
    expect(BRZA_EMISSION.reservedPct).toBe(0.10);
  });

  it('sub-pool percentages still sum to 1.0', () => {
    const sum =
      BRZA_EMISSION.bountyPoolPct +
      BRZA_EMISSION.membershipRewardPct +
      BRZA_EMISSION.governanceRewardPct +
      BRZA_EMISSION.reservedPct;
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe('BRZA_REFERRAL constants — council ruling', () => {
  it('bucketTokens equals the 50M Referral allocation', () => {
    expect(BRZA_REFERRAL.bucketTokens).toBe(BRZA_ALLOCATION.referral);
    expect(BRZA_REFERRAL.bucketTokens).toBe(50_000_000);
  });

  it('payout split is 500 / 250 per Zara filing', () => {
    expect(BRZA_REFERRAL.payoutReferrerTokens).toBe(500);
    expect(BRZA_REFERRAL.payoutRefereeTokens).toBe(250);
  });

  it('gate is 90 days + 3 payments', () => {
    expect(BRZA_REFERRAL.gateMinDaysActive).toBe(90);
    expect(BRZA_REFERRAL.gateMinPaymentsMade).toBe(3);
  });

  it('per-referrer cap is 5 in rolling 12 months (Zara cond 2)', () => {
    expect(BRZA_REFERRAL.maxPairsPerReferrerRolling12mo).toBe(5);
  });

  it('velocity breach signal trips at >5 pairs / 30 days (Zara signal)', () => {
    expect(BRZA_REFERRAL.velocityBreachPairsPer30d).toBe(5);
  });

  it('price ceiling is phase0 per Kofi cond 4a', () => {
    expect(BRZA_REFERRAL.priceCeilingPhase).toBe('phase0');
  });

  it('requires pepper dedup active before any payout (Seku)', () => {
    expect(BRZA_REFERRAL.requiresPepperDedupActive).toBe(true);
  });

  it('ships with empty multisig signers (Kofi cond 4d unresolved at ship)', () => {
    expect(BRZA_REFERRAL.multiSigSignersWallets).toEqual([]);
  });
});

describe('referralPayoutBlockedReason — runtime guard', () => {
  const baseClearArgs = {
    currentPhase: 'phase0' as const,
    paymentPhoneHashPepperConfigured: true,
    monthlyDisbursedTokens: 0,
  };

  it('would clear when all four conditions are satisfied — except 4d ships empty', () => {
    // Kofi cond 4d (named multisig) ships unsatisfied per the council ruling,
    // so the guard correctly blocks even when the rest is clear.
    expect(referralPayoutBlockedReason(baseClearArgs)).toBe(
      'referral_disabled_multisig_signers_unnamed',
    );
  });

  it('blocks on phase above phase0 (Kofi cond 4a)', () => {
    expect(
      referralPayoutBlockedReason({ ...baseClearArgs, currentPhase: 'launch' }),
    ).toBe('referral_disabled_above_phase0_until_identity_continuity_live');
    expect(
      referralPayoutBlockedReason({ ...baseClearArgs, currentPhase: 'seed' }),
    ).toBe('referral_disabled_above_phase0_until_identity_continuity_live');
  });

  it('blocks when pepper dedup is not configured (Seku)', () => {
    expect(
      referralPayoutBlockedReason({
        ...baseClearArgs,
        paymentPhoneHashPepperConfigured: false,
      }),
    ).toBe('referral_disabled_pepper_dedup_not_configured');
  });

  it('blocks when monthly sub-cap is exhausted (Kofi cond 4c)', () => {
    expect(
      referralPayoutBlockedReason({
        ...baseClearArgs,
        monthlyDisbursedTokens: BRZA_REFERRAL.monthlySubCapTokens,
      }),
    ).toBe('referral_monthly_sub_cap_exhausted');
  });

  it('phase ceiling takes precedence over sub-cap', () => {
    expect(
      referralPayoutBlockedReason({
        currentPhase: 'launch',
        paymentPhoneHashPepperConfigured: true,
        monthlyDisbursedTokens: 999_999_999,
      }),
    ).toBe('referral_disabled_above_phase0_until_identity_continuity_live');
  });

  it('identity continuity live lifts the phase ceiling (still blocked on 4d signers)', () => {
    expect(
      referralPayoutBlockedReason({
        ...baseClearArgs,
        currentPhase: 'launch',
        identityContinuityLive: true,
      }),
    ).toBe('referral_disabled_multisig_signers_unnamed');
  });

  it('identity continuity live without pepper still blocks on Seku', () => {
    expect(
      referralPayoutBlockedReason({
        ...baseClearArgs,
        currentPhase: 'launch',
        identityContinuityLive: true,
        paymentPhoneHashPepperConfigured: false,
      }),
    ).toBe('referral_disabled_pepper_dedup_not_configured');
  });
});
