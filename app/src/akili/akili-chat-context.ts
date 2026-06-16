import { createContext } from 'react';

export interface AkiliChatContextType {
  isOpen: boolean;
  open: (message?: string) => void;
  close: () => void;
  pendingMessage: string;
  clearPending: () => void;
}

export const AkiliChatContext = createContext<AkiliChatContextType | null>(null);
