import type { ChainMeta } from '@/lib/chain';
import { formatRailAmountFromKes, formatRailDateTime } from '@/lib/utils';

export type TreasuryPayoutStatus = 'approved' | 'pending';

export interface TreasuryPayoutRecord {
  proposalId: string;
  purpose: string;
  amountKes: number;
  status: TreasuryPayoutStatus;
  reviewer: string;
  txReference?: string;
  approvedAt?: string;
}

export interface TreasuryReceiptExport {
  filename: string;
  mimeType: string;
  content: string;
}

export function canExportTreasuryReceipt(record: TreasuryPayoutRecord): boolean {
  return record.status === 'approved' && Boolean(record.txReference?.trim());
}

export function createTreasuryReceiptExport(
  record: TreasuryPayoutRecord,
  chainMeta: ChainMeta,
): TreasuryReceiptExport | null {
  if (!canExportTreasuryReceipt(record)) return null;

  const approvedAt = record.approvedAt ?? new Date().toISOString();
  const payload = {
    receiptType: 'community-payout',
    proposalId: record.proposalId,
    purpose: record.purpose,
    amount: formatRailAmountFromKes(record.amountKes, chainMeta),
    status: 'Approved',
    reviewer: record.reviewer,
    transactionReference: record.txReference,
    approvedAt: formatRailDateTime(approvedAt, chainMeta),
  };

  return {
    filename: `${record.proposalId.toLowerCase()}-payout-receipt.json`,
    mimeType: 'application/json',
    content: `${JSON.stringify(payload, null, 2)}\n`,
  };
}

export function downloadTreasuryReceipt(
  record: TreasuryPayoutRecord,
  chainMeta: ChainMeta,
): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;

  const receipt = createTreasuryReceiptExport(record, chainMeta);
  if (!receipt) return false;

  const blob = new Blob([receipt.content], { type: receipt.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = receipt.filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
