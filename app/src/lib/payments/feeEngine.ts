/**
 * Pure, deterministic fee calculation engine for Baraza Protocol.
 * Conforms to SAD v1.1 §2.2, Holy Grail §8 (Addendum 2 Item 6), Launch Memo 3 §4,
 * and Executive Launch Directives (Motomoto Approval September 2026).
 *
 * Rules:
 *   1. Launch platform fee is 1.5% (150 bps) on money movement (rounded half-up).
 *   2. Internal intra-ledger transfers between Baraza accounts carry a 0% platform fee.
 *   3. Outbound vault disbursements have a 1.5% platform fee unless internal.
 *   4. Safaricom Paybill collection cost is 0.5% (capped at KES 200 / 20,000 cents),
 *      and free for transactions strictly under KES 200 (20,000 cents).
 *   5. First-time member account activation fee is KES 100 (10,000 cents) across Baraza,
 *      charged only once on the member's first financial transaction.
 *   6. Zero-fee communities bypass fee calculation and yield zero total.
 *   7. All monetary outputs are strictly non-negative integer minor units.
 */

export const LAUNCH_PLATFORM_FEE_BPS = 150; // 1.50%
export const MEMBER_FIRST_TIME_ACTIVATION_FEE_MINOR = 10000; // KES 100.00

export interface DynamicFeeOptions {
  /** Whether carrier collection cost is added to total (default true). */
  carrierPassThrough?: boolean;
  /** Whether this is an internal transfer between Baraza accounts (0% platform fee, 0 carrier cost). */
  isInternal?: boolean;
  /** Whether the member has already activated their global Baraza protocol account. If false, KES 100 fee applies. */
  isProtocolActivated?: boolean;
  /** Explicitly include the one-time KES 100 member activation fee. */
  includeMemberActivation?: boolean;
  /** Custom platform fee rate in basis points (default 150 = 1.5%). */
  customFeeBps?: number;
}

export interface FeeBreakdown {
  /** Base community activation fee or dues in minor units (e.g. cents). */
  baseAmountMinor: number;
  /** 1.5% launch platform fee in minor units. */
  platformFeeMinor: number;
  /** Carrier collection cost in minor units. */
  carrierCostMinor: number;
  /** One-time KES 100 member account activation fee in minor units (0 if already activated or free). */
  activationFeeMinor: number;
  /** Total expected amount to be paid by member in minor units. */
  totalExpectedMinor: number;
  /** Net amount credited to the community treasury in minor units. */
  netCreditedMinor: number;
  /** Currency code (e.g. 'KES'). */
  currency: string;
  /** Whether the community is completely free of activation dues. */
  isFree: boolean;
}

/**
 * Determines if a community is zero-fee / free based on its fee config.
 */
export function isZeroFee(baseAmountMinor: number, feeType?: string): boolean {
  if (!Number.isFinite(baseAmountMinor) || baseAmountMinor <= 0) return true;
  if (feeType === 'free') return true;
  return false;
}

/**
 * Calculates itemized dynamic fee breakdown for an inbound dues contribution or disbursement.
 *
 * @param baseAmountMinor Base dues in integer minor currency units (e.g. 50,000 cents = KES 500).
 * @param currency Default 'KES'.
 * @param carrierPassThrough Whether carrier collection cost is added to total (default true).
 * @param options Additional routing and activation fee options.
 */
export function calculateDynamicFee(
  baseAmountMinor: number,
  currency = 'KES',
  carrierPassThrough: boolean | DynamicFeeOptions = true,
  options?: DynamicFeeOptions,
): FeeBreakdown {
  // Normalize options for backward compatibility with legacy (amount, currency, boolean) calls
  const opts: DynamicFeeOptions = typeof carrierPassThrough === 'object' && carrierPassThrough !== null
    ? carrierPassThrough
    : {
        carrierPassThrough: Boolean(carrierPassThrough),
        ...(options ?? {}),
      };

  const safeBase = Number.isFinite(baseAmountMinor) && baseAmountMinor > 0
    ? Math.floor(baseAmountMinor)
    : 0;

  if (safeBase === 0) {
    return {
      baseAmountMinor: 0,
      platformFeeMinor: 0,
      carrierCostMinor: 0,
      activationFeeMinor: 0,
      totalExpectedMinor: 0,
      netCreditedMinor: 0,
      currency: currency.toUpperCase(),
      isFree: true,
    };
  }

  // Internal transfers between Baraza accounts carry 0% platform fee and 0 carrier cost
  if (opts.isInternal) {
    return {
      baseAmountMinor: safeBase,
      platformFeeMinor: 0,
      carrierCostMinor: 0,
      activationFeeMinor: 0,
      totalExpectedMinor: safeBase,
      netCreditedMinor: safeBase,
      currency: currency.toUpperCase(),
      isFree: false,
    };
  }

  // 1.5% launch platform fee (150 bps) (Round-Half-Up)
  const feeBps = typeof opts.customFeeBps === 'number' && Number.isFinite(opts.customFeeBps)
    ? Math.max(0, Math.floor(opts.customFeeBps))
    : LAUNCH_PLATFORM_FEE_BPS;
  const platformFeeMinor = Math.round((safeBase * feeBps) / 10000);

  // Safaricom Paybill Pass-Through: 0.5% capped at KES 200 (20,000 cents), free under KES 200 (20,000 cents)
  let carrierCostMinor = 0;
  const shouldPassCarrier = opts.carrierPassThrough !== false;
  if (shouldPassCarrier && currency.toUpperCase() === 'KES') {
    if (safeBase >= 20000) {
      carrierCostMinor = Math.min(Math.round(safeBase * 0.005), 20000);
    }
  }

  // One-time KES 100 member account activation fee
  const needsActivation = opts.includeMemberActivation === true || opts.isProtocolActivated === false;
  const activationFeeMinor = needsActivation ? MEMBER_FIRST_TIME_ACTIVATION_FEE_MINOR : 0;

  const totalExpectedMinor = safeBase + platformFeeMinor + carrierCostMinor + activationFeeMinor;
  const netCreditedMinor = safeBase;

  return {
    baseAmountMinor: safeBase,
    platformFeeMinor,
    carrierCostMinor,
    activationFeeMinor,
    totalExpectedMinor,
    netCreditedMinor,
    currency: currency.toUpperCase(),
    isFree: false,
  };
}

/**
 * Formats integer minor currency units to major display string (e.g. 51250 cents -> "512.50").
 */
export function formatMinorToMajor(amountMinor: number): string {
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) return '0.00';
  return (Math.floor(amountMinor) / 100).toFixed(2);
}
