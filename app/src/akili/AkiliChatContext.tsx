import React, { useState, useCallback } from 'react';
import { AkiliChatContext, type AkiliChatMode } from '@/akili/akili-chat-context';

export const AkiliChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [pendingMode, setPendingMode] = useState<AkiliChatMode>('private');
  const [mode, setMode] = useState<AkiliChatMode>('private');

  const open = useCallback((message = '', mode: AkiliChatMode = 'private') => {
    setPendingMessage(message);
    setPendingMode(mode);
    setMode(mode);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const clearPending = useCallback(() => setPendingMessage(''), []);

  return (
    <AkiliChatContext.Provider value={{ isOpen, open, close, pendingMessage, pendingMode, mode, setMode, clearPending }}>
      {children}
    </AkiliChatContext.Provider>
  );
};
