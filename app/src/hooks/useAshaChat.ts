import { useContext } from 'react';
import { AshaChatContext } from '@/contexts/asha-chat-context';

export function useAshaChat() {
  const ctx = useContext(AshaChatContext);
  if (!ctx) throw new Error('useAshaChat must be used within AshaChatProvider');
  return ctx;
}
