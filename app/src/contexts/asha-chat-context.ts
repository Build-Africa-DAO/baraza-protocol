import { createContext } from 'react';

export interface AshaChatContextType {
  isOpen: boolean;
  open: (message?: string) => void;
  close: () => void;
  pendingMessage: string;
  clearPending: () => void;
}

export const AshaChatContext = createContext<AshaChatContextType | null>(null);
