import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCommunitySetupDraft,
  loadCommunitySetupDraft,
  saveCommunitySetupDraft,
} from '@/lib/communityDraft';

const draft = {
  step: 'decisions' as const,
  form: {
    name: 'Umoja SACCO',
    type: 'sacco',
    fee: '2000',
    description: 'Member savings and welfare support',
    phone: '0712345678',
    quorum: '60',
    approvalThreshold: '75',
    votingPeriod: '14',
    treasuryPolicy: 'manual-review',
  },
  paymentMethod: 'mpesa' as const,
  addPaybill: false,
  addUssd: true,
  walletChain: 'stellar',
};

describe('community setup draft', () => {
  beforeEach(() => window.localStorage.clear());

  it('saves and restores guided setup progress', () => {
    saveCommunitySetupDraft(draft);
    expect(loadCommunitySetupDraft()).toMatchObject(draft);
    expect(loadCommunitySetupDraft()?.updatedAt).toEqual(expect.any(String));
  });

  it('clears a completed setup', () => {
    saveCommunitySetupDraft(draft);
    clearCommunitySetupDraft();
    expect(loadCommunitySetupDraft()).toBeNull();
  });

  it('ignores malformed local data', () => {
    window.localStorage.setItem('baraza.community-setup-draft.v1', '{not-json');
    expect(loadCommunitySetupDraft()).toBeNull();
  });
});
