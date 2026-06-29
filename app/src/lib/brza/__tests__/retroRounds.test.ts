import { describe, expect, it } from 'vitest';
import {
  allocateRetroRound,
  computeVoterWeight,
  computeWeeklyRetroPool,
  validateBallot,
  type RetroVote,
  type VoterProfile,
} from '../retroRounds';

describe('computeWeeklyRetroPool', () => {
  it('returns 0 for a community with no members', () => {
    expect(computeWeeklyRetroPool(0, 1000)).toEqual(0);
  });

  it('returns 0 when the protocol-wide denominator is 0', () => {
    expect(computeWeeklyRetroPool(50, 0)).toEqual(0);
  });

  it('scales linearly with the community share', () => {
    const small = computeWeeklyRetroPool(50, 10_000);
    const large = computeWeeklyRetroPool(500, 10_000);
    expect(large).toBeGreaterThan(small);
    // 10x members → ~10x pool (within floor rounding).
    expect(large / small).toBeGreaterThan(9);
  });

  it('respects the monthly cap × governance share / 4.33', () => {
    // Single community holds the entire protocol's active membership.
    const pool = computeWeeklyRetroPool(1000, 1000);
    // monthlyCap=2M × 0.20 governance share = 400K; /4.33 ≈ 92,378.
    expect(pool).toBeGreaterThan(92_000);
    expect(pool).toBeLessThan(93_000);
  });
});

describe('computeVoterWeight', () => {
  const base: VoterProfile = {
    wallet: 'w1',
    isActiveMember: true,
    duesStreakMonths: 0,
    voteStreakMultiplier: 1.0,
  };

  it('returns 0 when the member is not active', () => {
    expect(computeVoterWeight({ ...base, isActiveMember: false })).toEqual(0);
  });

  it('returns 1.0 for a brand-new active member with no streaks or badges', () => {
    expect(computeVoterWeight(base)).toEqual(1);
  });

  it('caps the dues streak at 12 months', () => {
    const twelve = computeVoterWeight({ ...base, duesStreakMonths: 12 });
    const twenty = computeVoterWeight({ ...base, duesStreakMonths: 20 });
    expect(twelve).toEqual(twenty);
  });

  it('clamps the vote-streak multiplier to [1.0, 1.5]', () => {
    const floor = computeVoterWeight({ ...base, voteStreakMultiplier: 0.5 });
    const baseline = computeVoterWeight({ ...base, voteStreakMultiplier: 1.0 });
    expect(floor).toEqual(baseline);

    const capped = computeVoterWeight({ ...base, voteStreakMultiplier: 5.0 });
    const cap = computeVoterWeight({ ...base, voteStreakMultiplier: 1.5 });
    expect(capped).toEqual(cap);
  });

  it('applies the veteran badge bonus multiplicatively', () => {
    const noBadge = computeVoterWeight(base);
    const withBadge = computeVoterWeight({ ...base, hasVeteranBadge: true });
    expect(withBadge / noBadge).toBeCloseTo(1.15, 5);
  });

  it('caps the total weight at 3.0', () => {
    const maxed = computeVoterWeight({
      ...base,
      duesStreakMonths: 24,
      voteStreakMultiplier: 1.5,
      hasVeteranBadge: true,
      hasQuorumKeeperBadge: true,
    });
    expect(maxed).toEqual(3.0);
  });
});

