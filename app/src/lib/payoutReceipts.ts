export type PayoutReceiptStatus = 'pending' | 'approved' | 'completed' | 'failed' | 'missing';

export interface PayoutReceiptSource {
  payoutId: string;
  communityName: string;
  amountKes: number;
  status: PayoutReceiptStatus | string;
  reviewer: string | null;
  transactionReference?: string | null;
  reviewedAt?: string | null;
}

export interface PayoutReceiptRow {
  receiptId: string;
  communityName: string;
  amountKes: number;
  status: string;
  reviewer: string;
  transactionReference: string;
  reviewedAt: string;
}

const CSV_HEADERS = [
  'receipt_id',
  'community',
  'amount_kes',
  'status',
  'reviewer',
  'transaction_reference',
  'reviewed_at',
] as const;

function canonicalStatus(status: string): string {
  return status.trim().toUpperCase().replace(/[\s-]+/g, '_') || 'MISSING';
}

function safeCell(value: string | number): string {
  const cell = String(value);
  if (!/[",\n\r]/.test(cell)) return cell;
  return `"${cell.replace(/"/g, '""')}"`;
}

export function buildPayoutReceiptRows(receipts: PayoutReceiptSource[]): PayoutReceiptRow[] {
  return receipts.map((receipt) => ({
    receiptId: receipt.payoutId,
    communityName: receipt.communityName,
    amountKes: receipt.amountKes,
    status: canonicalStatus(receipt.status),
    reviewer: receipt.reviewer?.trim() || 'UNREVIEWED',
    transactionReference: receipt.transactionReference?.trim() || 'MISSING',
    reviewedAt: receipt.reviewedAt?.trim() || 'MISSING',
  }));
}

export function buildPayoutReceiptCsv(receipts: PayoutReceiptSource[]): string {
  const rows = buildPayoutReceiptRows(receipts).map((row) => [
    row.receiptId,
    row.communityName,
    row.amountKes,
    row.status,
    row.reviewer,
    row.transactionReference,
    row.reviewedAt,
  ]);

  return [
    CSV_HEADERS.join(','),
    ...rows.map((row) => row.map(safeCell).join(',')),
  ].join('\n');
}
