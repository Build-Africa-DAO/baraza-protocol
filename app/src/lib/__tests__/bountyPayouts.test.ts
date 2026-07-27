import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveBountyPayout,
  confirmBountyPayout,
  createBountyPayoutRequest,
  getBountyPayout,
  markBountyPayoutProcessing,
  toPublicPayoutReceipt,
} from '@/lib/bountyPayouts';

describe('bounty payouts', () => {
  beforeEach(() => window.localStorage.clear());

  it('creates one idempotent USDC payout request per approved submission', () => {
    const input = {
      bountyId: 'bounty-1',
      communityId: 'community-1',
      submissionId: 'submission-1',
      recipientWallet: 'GDESTINATION',
      recipientName: 'Amina',
      amountKes: 13000,
    };
    const first = createBountyPayoutRequest(input);
    const second = createBountyPayoutRequest(input);

    expect(second.id).toBe(first.id);
    expect(first.asset).toBe('USDC');
    expect(first.status).toBe('awaiting_approval');
  });

  it('requires the configured approval threshold before settlement', () => {
    const payout = createBountyPayoutRequest({
      bountyId: 'bounty-1',
      communityId: 'community-1',
      submissionId: 'submission-1',
      recipientWallet: 'GDESTINATION',
      recipientName: 'Amina',
      amountKes: 13000,
      requiredApprovals: 2,
    });

    expect(approveBountyPayout(payout.id, 'signer-1').status).toBe('awaiting_approval');
    expect(approveBountyPayout(payout.id, 'signer-2').status).toBe('ready');
  });

  it('publishes a receipt only after settlement confirmation', () => {
    const payout = createBountyPayoutRequest({
      bountyId: 'bounty-1',
      communityId: 'community-1',
      submissionId: 'submission-1',
      recipientWallet: 'GDESTINATION',
      recipientName: 'Amina',
      amountKes: 13000,
      requiredApprovals: 1,
    });
    const ready = approveBountyPayout(payout.id, 'signer-1');
    expect(toPublicPayoutReceipt(ready)).toBeNull();

    const processing = markBountyPayoutProcessing(ready.id, '100.00');
    const paid = confirmBountyPayout({ payoutId: processing.id, txHash: 'tx-123', explorerUrl: 'https://example.test/tx-123' });

    expect(getBountyPayout('bounty-1')?.status).toBe('paid');
    expect(toPublicPayoutReceipt(paid)).toMatchObject({ asset: 'USDC', txHash: 'tx-123', approvalCount: 1 });
  });

  it('rejects requests without a recipient wallet', () => {
    expect(() => createBountyPayoutRequest({
      bountyId: 'bounty-1',
      communityId: 'community-1',
      submissionId: 'submission-1',
      recipientWallet: '',
      recipientName: 'Amina',
      amountKes: 13000,
    })).toThrow(/recipient wallet/i);
  });
});
