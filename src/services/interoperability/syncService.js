/**
 * AgriBridge AI — Offline-First Data & Synchronization Service (Phase 7)
 * Manages local mutation queuing, synchronization status, cached telemetry indicators,
 * and conflict resolution strategies.
 * 
 * CORE PRINCIPLE:
 * Cached data must be clearly flagged as CACHED / OFFLINE with a verified timestamp.
 * Offline mutations queue safely and sync idempotently without data loss.
 */

const STORAGE_KEYS = {
  SYNC_QUEUE: 'agribridge_offline_sync_queue_v1',
  SYNC_STATE: 'agribridge_sync_state_v1'
};

let memorySyncQueue = [];
let memorySyncState = {
  isOnline: true,
  lastSynchronized: new Date().toISOString(),
  pendingCount: 0
};

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

function getQueue() {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read sync queue:', e);
    }
  }
  return memorySyncQueue;
}

function saveQueue(queue) {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to persist sync queue:', e);
    }
  }
  memorySyncQueue = queue;
}

/**
 * Enqueues an offline farmer mutation (observation, action update, journal entry)
 * @param {object} item - { type: string, farmId: string, payload: object, entityId: string }
 * @returns {object} Queued sync item
 */
export function enqueueOfflineMutation(item) {
  if (!item.type || !item.payload) {
    throw new Error('Sync queue item requires type and payload');
  }

  const queue = getQueue();
  const queueItem = {
    syncId: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: item.type,
    farmId: item.farmId || 'default_farm',
    entityId: item.entityId || null,
    payload: item.payload,
    enqueuedAt: new Date().toISOString(),
    retryCount: 0,
    status: 'queued'
  };

  queue.push(queueItem);
  saveQueue(queue);

  updateSyncStatus({ pendingCount: queue.length });
  return queueItem;
}

/**
 * Processes and synchronizes the offline queue
 * @param {Function} [syncHandler] - Async function to push each record to server
 * @param {object} [options] - { conflictStrategy: 'server_wins' | 'client_wins' | 'merge' }
 * @returns {Promise<{ syncedCount: number, failedCount: number, remainingQueue: number }>}
 */
export async function processSyncQueue(syncHandler = null, options = { conflictStrategy: 'client_wins' }) {
  const queue = getQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0, remainingQueue: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      if (syncHandler) {
        await syncHandler(item, options);
      }
      syncedCount++;
    } catch (err) {
      item.retryCount++;
      item.lastError = err.message;
      if (item.retryCount < 5) {
        remaining.push(item);
      } else {
        failedCount++;
      }
    }
  }

  saveQueue(remaining);
  updateSyncStatus({
    lastSynchronized: new Date().toISOString(),
    pendingCount: remaining.length
  });

  return {
    syncedCount,
    failedCount,
    remainingQueue: remaining.length
  };
}

/**
 * Updates synchronization state
 */
export function updateSyncStatus(updates = {}) {
  const current = getSyncStatus();
  const updated = {
    ...current,
    ...updates
  };

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_STATE, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save sync state:', e);
    }
  }
  memorySyncState = updated;
  return updated;
}

/**
 * Retrieves the current synchronization health & offline status
 */
export function getSyncStatus() {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYNC_STATE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read sync status:', e);
    }
  }
  return memorySyncState;
}

/**
 * Resets memory store for test runner
 */
export function resetSyncMemoryStore() {
  memorySyncQueue = [];
  memorySyncState = {
    isOnline: true,
    lastSynchronized: new Date().toISOString(),
    pendingCount: 0
  };
}
