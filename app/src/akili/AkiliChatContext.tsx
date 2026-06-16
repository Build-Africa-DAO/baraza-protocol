import React, { useState, useCallback } from 'react';
import { AkiliChatContext } from '@/contexts/akili-chat-context';

export const AkiliChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  const open = useCallback((message = '') => {
    setPendingMessage(message);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const clearPending = useCallback(() => setPendingMessage(''), []);

  return (
    <AkiliChatContext.Provider value={{ isOpen, open, close, pendingMessage, clearPending }}>
      {children}
    </AkiliChatContext.Provider>
  );
};
