import React, { createContext, useContext, useState, useCallback } from 'react';

interface AshaChatContextType {
  isOpen: boolean;
  open: (message?: string) => void;
  close: () => void;
  pendingMessage: string;
  clearPending: () => void;
}

const AshaChatContext = createContext<AshaChatContextType | null>(null);

export const AshaChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  const open = useCallback((message = '') => {
    setPendingMessage(message);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const clearPending = useCallback(() => setPendingMessage(''), []);

  return (
    <AshaChatContext.Provider value={{ isOpen, open, close, pendingMessage, clearPending }}>
      {children}
    </AshaChatContext.Provider>
  );
};

export const useAshaChat = (): AshaChatContextType => {
  const ctx = useContext(AshaChatContext);
  if (!ctx) throw new Error('useAshaChat must be used within AshaChatProvider');
  return ctx;
};
