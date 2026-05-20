import React, { useState, useCallback } from 'react';
import { AshaChatContext } from '@/contexts/asha-chat-context';

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
