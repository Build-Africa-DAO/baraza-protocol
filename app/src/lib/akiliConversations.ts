import type { AkiliResourceRef } from '@/lib/akiliCapabilities';

export interface AkiliWorkspaceMessage {
  id: string;
  role: 'user' | 'akili';
  text: string;
  resources?: AkiliResourceRef[];
  suggestions?: string[];
  createdAt: string;
}

export interface AkiliConversation {
  id: string;
  title: string;
  messages: AkiliWorkspaceMessage[];
  updatedAt: string;
}

const STORAGE_KEY = 'baraza.akili.conversations.v1';
const MAX_CONVERSATIONS = 12;

export const COMMUNITY_QUESTIONS = [
  'Which communities are open to new members?',
  'What decisions need member attention?',
  'What community work is available?',
  'How do members discuss a decision before voting?',
] as const;

export function createAkiliConversation(): AkiliConversation {
  const now = new Date().toISOString();
  return {
    id: `chat_${Date.now().toString(36)}`,
    title: 'New conversation',
    updatedAt: now,
    messages: [{
      id: 'welcome',
      role: 'akili',
      text: 'Habari, I’m Akili. Ask me about communities, open decisions, member discussions, or work you can contribute to.',
      suggestions: ['What needs my attention?', 'Compare communities', 'Find community work'],
      createdAt: now,
    }],
  };
}

export function loadAkiliConversations(): AkiliConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_CONVERSATIONS) : [];
  } catch {
    return [];
  }
}

export function saveAkiliConversations(conversations: AkiliConversation[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
}

export function conversationTitle(input: string): string {
  const title = input.trim().replace(/\s+/g, ' ');
  return title.length > 42 ? `${title.slice(0, 39)}...` : title || 'New conversation';
}
