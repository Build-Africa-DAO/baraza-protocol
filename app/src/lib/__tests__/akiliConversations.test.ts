import { beforeEach, describe, expect, it } from 'vitest';
import {
  conversationTitle,
  createAkiliConversation,
  loadAkiliConversations,
  saveAkiliConversations,
} from '@/lib/akiliConversations';

describe('Akili conversations', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists recent conversations locally', () => {
    const conversation = createAkiliConversation();
    saveAkiliConversations([conversation]);
    expect(loadAkiliConversations()).toEqual([conversation]);
  });

  it('creates a short searchable title from the first question', () => {
    expect(conversationTitle('  Show   decisions that need my attention today  ')).toBe('Show decisions that need my attention t...');
  });
});
