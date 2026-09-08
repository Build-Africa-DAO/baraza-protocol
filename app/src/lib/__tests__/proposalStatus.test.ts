import { describe, expect, it } from 'vitest';
import type { ProposalLifecycleStage } from '@/lib/constants';
import { STAGE_META, inferStage, proposalBucket } from '@/lib/proposalStatus';

const ALL_STAGES: ProposalLifecycleStage[] = [
  'pending',
  'active',
  'defeated',
  'succeeded',
  'queued',
  'executed',
  'expired',
  'canceled',
  'vetoed',
  'tied',
  'tied_extended',
];

describe('STAGE_META', () => {
  it('covers all lifecycle stages', () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_META[stage]).toBeDefined();
    }
  });

  it('marks active and tied_extended as votable', () => {
    for (const stage of ALL_STAGES) {
      const expected = stage === 'active' || stage === 'tied_extended';
      expect(STAGE_META[stage].votable).toBe(expected);
    }
  });

  it('marks terminal stages correctly', () => {
    expect(STAGE_META.defeated.terminal).toBe(true);
    expect(STAGE_META.executed.terminal).toBe(true);
    expect(STAGE_META.expired.terminal).toBe(true);
    expect(STAGE_META.canceled.terminal).toBe(true);
    expect(STAGE_META.vetoed.terminal).toBe(true);
    expect(STAGE_META.tied.terminal).toBe(true);
    expect(STAGE_META.tied_extended.terminal).toBe(false);
  });

  it('marks pending, active, succeeded, queued as non-terminal', () => {
    expect(STAGE_META.pending.terminal).toBe(false);
    expect(STAGE_META.active.terminal).toBe(false);
    expect(STAGE_META.succeeded.terminal).toBe(false);
    expect(STAGE_META.queued.terminal).toBe(false);
  });

  it('provides a non-empty label and icon for every stage', () => {
    for (const stage of ALL_STAGES) {
      const meta = STAGE_META[stage];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon).toBeDefined();
      expect(meta.className.length).toBeGreaterThan(0);
    }
  });
});

describe('inferStage', () => {
  it('maps "completed" -> "executed"', () => {
    expect(inferStage('completed')).toBe('executed');
  });

  it('maps "failed" -> "defeated"', () => {
    expect(inferStage('failed')).toBe('defeated');
  });

  it('maps "active" -> "active"', () => {
    expect(inferStage('active')).toBe('active');
  });

  it('maps "tied" -> "tied"', () => {
    expect(inferStage('tied')).toBe('tied');
  });

  it('falls back to "pending" for unknown values (safer than surfacing vote buttons on mystery state)', () => {
    expect(inferStage('weird-state')).toBe('pending');
    expect(inferStage('')).toBe('pending');
  });
});

describe('proposalBucket', () => {
  it('groups succeeded and queued as passed', () => {
    expect(proposalBucket({ status: 'passed' })).toBe('passed');
    expect(proposalBucket({ status: 'active', lifecycleStage: 'queued' })).toBe('passed');
  });

  it('groups completed as executed and failed as rejected', () => {
    expect(proposalBucket({ status: 'completed' })).toBe('executed');
    expect(proposalBucket({ status: 'failed' })).toBe('rejected');
  });

  it('keeps tied votes in their own bucket', () => {
    expect(proposalBucket({ status: 'failed', lifecycleStage: 'tied' })).toBe('tied');
  });
});
