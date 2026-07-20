import { describe, expect, it } from 'vitest';
import type { Bounty } from '@/lib/bounties';
import {
  buildPayoutReceipt,
  isReceiptEligible,
  listPayoutReceipts,
  publicContributorLabel,
  receiptsToCsv,
  receiptsToJson,
} from '@/lib/payouts/receiptExport';

function bounty(partial: Partial<Bounty> & Pick<Bounty, 'id' | 'status'>): Bounty {
  return {
    communityId: '1',
    title: 'Test bounty',
    category: 'Dev',
    rewardKes: 1000,
    deadline: '2026-07-01',
    submissions: 1,
    postedBy: 'Community Admin',
    summary: 'summary',
    skills: ['TS'],
    ...partial,
  };
}

describe('publicContributorLabel', () => {
  it('keeps public display names', () => {
    expect(publicContributorLabel('David K.')).toBe('David K.');
  });

  it('strips email and phone shapes', () => {
    expect(publicContributorLabel('user@example.com')).toBe('');
    expect(publicContributorLabel('+254712345678')).toBe('');
    expect(publicContributorLabel('0712 345 678')).toBe('');
  });
});

describe('isReceiptEligible', () => {
  it('includes awarded and paid only by default', () => {
    expect(isReceiptEligible(bounty({ id: 'a', status: 'paid' }))).toBe(true);
    expect(isReceiptEligible(bounty({ id: 'b', status: 'awarded' }))).toBe(true);
    expect(isReceiptEligible(bounty({ id: 'c', status: 'open' }))).toBe(false);
    expect(isReceiptEligible(bounty({ id: 'd', status: 'in_review' }))).toBe(false);
  });
});

describe('buildPayoutReceipt', () => {
  it('returns null for non-approved statuses (missing payout state)', () => {
    expect(buildPayoutReceipt(bounty({ id: 'open-1', status: 'open' }))).toBeNull();
  });

  it('builds a completed receipt with transaction reference', () => {
    const receipt = buildPayoutReceipt(
      bounty({
        id: 'paid-1',
        status: 'paid',
        assignee: 'David K.',
        payoutTxHash: '5xTxHashExample',
        rewardToken: 'SOL',
      }),
      { exportedAt: '2026-07-20T12:00:00.000Z' },
    );

    expect(receipt).toMatchObject({
      receiptId: 'rcpt_paid-1',
      bountyId: 'paid-1',
      amountKes: 1000,
      rewardToken: 'SOL',
      status: 'paid',
      reviewer: 'Community Admin',
      contributorPublic: 'David K.',
      transactionReference: '5xTxHashExample',
      exportedAt: '2026-07-20T12:00:00.000Z',
    });
  });

  it('marks missing transaction as PENDING for awarded without hash', () => {
    const receipt = buildPayoutReceipt(
      bounty({ id: 'awarded-1', status: 'awarded', assignee: 'Amara T.' }),
      { exportedAt: '2026-07-20T12:00:00.000Z' },
    );
    expect(receipt?.transactionReference).toBe('PENDING');
    expect(receipt?.status).toBe('awarded');
  });
});

describe('listPayoutReceipts + serialization', () => {
  const rows: Bounty[] = [
    bounty({ id: 'open', status: 'open' }),
    bounty({
      id: 'paid',
      status: 'paid',
      assignee: 'David K.',
      payoutTxHash: 'tx-paid',
      communityId: '3',
    }),
    bounty({ id: 'awarded', status: 'awarded', communityId: '2' }),
  ];

  it('lists only eligible receipts', () => {
    const receipts = listPayoutReceipts(rows, { exportedAt: '2026-07-20T00:00:00.000Z' });
    expect(receipts).toHaveLength(2);
    expect(receipts.map((r) => r.bountyId).sort()).toEqual(['awarded', 'paid']);
  });

  it('filters by community', () => {
    const receipts = listPayoutReceipts(rows, {
      communityId: '3',
      exportedAt: '2026-07-20T00:00:00.000Z',
    });
    expect(receipts).toHaveLength(1);
    expect(receipts[0].bountyId).toBe('paid');
  });

  it('serializes CSV with headers and escaped titles', () => {
    const receipts = listPayoutReceipts(
      [bounty({ id: 'paid', status: 'paid', title: 'Hello, "world"', payoutTxHash: 'tx1' })],
      { exportedAt: '2026-07-20T00:00:00.000Z' },
    );
    const csv = receiptsToCsv(receipts);
    expect(csv.startsWith('receipt_id,bounty_id,')).toBe(true);
    expect(csv).toContain('"Hello, ""world"""');
    expect(csv).toContain('tx1');
  });

  it('serializes JSON envelope', () => {
    const receipts = listPayoutReceipts(
      [bounty({ id: 'paid', status: 'paid', payoutTxHash: 'tx1' })],
      { exportedAt: '2026-07-20T00:00:00.000Z' },
    );
    const parsed = JSON.parse(receiptsToJson(receipts));
    expect(parsed.format).toBe('baraza-payout-receipt-v1');
    expect(parsed.count).toBe(1);
    expect(parsed.receipts[0].receiptId).toBe('rcpt_paid');
  });
});