describe('validateBallot', () => {
  it('rejects a ballot whose weights do not sum to 100', () => {
    const result = validateBallot({
      roundId: 'r1',
      voterWallet: 'w1',
      allocations: { 'w2': 50, 'w3': 40 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('sum'))).toBe(true);
  });

  it('rejects a ballot allocating to self', () => {
    const result = validateBallot({
      roundId: 'r1',
      voterWallet: 'w1',
      allocations: { 'w1': 50, 'w2': 50 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('themselves'))).toBe(true);
  });

  it('rejects an empty ballot', () => {
    const result = validateBallot({
      roundId: 'r1',
      voterWallet: 'w1',
      allocations: {},
    });
    expect(result.valid).toBe(false);
  });

  it('accepts a clean ballot', () => {
    const result = validateBallot({
      roundId: 'r1',
      voterWallet: 'w1',
      allocations: { 'w2': 60, 'w3': 40 },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects non-integer weights', () => {
    const result = validateBallot({
      roundId: 'r1',
      voterWallet: 'w1',
      allocations: { 'w2': 50.5, 'w3': 49.5 },
    });
    expect(result.valid).toBe(false);
  });
});

describe('allocateRetroRound', () => {
  const baseProfile = (wallet: string): VoterProfile => ({
    wallet,
    isActiveMember: true,
    duesStreakMonths: 0,
    voteStreakMultiplier: 1.0,
  });

  it('returns empty for a zero pool', () => {
    expect(allocateRetroRound({ poolBrza: 0 }, [], new Map())).toEqual([]);
  });

  it('returns empty when no votes exist', () => {
    expect(allocateRetroRound({ poolBrza: 1000 }, [], new Map())).toEqual([]);
  });

  it('splits pool: 30% baseline equal across voters, 70% by vote share', () => {
    const profiles = new Map([
      ['w1', baseProfile('w1')],
      ['w2', baseProfile('w2')],
      ['w3', baseProfile('w3')],
    ]);
    const votes: RetroVote[] = [
      { roundId: 'r1', voterWallet: 'w1', allocations: { 'w2': 100 } },
      { roundId: 'r1', voterWallet: 'w2', allocations: { 'w3': 100 } },
      { roundId: 'r1', voterWallet: 'w3', allocations: { 'w2': 100 } },
    ];
    const allocations = allocateRetroRound({ poolBrza: 1000 }, votes, profiles);

    // 3 voters, baseline pool = 300, each voter gets 100 baseline.
    // Multiplier pool = 700. w2 has 2/3 of weighted votes, w3 has 1/3.
    // w2 → 700 * 2/3 = 466 + 100 baseline (since w2 voted) = 566.
    // w3 → 700 * 1/3 = 233 + 100 baseline = 333.
    // w1 voted but got no peer votes → 100 baseline only.

    const w1 = allocations.find((a) => a.recipientWallet === 'w1');
    const w2 = allocations.find((a) => a.recipientWallet === 'w2');
    const w3 = allocations.find((a) => a.recipientWallet === 'w3');

    expect(w1?.brzaAllocated).toEqual(100);
    expect(w2?.brzaAllocated).toBeGreaterThanOrEqual(566);
    expect(w3?.brzaAllocated).toBeGreaterThanOrEqual(333);
    // Sorted descending.
    expect(allocations[0].recipientWallet).toEqual('w2');
  });

  it('silently filters self-votes', () => {
    const profiles = new Map([
      ['w1', baseProfile('w1')],
      ['w2', baseProfile('w2')],
    ]);
    const votes: RetroVote[] = [
      // w1 tries to vote partially for themselves
      { roundId: 'r1', voterWallet: 'w1', allocations: { 'w1': 50, 'w2': 50 } },
    ];
    const allocations = allocateRetroRound({ poolBrza: 1000 }, votes, profiles);
    // w1's self-vote is filtered; w2 gets the full multiplier share.
    const w2 = allocations.find((a) => a.recipientWallet === 'w2');
    expect(w2?.multiplierBrza).toBeGreaterThan(600);
    // w1 still gets baseline since they cast a non-empty ballot. Only one
    // baseline-eligible voter, so they receive the whole baseline pool.
    const w1 = allocations.find((a) => a.recipientWallet === 'w1');
    expect(w1?.baselineBrza).toEqual(300);
  });

  it('weights long-streak voters more heavily than new voters', () => {
    const profiles = new Map<string, VoterProfile>([
      [
        'veteran',
        {
          wallet: 'veteran',
          isActiveMember: true,
          duesStreakMonths: 12,
          voteStreakMultiplier: 1.5,
          hasVeteranBadge: true,
          hasQuorumKeeperBadge: true,
        },
      ],
      [
        'newcomer',
        { wallet: 'newcomer', isActiveMember: true, duesStreakMonths: 0, voteStreakMultiplier: 1.0 },
      ],
      ['recipient', baseProfile('recipient')],
      ['other', baseProfile('other')],
    ]);
    // Veteran votes for 'recipient', newcomer votes for 'other'.
    const votes: RetroVote[] = [
      { roundId: 'r1', voterWallet: 'veteran', allocations: { recipient: 100 } },
      { roundId: 'r1', voterWallet: 'newcomer', allocations: { other: 100 } },
    ];
    const allocations = allocateRetroRound({ poolBrza: 1000 }, votes, profiles);
    const recipient = allocations.find((a) => a.recipientWallet === 'recipient');
    const other = allocations.find((a) => a.recipientWallet === 'other');
    // Recipient gets ~3x the multiplier share that other gets, because the
    // veteran weight is capped at 3.0 and the newcomer is 1.0.
    expect(recipient!.multiplierBrza).toBeGreaterThan(other!.multiplierBrza * 2);
  });

  it('drops sub-1-BRZA dust and redistributes among survivors', () => {
    const profiles = new Map<string, VoterProfile>();
    const votes: RetroVote[] = [];
    // 100 voters all voting evenly across each other → micro shares
    for (let i = 0; i < 100; i++) {
      const wallet = `w${i}`;
      profiles.set(wallet, baseProfile(wallet));
    }
    // Every voter spreads their 100 weight across the first 50 others
    // (with 2pp each) — creates micro-shares.
    for (let i = 0; i < 100; i++) {
      const ballot: Record<string, number> = {};
      for (let j = 0; j < 50; j++) {
        if (`w${j}` !== `w${i}`) ballot[`w${j}`] = 2;
      }
      // Ensure sum is exactly 100
      const sum = Object.values(ballot).reduce((s, v) => s + v, 0);
      if (sum < 100) {
        const remainingKey = Object.keys(ballot)[0];
        ballot[remainingKey] += 100 - sum;
      }
      votes.push({ roundId: 'r1', voterWallet: `w${i}`, allocations: ballot });
    }
    const allocations = allocateRetroRound({ poolBrza: 200 }, votes, profiles);
    // Pool is tiny relative to 100 voters; sub-1 BRZA allocations should be
    // dropped. Survivors must all have ≥1 BRZA.
    for (const a of allocations) {
      expect(a.brzaAllocated).toBeGreaterThanOrEqual(1);
    }
  });
});
