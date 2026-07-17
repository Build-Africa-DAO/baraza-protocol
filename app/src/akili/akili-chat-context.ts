import { createContext } from 'react';

export type AkiliChatMode = 'private' | 'facilitator';

export interface AkiliChatContextType {
  isOpen: boolean;
  open: (message?: string, mode?: AkiliChatMode) => void;
  close: () => void;
  pendingMessage: string;
  pendingMode: AkiliChatMode;
  mode: AkiliChatMode;
  setMode: (mode: AkiliChatMode) => void;
  clearPending: () => void;
}

export const AkiliChatContext = createContext<AkiliChatContextType | null>(null);
