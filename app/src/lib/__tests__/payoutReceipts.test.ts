import { describe, expect, it } from 'vitest';
import { buildPayoutReceiptCsv, buildPayoutReceiptRows } from '@/lib/payoutReceipts';

describe('payout receipt export', () => {
  it('marks missing payout transaction references without leaking private member fields', () => {
    const sourceWithPrivateFields = {
      payoutId: 'ORD-1',
      communityName: 'Kibera Youth Collective',
      amountKes: 15000,
      status: 'PAYMENT_PENDING',
      reviewer: null,
      transactionReference: '',
      reviewedAt: null,
      memberPhone: '+254700000000',
      memberEmail: 'member@example.com',
    };
    const csv = buildPayoutReceiptCsv([sourceWithPrivateFields]);

    expect(csv).toContain('ORD-1,Kibera Youth Collective,15000,PAYMENT_PENDING,UNREVIEWED,MISSING,MISSING');
    expect(csv).not.toContain('+254700000000');
    expect(csv).not.toContain('member@example.com');
  });

  it('exports completed payout amount, status, reviewer, and transaction reference', () => {
    const [row] = buildPayoutReceiptRows([
      {
        payoutId: 'ORD-2',
        communityName: 'Mama Mboga Association',
        amountKes: 5000,
        status: 'completed',
        reviewer: 'Kofi Treasury',
        transactionReference: 'stellar:abc123',
        reviewedAt: '2026-07-05 08:00 UTC',
      },
    ]);

    expect(row).toEqual({
      receiptId: 'ORD-2',
      communityName: 'Mama Mboga Association',
      amountKes: 5000,
      status: 'COMPLETED',
      reviewer: 'Kofi Treasury',
      transactionReference: 'stellar:abc123',
      reviewedAt: '2026-07-05 08:00 UTC',
    });
  });
});
