import { beforeEach, describe, expect, it } from 'vitest';
import {
  addProposalThreadMessage,
  buildFacilitatorExcerpt,
  extractMentions,
  listProposalThread,
} from '@/lib/proposalThreads';

describe('proposalThreads', () => {
  beforeEach(() => window.localStorage.clear());

  it('stores replies and extracts unique mentions', () => {
    const parent = addProposalThreadMessage({
      proposalId: 'proposal-1',
      authorId: 'member-1',
      authorName: 'Amina',
      body: 'Can @Kamau confirm the supplier quote?',
    });
    addProposalThreadMessage({
      proposalId: 'proposal-1',
      authorId: 'member-2',
      authorName: 'Kamau',
      body: '@Amina Yes, and @Amina can see the receipt.',
      parentId: parent.id,
    });

    const messages = listProposalThread('proposal-1');
    expect(messages).toHaveLength(2);
    expect(messages[1].parentId).toBe(parent.id);
    expect(messages[1].mentions).toEqual(['Amina']);
  });

  it('rejects a reply to a missing source message', () => {
    expect(() => addProposalThreadMessage({
      proposalId: 'proposal-1',
      authorId: 'member-1',
      authorName: 'Amina',
      body: 'Following up.',
      parentId: 'missing',
    })).toThrow('no longer available');
  });

  it('builds source-labelled facilitator context', () => {
    const message = addProposalThreadMessage({
      proposalId: 'proposal-1',
      authorId: 'member-1',
      authorName: 'Amina',
      body: 'I support the purchase if we compare three quotes.',
    });

    expect(buildFacilitatorExcerpt(listProposalThread('proposal-1')))
      .toContain(`[${message.id}] Amina:`);
    expect(extractMentions('Ask @Wanjiku and @Otieno.')).toEqual(['Wanjiku', 'Otieno']);
  });
});
