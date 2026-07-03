import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type QueuedAction,
  enqueueAction,
  getQueueSize,
  openQueue,
} from '@/lib/offline/queue';
import { openCache } from '@/lib/offline/cache';
import {
  type SyncHandler,
  processQueue as runProcessQueue,
  registerSyncHandler,
  startAutoSync,
} from '@/lib/offline/sync';

interface OfflineContextValue {
  isOnline: boolean;
  queueSize: number;
  enqueue: (action: Parameters<typeof enqueueAction>[0]) => Promise<QueuedAction>;
  processQueue: () => Promise<void>;
  registerHandler: typeof registerSyncHandler;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const refreshQueueSize = useCallback(async () => {
    const size = await getQueueSize();
    setQueueSize(size);
  }, []);

  useEffect(() => {
    Promise.all([openQueue(), openCache()]).catch(() => undefined);
    refreshQueueSize().catch(() => undefined);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const intervalId = setInterval(() => {
      refreshQueueSize().catch(() => undefined);
    }, 10_000);

    const stopSync = startAutoSync();
    cleanupRef.current = stopSync;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      cleanupRef.current?.();
    };
  }, [refreshQueueSize]);

  const enqueue = useCallback(
    async (action: Parameters<typeof enqueueAction>[0]): Promise<QueuedAction> => {
      const queued = await enqueueAction(action);
      await refreshQueueSize();
      return queued;
    },
    [refreshQueueSize]
  );

  const handleProcessQueue = useCallback(async (): Promise<void> => {
    await runProcessQueue();
    await refreshQueueSize();
  }, [refreshQueueSize]);

  const registerHandler = useCallback(
    (type: Parameters<typeof registerSyncHandler>[0], handler: SyncHandler): void => {
      registerSyncHandler(type, handler);
    },
    []
  );

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queueSize,
        enqueue,
        processQueue: handleProcessQueue,
        registerHandler,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return ctx;
}
