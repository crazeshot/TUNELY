/**
 * offlineStorage.js
 * IndexedDB storage engine for caching full audio buffers and artwork for offline listening.
 */

const DB_NAME = 'tunely_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTrackForOffline(track) {
  try {
    const audioUrl = track.audio_url || track.audio;
    if (!audioUrl) throw new Error('No audio URL found for track');

    // Fetch audio data as blob
    const response = await fetch(audioUrl);
    const blob = await response.blob();

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        ...track,
        audioBlob: blob,
        downloadedAt: new Date().toISOString(),
        isDownloaded: true,
      };

      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[OfflineStorage] Failed to save track:', err);
    throw err;
  }
}

export async function getOfflineTrack(trackId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => {
        const item = req.result;
        if (item && item.audioBlob) {
          item.audio_url = URL.createObjectURL(item.audioBlob);
        }
        resolve(item || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllOfflineTracks() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        list.forEach((item) => {
          if (item.audioBlob) {
            item.audio_url = URL.createObjectURL(item.audioBlob);
          }
        });
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteOfflineTrack(trackId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}
