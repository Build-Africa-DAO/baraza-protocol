export type PayoutAsset = 'USDC' | 'USDT' | 'G$';

export type BountyPayoutStatus =
  | 'awaiting_approval'
  | 'ready'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface PayoutApproval {
  approver: string;
  approvedAt: string;
}

export interface BountyPayout {
  id: string;
  bountyId: string;
  communityId: string;
  submissionId: string;
  recipientWallet: string;
  recipientName: string;
  amountKes: number;
  asset: PayoutAsset;
  assetAmount: string | null;
  requiredApprovals: number;
  approvals: PayoutApproval[];
  status: BountyPayoutStatus;
  idempotencyKey: string;
  txHash?: string;
  explorerUrl?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface PublicPayoutReceipt {
  payoutId: string;
  bountyId: string;
  communityId: string;
  amountKes: number;
  asset: PayoutAsset;
  assetAmount: string | null;
  recipientWallet: string;
  approvalCount: number;
  txHash: string;
  explorerUrl?: string;
  paidAt: string;
}

const STORAGE_KEY = 'baraza.bountyPayouts.v1';
const PAYOUT_ASSETS: readonly PayoutAsset[] = ['USDC', 'USDT', 'G$'];

export const PAYOUT_ASSET_DETAILS: Record<PayoutAsset, { label: string; stable: boolean; description: string }> = {
  USDC: { label: 'USDC by Circle', stable: true, description: 'Recommended stable payout asset.' },
  USDT: { label: 'USDT by Tether', stable: true, description: 'Available only on supported settlement rails.' },
  'G$': { label: 'G$ by GoodDollar', stable: false, description: 'Optional community asset; value may change.' },
};

function readPayouts(): BountyPayout[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePayouts(payouts: BountyPayout[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payouts));
}

function replacePayout(next: BountyPayout): BountyPayout {
  const payouts = readPayouts();
  const index = payouts.findIndex((item) => item.id === next.id);
  if (index < 0) payouts.unshift(next);
  else payouts[index] = next;
  writePayouts(payouts);
  return next;
}

export function listBountyPayouts(): BountyPayout[] {
  return readPayouts().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBountyPayout(bountyId: string): BountyPayout | null {
  return readPayouts().find((payout) => payout.bountyId === bountyId) ?? null;
}

export function createBountyPayoutRequest(input: {
  bountyId: string;
  communityId: string;
  submissionId: string;
  recipientWallet: string;
  recipientName: string;
  amountKes: number;
  asset?: PayoutAsset;
  requiredApprovals?: number;
  idempotencyKey?: string;
}): BountyPayout {
  const asset = input.asset ?? 'USDC';
  const requiredApprovals = input.requiredApprovals ?? 2;
  const recipientWallet = input.recipientWallet.trim();
  const idempotencyKey = input.idempotencyKey ?? `bounty:${input.bountyId}:submission:${input.submissionId}`;

  if (!input.bountyId.trim() || !input.communityId.trim() || !input.submissionId.trim()) {
    throw new Error('Bounty, community, and submission are required for payout.');
  }
  if (!recipientWallet) throw new Error('A recipient wallet is required before payout approval.');
  if (!Number.isFinite(input.amountKes) || input.amountKes <= 0) throw new Error('Payout amount must be greater than zero.');
  if (!PAYOUT_ASSETS.includes(asset)) throw new Error('Unsupported payout asset.');
  if (!Number.isInteger(requiredApprovals) || requiredApprovals < 1 || requiredApprovals > 10) {
    throw new Error('Required approvals must be between 1 and 10.');
  }

  const existing = readPayouts().find((payout) => payout.idempotencyKey === idempotencyKey);
  if (existing) return existing;

  const now = new Date().toISOString();
  return replacePayout({
    id: `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    bountyId: input.bountyId,
    communityId: input.communityId,
    submissionId: input.submissionId,
    recipientWallet,
    recipientName: input.recipientName.trim() || 'Contributor',
    amountKes: input.amountKes,
    asset,
    assetAmount: null,
    requiredApprovals,
    approvals: [],
    status: 'awaiting_approval',
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  });
}

export function approveBountyPayout(payoutId: string, approver: string): BountyPayout {
  const payout = readPayouts().find((item) => item.id === payoutId);
  if (!payout) throw new Error('Payout request not found.');
  if (payout.status !== 'awaiting_approval' && payout.status !== 'ready') {
    throw new Error('This payout is not accepting approvals.');
  }
  const normalizedApprover = approver.trim();
  if (!normalizedApprover) throw new Error('Approver account is required.');
  if (payout.approvals.some((approval) => approval.approver === normalizedApprover)) return payout;

  const approvals = [...payout.approvals, { approver: normalizedApprover, approvedAt: new Date().toISOString() }];
  const now = new Date().toISOString();
  return replacePayout({
    ...payout,
    approvals,
    status: approvals.length >= payout.requiredApprovals ? 'ready' : 'awaiting_approval',
    updatedAt: now,
  });
}

export function markBountyPayoutProcessing(payoutId: string, assetAmount: string): BountyPayout {
  const payout = readPayouts().find((item) => item.id === payoutId);
  if (!payout) throw new Error('Payout request not found.');
  if (payout.status !== 'ready') throw new Error('Multisig approval threshold has not been reached.');
  if (!assetAmount.trim() || Number(assetAmount) <= 0) throw new Error('A valid settlement amount is required.');
  return replacePayout({ ...payout, assetAmount: assetAmount.trim(), status: 'processing', updatedAt: new Date().toISOString() });
}

export function confirmBountyPayout(input: {
  payoutId: string;
  txHash: string;
  explorerUrl?: string;
}): BountyPayout {
  const payout = readPayouts().find((item) => item.id === input.payoutId);
  if (!payout) throw new Error('Payout request not found.');
  if (payout.status !== 'processing') throw new Error('Only a submitted payout can be confirmed.');
  if (!input.txHash.trim()) throw new Error('A settlement transaction hash is required.');
  const now = new Date().toISOString();
  return replacePayout({
    ...payout,
    status: 'paid',
    txHash: input.txHash.trim(),
    explorerUrl: input.explorerUrl?.trim() || undefined,
    paidAt: now,
    updatedAt: now,
  });
}

export function failBountyPayout(payoutId: string, reason: string): BountyPayout {
  const payout = readPayouts().find((item) => item.id === payoutId);
  if (!payout) throw new Error('Payout request not found.');
  if (payout.status === 'paid' || payout.status === 'cancelled') throw new Error('A completed payout cannot be failed.');
  return replacePayout({
    ...payout,
    status: 'failed',
    failureReason: reason.trim() || 'Settlement failed.',
    updatedAt: new Date().toISOString(),
  });
}

export function toPublicPayoutReceipt(payout: BountyPayout): PublicPayoutReceipt | null {
  if (payout.status !== 'paid' || !payout.txHash || !payout.paidAt) return null;
  return {
    payoutId: payout.id,
    bountyId: payout.bountyId,
    communityId: payout.communityId,
    amountKes: payout.amountKes,
    asset: payout.asset,
    assetAmount: payout.assetAmount,
    recipientWallet: payout.recipientWallet,
    approvalCount: payout.approvals.length,
    txHash: payout.txHash,
    explorerUrl: payout.explorerUrl,
    paidAt: payout.paidAt,
  };
}
