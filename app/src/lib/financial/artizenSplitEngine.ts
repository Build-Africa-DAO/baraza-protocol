// app/src/lib/financial/artizenSplitEngine.ts
// Subsystem: Artizen Campaign Split Engine & Invariant I5 Conservation
// Standard: S&P 500 Enterprise Fintech (Strict BigInt, Zero Floating Point, Provable Bounds)
// Governing Invariant:
//   - I5: totalRaisedMinor === platformFeeMinor + treasuryNetMinor (Drift == 0n)
//   - 64-bit Numeric Bounds: 0 <= totalRaisedMinor <= 10^15 minor units (KES 10 Trillion)

export interface ArtizenSplitResult {
  totalRaisedMinor: bigint;
  platformFeeMinor: bigint;
  treasuryNetMinor: bigint;
  platformFeeBps: number;
  drift: bigint;
}

export const MAX_ARTIZEN_RAISED_MINOR = 1_000_000_000_000_000n; // 10^15 minor units

/**
 * Computes the atomic revenue split between Artizen/Baraza platform and community treasury.
 * Enforces floor integer division and allocates remainder to the community treasury,
 * mathematically guaranteeing zero drift (I5).
 */
export function calculateArtizenSplit(
  totalRaisedMinor: bigint,
  platformFeeBps = 500
): ArtizenSplitResult {
  if (totalRaisedMinor < 0n) {
    throw new RangeError('totalRaisedMinor cannot be negative');
  }

  if (totalRaisedMinor > MAX_ARTIZEN_RAISED_MINOR) {
    throw new RangeError(
      `totalRaisedMinor exceeds 10^15 minor unit ceiling: ${totalRaisedMinor.toString()}`
    );
  }

  if (platformFeeBps < 0 || platformFeeBps > 5000) {
    throw new RangeError(
      `platformFeeBps must be between 0 and 5000 (0% to 50%), received ${platformFeeBps}`
    );
  }

  const bpsBigInt = BigInt(platformFeeBps);
  // Floor integer division
  const platformFeeMinor = (totalRaisedMinor * bpsBigInt) / 10000n;
  // Residue assigned to treasury
  const treasuryNetMinor = totalRaisedMinor - platformFeeMinor;

  // Formal proof of conservation: drift is mathematically 0n
  const drift = totalRaisedMinor - (platformFeeMinor + treasuryNetMinor);

  return {
    totalRaisedMinor,
    platformFeeMinor,
    treasuryNetMinor,
    platformFeeBps,
    drift,
  };
}

/**
 * Validates whether a proposed disbursement/settlement satisfies the statutory liquidity reserve.
 * Invariant I-SASRA-1: SLR >= minimumReserveRatioBps (default 1500 bps = 15%).
 */
export function validateStatutoryLiquidityReserve(
  availableLiquidityMinor: bigint,
  withdrawableDepositsMinor: bigint,
  minimumReserveRatioBps = 1500
): { compliant: boolean; requiredReserveMinor: bigint; shortfallMinor: bigint } {
  if (withdrawableDepositsMinor <= 0n) {
    return { compliant: true, requiredReserveMinor: 0n, shortfallMinor: 0n };
  }

  const ratioBigInt = BigInt(minimumReserveRatioBps);
  const requiredReserveMinor = (withdrawableDepositsMinor * ratioBigInt) / 10000n;

  if (availableLiquidityMinor >= requiredReserveMinor) {
    return { compliant: true, requiredReserveMinor, shortfallMinor: 0n };
  }

  return {
    compliant: false,
    requiredReserveMinor,
    shortfallMinor: requiredReserveMinor - availableLiquidityMinor,
  };
}
