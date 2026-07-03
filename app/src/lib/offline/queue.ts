export type ActionType =
  | 'cast_vote'
  | 'pay_dues'
  | 'create_proposal'
  | 'claim_bounty'
  | 'transfer_brza';

export interface QueuedAction {
  id: string;
  type: ActionType;
  payload: Record<string, unknown>;
  signedTx?: string;
  createdAt: number;
  retryCount: number;
  maxRetries: 3;
  status: 'pending' | 'broadcasting' | 'confirmed' | 'failed';
}

const DB_NAME = 'baraza-queue';
const DB_VERSION = 1;
const STORE_NAME = 'actions';

export function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

export async function enqueueAction(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount' | 'status'>
): Promise<QueuedAction> {
  const queued: QueuedAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).add(queued);
    request.onsuccess = () => resolve(queued);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function getPendingActions(): Promise<QueuedAction[]> {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = (event) => {
      const all = (event.target as IDBRequest<QueuedAction[]>).result;
      resolve(all.filter((a) => a.status === 'pending'));
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function updateActionStatus(
  id: string,
  update: Partial<Pick<QueuedAction, 'status' | 'retryCount' | 'signedTx'>>
): Promise<void> {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = (event) => {
      const existing = (event.target as IDBRequest<QueuedAction>).result;
      if (!existing) {
        resolve();
        return;
      }
      const updated: QueuedAction = { ...existing, ...update };
      const putReq = store.put(updated);
      putReq.onerror = (e) => reject((e.target as IDBRequest).error);
    };

    getReq.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = (event) => reject((event.target as IDBTransaction).error);
  });
}

export async function removeAction(id: string): Promise<void> {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).delete(id);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = (event) => reject((event.target as IDBTransaction).error);
  });
}

export async function getQueueSize(): Promise<number> {
  const pending = await getPendingActions();
  return pending.length;
}
