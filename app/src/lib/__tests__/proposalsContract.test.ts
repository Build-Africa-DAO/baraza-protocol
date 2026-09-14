import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProposal, decisionFromProposalRow, stageFromProposalStatus, type ProposalRow } from '@/lib/proposals';
import { proposalBucket, STAGE_META } from '@/lib/proposalStatus';
import { activityFromAuditRow, describeAuditAction } from '@/lib/activity';
import { nextPollDelay, POLL_FAST_MS, POLL_SLOW_MS } from '@/lib/polling';
import { inviteErrorCopy } from '@/lib/inviteAccept';
import { normalizeApiError } from '@/lib/api';
import { PAYOUT_STEPS, partsNeeded, payoutStepIndex, tranchePlan } from '@/lib/payouts';

afterEach(() => {
  vi.unstubAllGlobals();
});

const row: ProposalRow = {
  id: 'prop_1',
  community_id: 'c1',
  title: 'Buy a kiosk',
  description: 'For the market stall.',
  kind: 'treasury',
  status: 'active',
  created_by: 'GABC',
  starts_at: '2026-09-01T00:00:00Z',
  ends_at: '2026-09-08T00:00:00Z',
  for_votes: 3,
  against_votes: 1,
  abstain_votes: 0,
  snapshot_member_count: 10,
  quorum_threshold_bps: 2000,
  funding_amount_minor: 1250000,
  tie_extended: false,
  execution_status: 'pending',
  created_at: '2026-09-01T00:00:00Z',
};

describe('proposals from the public table', () => {
  it('maps a row to the Decision the screens read, in major units', () => {
    const decision = decisionFromProposalRow(row);
    expect(decision.fundingAmount).toBe(12500);
    expect(decision.votesFor).toBe(3);
    expect(decision.totalMembers).toBe(10);
    expect(decision.lifecycleStage).toBe('active');
    expect(decision.status).toBe('active');
    expect(decision.voters).toEqual({});
  });

  it('maps every server status to a stage and a bucket', () => {
    const cases: Array<[string, string, string]> = [
      ['active', 'active', 'active'],
      ['tied_extended', 'tied_extended', 'active'],
      ['passed', 'succeeded', 'passed'],
      ['queued', 'queued', 'passed'],
      ['executed', 'executed', 'executed'],
      ['failed', 'defeated', 'rejected'],
      ['tied', 'tied', 'tied'],
      ['cancelled', 'canceled', 'rejected'],
      ['draft', 'pending', 'active'],
    ];
    for (const [status, stage, bucket] of cases) {
      expect(stageFromProposalStatus(status)).toBe(stage);
      expect(proposalBucket(decisionFromProposalRow({ ...row, status }))).toBe(bucket);
    }
  });

  it('labels the 48-hour extension the way the product asked', () => {
    expect(STAGE_META.tied_extended.label).toBe('Tie (48h Extension)');
  });

  it('posts the create contract and returns the new decision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ ok: true, proposalId: 'prop_9', status: 'active', snapshotMemberCount: 12, startsAt: '2026-09-10T00:00:00Z', endsAt: '2026-09-17T00:00:00Z' }, { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await createProposal({ communityId: 'c1', proposer: 'GABC', title: 'T', description: 'D', fundingAmountMinor: 500000, votingPeriodDays: 7, quorumPct: 51 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.id).toBe('prop_9');
      expect(result.decision.totalMembers).toBe(12);
    }
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({ communityId: 'c1', kind: 'treasury', fundingAmountMinor: 500000, votingPeriodDays: 7, quorumThresholdBps: 5100 });
  });
});

describe('activity from audit logs', () => {
  it('turns backend actions into member sentences', () => {
    expect(describeAuditAction({ id: '1', community_id: 'c', actor_wallet: 'GABCDEFGHIJK', action_type: 'INVITE_CREATED', target_subject: null, details: null, created_at: '2026-09-01T00:00:00Z' }).message).toMatch(/created an invite link/);
    const joined = activityFromAuditRow({ id: '2', community_id: 'c', actor_wallet: null, action_type: 'MEMBER_JOINED_VIA_INVITE', target_subject: 'GXYZ1234567890', details: null, created_at: '2026-09-01T00:00:00Z' });
    expect(joined.type).toBe('member_joined');
    expect(joined.message).toMatch(/joined with an invite/);
    expect(describeAuditAction({ id: '3', community_id: 'c', actor_wallet: null, action_type: 'OFFICER_ASSIGNED', target_subject: 'GQ', details: { newRole: 'treasurer' }, created_at: '2026-09-01T00:00:00Z' }).message).toMatch(/made an treasurer|made an officer/);
  });
});

describe('polling cadence', () => {
  it('polls fast for the first minute and slowly after', () => {
    const start = 1_000_000;
    expect(nextPollDelay(start, start + 10_000)).toBe(POLL_FAST_MS);
    expect(nextPollDelay(start, start + 59_999)).toBe(POLL_FAST_MS);
    expect(nextPollDelay(start, start + 60_000)).toBe(POLL_SLOW_MS);
  });
});

describe('invite error copy', () => {
  it('explains 404, 410 and 429 in plain words', () => {
    expect(inviteErrorCopy(normalizeApiError(404, { error: 'not_found' }))).toMatch(/does not exist/);
    expect(inviteErrorCopy(normalizeApiError(410, { error: 'expired' }))).toMatch(/expired/);
    expect(inviteErrorCopy(normalizeApiError(410, { error: 'capacity_exhausted' }))).toMatch(/used up/);
    expect(inviteErrorCopy(normalizeApiError(429, { error: 'rate_limited' }))).toMatch(/Wait a minute/);
  });
});

describe('payout plan and tracker', () => {
  it('splits above the telco ceiling into parts that sum exactly', () => {
    const amount = 62_500_000; // KES 625,000
    expect(partsNeeded(amount, 'KES')).toBe(3);
    const plan = tranchePlan(amount, 'KES');
    expect(plan).toHaveLength(3);
    expect(plan.reduce((a, b) => a + b, 0)).toBe(amount);
    expect(Math.max(...plan)).toBeLessThanOrEqual(25_000_000);
    expect(tranchePlan(1_000, 'UGX')).toEqual([1_000]);
  });

  it('honours the server ceiling when it differs from the default', () => {
    const plan = tranchePlan(30_000_000, 'KES', 10_000_000);
    expect(plan).toEqual([10_000_000, 10_000_000, 10_000_000]);
  });

  it('maps the real statuses onto the three steps', () => {
    expect(PAYOUT_STEPS).toHaveLength(3);
    expect(payoutStepIndex('OFFRAMP_INITIATED')).toBe(0);
    expect(payoutStepIndex('PROVIDER_PENDING_VERIFICATION')).toBe(1);
    expect(payoutStepIndex('SETTLED')).toBe(3);
    expect(payoutStepIndex('FAILED')).toBe(1);
  });
});
