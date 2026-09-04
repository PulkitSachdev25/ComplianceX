/**
 * Offline Safety Queue & Storage Manager
 * Preserves raw statutory inspection frames & audit metadata in remote warehouses
 * with zero connectivity. Automatically synchronizes once back online.
 */

const OFFLINE_QUEUE_KEY = 'GOI_LM_OFFLINE_INSPECTION_QUEUE';

export const offlineStorage = {
  getQueue: () => {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read offline queue:', e);
      return [];
    }
  },

  enqueue: (docketRecord) => {
    try {
      const current = offlineStorage.getQueue();
      const newRecord = {
        ...docketRecord,
        queued_at: new Date().toISOString(),
        offline_id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      };
      current.unshift(newRecord);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
      return newRecord;
    } catch (e) {
      console.error('Failed to enqueue offline docket:', e);
      return null;
    }
  },

  remove: (offlineId) => {
    try {
      const current = offlineStorage.getQueue();
      const updated = current.filter(item => item.offline_id !== offlineId);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to remove offline docket:', e);
      return [];
    }
  },

  clearQueue: () => {
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      return [];
    } catch (e) {
      console.error('Failed to clear queue:', e);
      return [];
    }
  },

  syncWithBackend: async (apiBaseUrl = 'http://localhost:8000') => {
    const queue = offlineStorage.getQueue();
    if (!queue || queue.length === 0) {
      return { success: true, count: 0, message: 'Queue is empty.' };
    }

    try {
      const resp = await fetch(`${apiBaseUrl}/api/inspector/sync-offline-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue })
      });

      if (!resp.ok) {
        throw new Error(`Sync failed with HTTP status ${resp.status}`);
      }

      const res = await resp.json();
      offlineStorage.clearQueue();
      return { success: true, count: queue.length, data: res };
    } catch (e) {
      console.error('Offline sync error:', e);
      return { success: false, error: e.message };
    }
  }
};
