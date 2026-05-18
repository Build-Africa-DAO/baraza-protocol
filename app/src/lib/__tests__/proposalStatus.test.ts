import { describe, expect, it } from 'vitest';
import type { ProposalLifecycleStage } from '@/lib/constants';
import { STAGE_META, inferStage } from '@/lib/proposalStatus';

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
];

describe('STAGE_META', () => {
  it('covers all 9 lifecycle stages', () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_META[stage]).toBeDefined();
    }
  });

  it('marks ONLY active as votable', () => {
    for (const stage of ALL_STAGES) {
      const expected = stage === 'active';
      expect(STAGE_META[stage].votable).toBe(expected);
    }
  });

  it('marks defeated, executed, expired, canceled, vetoed as terminal', () => {
    expect(STAGE_META.defeated.terminal).toBe(true);
    expect(STAGE_META.executed.terminal).toBe(true);
    expect(STAGE_META.expired.terminal).toBe(true);
    expect(STAGE_META.canceled.terminal).toBe(true);
    expect(STAGE_META.vetoed.terminal).toBe(true);
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

  it('falls back to "pending" for unknown values (safer than surfacing vote buttons on mystery state)', () => {
    expect(inferStage('weird-state')).toBe('pending');
    expect(inferStage('')).toBe('pending');
  });
});
