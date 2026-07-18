import { beforeEach, describe, expect, it } from 'vitest';
import { resolveAkiliCapability, AKILI_CAPABILITIES } from '@/lib/akiliCapabilities';
import { addProposalThreadMessage } from '@/lib/proposalThreads';
import { listBounties, updateBountyStatus } from '@/lib/bounties';
import { dataStore } from '@/lib/dataStore';

const context = () => ({
  communities: dataStore.getAllCommunities(),
  decisions: dataStore.getAllDecisions(),
  bounties: listBounties(),
});

describe('Akili Phase 1 capabilities', () => {
  beforeEach(() => window.localStorage.clear());

  it('contains read-only capabilities only', () => {
    expect(AKILI_CAPABILITIES.every((capability) => capability.access === 'read')).toBe(true);
  });

  it('turns vote intent into an exact structured route without an executable action', () => {
    const reply = resolveAkiliCapability('Show open decisions so I can vote', context());
    expect(reply.resources.length).toBeGreaterThan(0);
    expect(reply.resources.every((resource) => resource.kind === 'decision')).toBe(true);
    expect(reply.resources[0].href).toMatch(/^\/dashboard\/[^/]+\/decisions\/[^/?]+\?intent=vote$/);
    expect(reply.text).toContain('voting stays on the full decision page');
  });

  it('summarizes the same discussion used by the structured decision page', () => {
    const decision = dataStore.getAllDecisions()[0];
    addProposalThreadMessage({
      proposalId: decision.id,
      authorId: 'member-one',
      authorName: 'Amina',
      body: 'Can we confirm the maintenance cost before voting?',
    });
    const reply = resolveAkiliCapability(`Summarize the discussion for ${decision.title}`, context());
    expect(reply.text).toContain('Amina');
    expect(reply.text).toContain('maintenance cost');
    expect(reply.resources[0].href).toContain('#community-discussion');
  });

  it('rehydrates task references from the latest task store state', () => {
    const task = listBounties().find((item) => item.status === 'open');
    expect(task).toBeDefined();
    updateBountyStatus(task!.id, 'in_progress', 'Member');
    const refreshed = listBounties().find((item) => item.id === task!.id);
    expect(refreshed?.status).toBe('in_progress');
    const reply = resolveAkiliCapability(`Find task ${task!.title}`, context());
    expect(reply.resources.some((resource) => resource.id === task!.id)).toBe(true);
  });

  it('keeps setup-only language out of default task results', () => {
    const base = listBounties()[0];
    const plainTask = { ...base, id: 'plain', title: 'Community photo report', summary: 'Document the group meeting.', skills: ['Photography'] };
    const technicalTask = { ...base, id: 'technical', title: 'Blockchain wallet setup', summary: 'Configure a Solana wallet.' };
    const reply = resolveAkiliCapability('Find community work', {
      communities: [],
      decisions: [],
      bounties: [plainTask, technicalTask],
    });

    expect(reply.resources.map((resource) => resource.id)).toEqual(['plain']);
  });
});
