export const CACHE_TTL = {
  community_data: 5 * 60 * 1000,
  member_list: 10 * 60 * 1000,
  proposal_list: 2 * 60 * 1000,
  brza_balance: 60 * 1000,
  oracle_price: 60 * 1000,
  blackbook: 30 * 60 * 1000,
} as const;

export type CacheKey = keyof typeof CACHE_TTL;

interface CacheEntry {
  key: string;
  namespace: CacheKey;
  value: unknown;
  expiresAt: number;
}

const DB_NAME = 'baraza-cache';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

export async function cacheGet<T>(namespace: CacheKey, key: string): Promise<T | null> {
  const db = await openCache();
  return new Promise((resolve, reject) => {
    const compoundKey = `${namespace}:${key}`;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(compoundKey);

    request.onsuccess = (event) => {
      const entry = (event.target as IDBRequest<CacheEntry | undefined>).result;
      if (!entry || Date.now() > entry.expiresAt) {
        resolve(null);
      } else {
        resolve(entry.value as T);
      }
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function cacheSet<T>(namespace: CacheKey, key: string, value: T): Promise<void> {
  const db = await openCache();
  const entry: CacheEntry = {
    key: `${namespace}:${key}`,
    namespace,
    value,
    expiresAt: Date.now() + CACHE_TTL[namespace],
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(entry);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = (event) => reject((event.target as IDBTransaction).error);
  });
}

export async function cacheInvalidate(namespace: CacheKey, key?: string): Promise<void> {
  const db = await openCache();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    if (key !== undefined) {
      const request = store.delete(`${namespace}:${key}`);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    } else {
      const prefix = `${namespace}:`;
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;
        const entry = cursor.value as CacheEntry;
        if (entry.key.startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      };
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    }

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = (event) => reject((event.target as IDBTransaction).error);
  });
}

export async function cachePurgeExpired(): Promise<void> {
  const db = await openCache();
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) return;
      const entry = cursor.value as CacheEntry;
      if (entry.expiresAt < now) {
        cursor.delete();
      }
      cursor.continue();
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = (event) => reject((event.target as IDBTransaction).error);
  });
}
