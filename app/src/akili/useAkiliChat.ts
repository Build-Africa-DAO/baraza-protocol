import { useContext } from 'react';
import { AkiliChatContext } from '@/akili/akili-chat-context';

export function useAkiliChat() {
  const ctx = useContext(AkiliChatContext);
  if (!ctx) throw new Error('useAkiliChat must be used within AkiliChatProvider');
  return ctx;
}
