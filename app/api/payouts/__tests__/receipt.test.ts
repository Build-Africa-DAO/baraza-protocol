import { describe, expect, it } from 'vitest';
import { buildPayoutReceipt, toCsv, type PayoutReceipt } from '../receipt';

describe('buildPayoutReceipt — completed payout state', () => {
  it('maps amount, status, reviewer, and transaction reference through unchanged', () => {
    const receipt = buildPayoutReceipt({
      payout_id: 'payout_123',
      community_id: 'community_abc',
      amount: 500,
      currency: 'KES',
      status: 'completed',
      reviewer: 'admin@brza.org',
      transaction_reference: 'txn_ref_789',
      created_at: '2024-01-01T00:00:00.000Z',
      approved_at: '2024-01-02T00:00:00.000Z',
    });

    expect(receipt).toEqual({
      payoutId: 'payout_123',
      communityId: 'community_abc',
      amount: 500,
      currency: 'KES',
      status: 'completed',
      reviewer: 'admin@brza.org',
      transactionReference: 'txn_ref_789',
      createdAt: '2024-01-01T00:00:00.000Z',
      approvedAt: '2024-01-02T00:00:00.000Z',
    });
  });
});

describe('buildPayoutReceipt — missing/pending payout state', () => {
  it('defaults reviewer and transaction reference when unset', () => {
    const receipt = buildPayoutReceipt({
      payout_id: 'payout_456',
      community_id: 'community_abc',
      amount: 250,
      currency: 'KES',
      status: 'pending',
      reviewer: null,
      transaction_reference: null,
      created_at: '2024-01-01T00:00:00.000Z',
      approved_at: null,
    });

    expect(receipt.reviewer).toBe('unassigned');
    expect(receipt.transactionReference).toBe('pending');
    expect(receipt.approvedAt).toBeNull();
  });
});

describe('buildPayoutReceipt — private data filtering', () => {
  it('never exposes member wallet address or id hash even when present on the row', () => {
    const receipt = buildPayoutReceipt({
      payout_id: 'payout_789',
      community_id: 'community_abc',
      amount: 100,
      currency: 'KES',
      status: 'approved',
      reviewer: 'admin@brza.org',
      transaction_reference: 'txn_ref_001',
      created_at: '2024-01-01T00:00:00.000Z',
      approved_at: '2024-01-01T12:00:00.000Z',
      member_wallet_address: 'GSECRETWALLETADDRESSSHOULDNOTLEAK',
      member_id_hash: 'abc123hashshouldnotleak',
    } as never);

    const serialized = JSON.stringify(receipt);
    expect(serialized).not.toContain('GSECRETWALLETADDRESSSHOULDNOTLEAK');
    expect(serialized).not.toContain('abc123hashshouldnotleak');
    expect(Object.keys(receipt).sort()).toEqual(
      [
        'amount',
        'approvedAt',
        'communityId',
        'createdAt',
        'currency',
        'payoutId',
        'reviewer',
        'status',
        'transactionReference',
      ].sort(),
    );
  });
});

describe('toCsv — receipt rendering', () => {
  const completedReceipt: PayoutReceipt = {
    payoutId: 'payout_123',
    communityId: 'community_abc',
    amount: 500,
    currency: 'KES',
    status: 'completed',
    reviewer: 'admin@brza.org',
    transactionReference: 'txn_ref_789',
    createdAt: '2024-01-01T00:00:00.000Z',
    approvedAt: '2024-01-02T00:00:00.000Z',
  };

  it('renders a header row and a value row for a completed payout', () => {
    const csv = toCsv(completedReceipt);
    const [headerLine, valueLine] = csv.split('\n');

    expect(headerLine).toBe(
      '"Payout ID","Community ID","Amount","Currency","Status","Reviewer","Transaction Reference","Created At","Approved At"',
    );
    expect(valueLine).toBe(
      '"payout_123","community_abc","500","KES","completed","admin@brza.org","txn_ref_789","2024-01-01T00:00:00.000Z","2024-01-02T00:00:00.000Z"',
    );
  });

  it('renders an empty Approved At cell for a pending/missing payout', () => {
    const pendingReceipt: PayoutReceipt = {
      ...completedReceipt,
      status: 'pending',
      reviewer: 'unassigned',
      transactionReference: 'pending',
      approvedAt: null,
    };

    const csv = toCsv(pendingReceipt);
    const [, valueLine] = csv.split('\n');

    expect(valueLine).toContain('"unassigned"');
    expect(valueLine).toContain('"pending"');
    expect(valueLine.endsWith('""')).toBe(true);
  });

  it('escapes embedded quotes so CSV consumers do not misparse fields', () => {
    const receiptWithQuotes: PayoutReceipt = {
      ...completedReceipt,
      reviewer: 'admin "lead" reviewer',
    };

    const csv = toCsv(receiptWithQuotes);
    expect(csv).toContain('"admin ""lead"" reviewer"');
  });
});
