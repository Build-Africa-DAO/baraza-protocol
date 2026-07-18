import { describe, expect, it } from 'vitest';

import { buildKnowledgeGraph } from '@/lib/knowledgeGraph';

describe('Akili capability knowledge', () => {
  it('includes platform capability status and disclosure metadata', () => {
    const graph = buildKnowledgeGraph({
      communities: [],
      proposals: [],
      bounties: [],
      memberships: [],
      paymentOrders: [],
      now: '2026-07-18T00:00:00.000Z',
    });
    const bankRails = graph.nodes.find((node) => node.id === 'capability:bank-rails');

    expect(bankRails).toMatchObject({
      type: 'capability',
      label: 'Bank payments',
      status: 'gated',
      summary: 'Bank payments are not available yet.',
      metadata: {
        enabled: false,
        technicalName: 'Bank rail abstraction',
      },
    });
    expect(bankRails?.metadata?.technicalDescription).toContain('remain disabled');
    expect(bankRails?.metadata?.blockers).toContain('Sign a partner agreement');
  });

  it('never marks sensitive production capabilities as enabled', () => {
    const graph = buildKnowledgeGraph({
      communities: [],
      proposals: [],
      bounties: [],
      memberships: [],
      paymentOrders: [],
    });
    const sensitive = ['bank-rails', 'group-withdrawals', 'transaction-fee-billing'];

    sensitive.forEach((id) => {
      const node = graph.nodes.find((candidate) => candidate.id === `capability:${id}`);
      expect(node?.status).toBe('gated');
      expect(node?.metadata?.enabled).toBe(false);
    });
  });
});
