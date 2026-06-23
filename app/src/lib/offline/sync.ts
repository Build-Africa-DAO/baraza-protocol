import {
  type ActionType,
  type QueuedAction,
  getPendingActions,
  updateActionStatus,
} from '@/lib/offline/queue';

export type SyncHandler = (action: QueuedAction) => Promise<'confirmed' | 'failed' | 'retry'>;

const handlers = new Map<ActionType, SyncHandler>();
let processing = false;

export function registerSyncHandler(type: ActionType, handler: SyncHandler): void {
  handlers.set(type, handler);
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (processing) return { processed: 0, failed: 0 };
  processing = true;

  let processed = 0;
  let failed = 0;

  try {
    const pending = await getPendingActions();

    for (const action of pending) {
      const handler = handlers.get(action.type);
      if (!handler) continue;

      await updateActionStatus(action.id, { status: 'broadcasting' });

      try {
        const result = await handler(action);

        if (result === 'confirmed') {
          await updateActionStatus(action.id, { status: 'confirmed' });
          processed++;
        } else if (result === 'failed') {
          await updateActionStatus(action.id, { status: 'failed' });
          failed++;
        } else {
          const nextRetryCount = action.retryCount + 1;
          if (nextRetryCount >= action.maxRetries) {
            await updateActionStatus(action.id, { status: 'failed', retryCount: nextRetryCount });
            failed++;
          } else {
            await updateActionStatus(action.id, { status: 'pending', retryCount: nextRetryCount });
          }
        }
      } catch {
        const nextRetryCount = action.retryCount + 1;
        if (nextRetryCount >= action.maxRetries) {
          await updateActionStatus(action.id, { status: 'failed', retryCount: nextRetryCount });
          failed++;
        } else {
          await updateActionStatus(action.id, { status: 'pending', retryCount: nextRetryCount });
        }
      }
    }
  } finally {
    processing = false;
  }

  return { processed, failed };
}

export function startAutoSync(intervalMs = 30_000): () => void {
  const handleOnline = () => {
    if (navigator.onLine) {
      processQueue().catch(() => undefined);
    }
  };

  window.addEventListener('online', handleOnline);

  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      processQueue().catch(() => undefined);
    }
  }, intervalMs);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}

export function isProcessing(): boolean {
  return processing;
}
