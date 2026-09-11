// app/src/lib/adapters/clearing/IClearingRailAdapter.ts
// Standard: S&P 500 Enterprise Fintech (Strict Typing, BigInt Minor Units)
// Reference: CR-007 Delivery Specification & Theoretical Solution Specification v3.0 §4.1

export type ClearingRailType =
  | 'OFF_CHAIN_KES'
  | 'ON_CHAIN_STELLAR'
  | 'ON_CHAIN_SOLANA'
  | 'CUSTODIAL_ESCROW'
  | 'SAFE_SOROBAN';

export interface ClearingIntent {
  intentId: string;
  communityId: string;
  orderId: string;
  sourceAccount: string;
  destinationAccount: string;
  amountMinor: bigint;
  currency: string;
  memo?: string;
  metadata?: Record<string, unknown>;
}

export interface ClearingResult {
  success: boolean;
  intentId: string;
  railType: ClearingRailType;
  txHash?: string;
  externalReference?: string;
  clearedAmountMinor: bigint;
  feeMinor: bigint;
  status: 'SETTLED' | 'PENDING' | 'FAILED';
  failureReason?: string;
  timestamp: number;
}

export interface DisbursementIntent {
  disbursementId: string;
  communityId: string;
  proposalId?: string;
  recipientAddress: string;
  amountMinor: bigint;
  currency: string;
  memo?: string;
}

export interface DisbursementResult {
  success: boolean;
  disbursementId: string;
  txHash?: string;
  settledAt: number;
  failureReason?: string;
}

export interface IClearingRailAdapter {
  readonly railType: ClearingRailType;

  /**
   * Clears inbound funds into community escrow or settlement pool.
   */
  clearInbound(intent: ClearingIntent): Promise<ClearingResult>;

  /**
   * Executes outbound disbursement from community treasury/escrow.
   */
  disburse(intent: DisbursementIntent): Promise<DisbursementResult>;

  /**
   * Verifies on-chain or custodial balance of the treasury.
   */
  getBalance(accountAddress: string, currency: string): Promise<bigint>;
}
