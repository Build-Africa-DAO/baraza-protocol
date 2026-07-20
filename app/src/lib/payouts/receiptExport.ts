/**
 * Admin payout receipt export (issue #28).
 *
 * Produces a durable, downloadable receipt for approved/paid community
 * payouts without private member data (no phone, email, legal name, or
 * M-Pesa provider payloads).
 */

import type { Bounty, BountyStatus } from '@/lib/bounties';

/** Statuses that represent approved community payouts. */
export const RECEIPT_ELIGIBLE_STATUSES: readonly BountyStatus[] = ['awarded', 'paid'] as const;

export interface PayoutReceipt {
  /** Stable receipt id (derived from bounty id). */
  receiptId: string;
  bountyId: string;
  communityId: string;
  title: string;
  /** Amount in KES (reconciliation unit of record). */
  amountKes: number;
  /** Settlement token label when known. */
  rewardToken: string;
  status: BountyStatus;
  /** Reviewer / poster identity as already public on the board. */
  reviewer: string;
  /** Public contributor handle when assigned; never phone/email. */
  contributorPublic: string;
  /** On-chain or rail transaction reference when present. */
  transactionReference: string;
  deadline: string;
  category: string;
  exportedAt: string;
}

export interface ReceiptExportOptions {
  /** ISO timestamp for exportedAt; defaults to now. */
  exportedAt?: string;
  /** Restrict to one community id. */
  communityId?: string;
  /** Override eligible statuses (defaults to awarded + paid). */
  statuses?: readonly BountyStatus[];
}

const CSV_HEADERS = [
  'receipt_id',
  'bounty_id',
  'community_id',
  'title',
  'amount_kes',
  'reward_token',
  'status',
  'reviewer',
  'contributor_public',
  'transaction_reference',
  'deadline',
  'category',
  'exported_at',
] as const;

function csvEscape(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Strip accidental private-looking fields. Public handles only.
 * Empty when missing — never invent PII.
 */
export function publicContributorLabel(assignee?: string): string {
  const raw = (assignee ?? '').trim();
  if (!raw) return '';
  // Reject obvious phone / email shapes so exports stay non-sensitive.
  if (/@/.test(raw)) return '';
  if (/^\+?\d[\d\s\-()]{6,}$/.test(raw)) return '';
  return raw;
}

export function isReceiptEligible(
  bounty: Pick<Bounty, 'status'>,
  statuses: readonly BountyStatus[] = RECEIPT_ELIGIBLE_STATUSES,
): boolean {
  return statuses.includes(bounty.status);
}

export function buildPayoutReceipt(
  bounty: Bounty,
  options: { exportedAt?: string } = {},
): PayoutReceipt | null {
  if (!isReceiptEligible(bounty)) return null;

  const exportedAt = options.exportedAt ?? new Date().toISOString();
  const hasTx = Boolean(bounty.payoutTxHash && bounty.payoutTxHash.trim());

  return {
    receiptId: `rcpt_${bounty.id}`,
    bountyId: bounty.id,
    communityId: bounty.communityId,
    title: bounty.title,
    amountKes: bounty.rewardKes,
    rewardToken: bounty.rewardToken ?? 'KES',
    status: bounty.status,
    reviewer: bounty.postedBy,
    contributorPublic: publicContributorLabel(bounty.assignee),
    // Explicit missing state for incomplete payouts (acceptance: missing + completed).
    transactionReference: hasTx ? bounty.payoutTxHash!.trim() : 'PENDING',
    deadline: bounty.deadline,
    category: bounty.category,
    exportedAt,
  };
}

export function listPayoutReceipts(
  bounties: Bounty[],
  options: ReceiptExportOptions = {},
): PayoutReceipt[] {
  const statuses = options.statuses ?? RECEIPT_ELIGIBLE_STATUSES;
  const exportedAt = options.exportedAt ?? new Date().toISOString();

  return bounties
    .filter((b) => isReceiptEligible(b, statuses))
    .filter((b) => !options.communityId || b.communityId === options.communityId)
    .map((b) => buildPayoutReceipt(b, { exportedAt }))
    .filter((r): r is PayoutReceipt => r !== null)
    .sort((a, b) => a.receiptId.localeCompare(b.receiptId));
}

export function receiptsToCsv(receipts: PayoutReceipt[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of receipts) {
    lines.push(
      [
        r.receiptId,
        r.bountyId,
        r.communityId,
        r.title,
        r.amountKes,
        r.rewardToken,
        r.status,
        r.reviewer,
        r.contributorPublic,
        r.transactionReference,
        r.deadline,
        r.category,
        r.exportedAt,
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}

export function receiptsToJson(receipts: PayoutReceipt[]): string {
  return JSON.stringify(
    {
      format: 'baraza-payout-receipt-v1',
      count: receipts.length,
      receipts,
    },
    null,
    2,
  );
}

/** Trigger a browser download of CSV (or JSON) receipt export. */
export function downloadReceiptExport(
  content: string,
  filename: string,
  mime: string = 'text/csv;charset=utf-8',
): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function defaultReceiptFilename(format: 'csv' | 'json' = 'csv'): string {
  const day = new Date().toISOString().slice(0, 10);
  return `baraza-payout-receipts-${day}.${format}`;
}
