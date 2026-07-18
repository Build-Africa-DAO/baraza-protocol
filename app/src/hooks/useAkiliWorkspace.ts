import { useEffect, useState } from 'react';
import { listBounties, type Bounty } from '@/lib/bounties';
import { resolveAkiliCapability } from '@/lib/akiliCapabilities';
import {
  conversationTitle,
  createAkiliConversation,
  loadAkiliConversations,
  saveAkiliConversations,
  type AkiliConversation,
} from '@/lib/akiliConversations';
import { useAllDecisions, useCommunities } from '@/hooks/useBarazaData';
import { getAkiliFallback, streamAkiliResponse } from '@/lib/akiliTransport';

export function useAkiliWorkspace() {
  const communities = useCommunities();
  const decisions = useAllDecisions();
  const [bounties, setBounties] = useState<Bounty[]>(() => listBounties());
  const [conversations, setConversations] = useState<AkiliConversation[]>(() => {
    const stored = loadAkiliConversations();
    return stored.length > 0 ? stored : [createAkiliConversation()];
  });
  const [activeId, setActiveId] = useState(() => conversations[0].id);
  const [isResponding, setIsResponding] = useState(false);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];

  useEffect(() => {
    saveAkiliConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    const refresh = () => setBounties(listBounties());
    window.addEventListener('baraza:bounties', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('baraza:bounties', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const updateConversation = (id: string, update: (conversation: AkiliConversation) => AkiliConversation) => {
    setConversations((current) => current.map((conversation) => conversation.id === id ? update(conversation) : conversation));
  };

  const ask = async (input: string) => {
    const text = input.trim();
    if (!text || isResponding) return;
    const targetId = activeConversation.id;
    const reply = resolveAkiliCapability(text, { communities, decisions, bounties });
    const userId = `user_${Date.now().toString(36)}`;
    const akiliId = `akili_${(Date.now() + 1).toString(36)}`;
    const now = new Date().toISOString();
    updateConversation(targetId, (conversation) => ({
      ...conversation,
      title: conversation.title === 'New conversation' ? conversationTitle(text) : conversation.title,
      updatedAt: now,
      messages: [
        ...conversation.messages,
        { id: userId, role: 'user', text, createdAt: now },
        { id: akiliId, role: 'akili', text: '', resources: reply.resources, suggestions: reply.suggestions, createdAt: now },
      ],
    }));
    setIsResponding(true);

    const history = activeConversation.messages.slice(-8).map((message) => ({
      role: message.role === 'user' ? 'user' as const : 'assistant' as const,
      content: message.text,
    }));
    let received = false;
    try {
      await streamAkiliResponse(text, null, history, (chunk) => {
        received = true;
        updateConversation(targetId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) => message.id === akiliId ? { ...message, text: message.text + chunk } : message),
        }));
      }, 'private');
    } catch {
      // The capability answer remains available offline and in local preview.
    } finally {
      if (!received) {
        updateConversation(targetId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) => message.id === akiliId ? { ...message, text: reply.text || getAkiliFallback(text) } : message),
        }));
      }
      setIsResponding(false);
    }
  };

  const startNewConversation = () => {
    const next = createAkiliConversation();
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
  };

  return {
    activeConversation,
    conversations,
    activeId,
    setActiveId,
    startNewConversation,
    ask,
    isResponding,
    communities,
    decisions,
    bounties,
  };
}
