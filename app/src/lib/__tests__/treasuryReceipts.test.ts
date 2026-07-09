import { describe, expect, it } from 'vitest';
import { CHAINS } from '@/lib/chain';
import { createTreasuryReceiptExport, canExportTreasuryReceipt } from '@/lib/treasuryReceipts';

const chainMeta = CHAINS.solana;

describe('treasury receipt exports', () => {
  it('builds a downloadable receipt for approved payouts with a transaction reference', () => {
    const record = {
      proposalId: 'PROP-039',
      purpose: 'Q4 welfare payout',
      amountKes: 150000,
      status: 'approved' as const,
      reviewer: 'Amara N.',
      txReference: '4xkL...p9Qr',
      approvedAt: '2026-07-02T10:30:00.000Z',
    };

    expect(canExportTreasuryReceipt(record)).toBe(true);

    const receipt = createTreasuryReceiptExport(record, chainMeta);
    expect(receipt).not.toBeNull();
    expect(receipt?.filename).toBe('prop-039-payout-receipt.json');
    expect(receipt?.content).toContain('"status": "Approved"');
    expect(receipt?.content).toContain('"reviewer": "Amara N."');
    expect(receipt?.content).toContain('"transactionReference": "4xkL...p9Qr"');
  });

  it('returns no export when the payout is still missing approval or transaction data', () => {
    const record = {
      proposalId: 'PROP-035',
      purpose: 'Training workshop',
      amountKes: 30000,
      status: 'pending' as const,
      reviewer: 'Nia O.',
    };

    expect(canExportTreasuryReceipt(record)).toBe(false);
    expect(createTreasuryReceiptExport(record, chainMeta)).toBeNull();
  });
});
