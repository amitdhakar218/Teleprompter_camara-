// Persistent IndexedDB Video Gallery Storage for Mobile & Web
export interface StoredVideoItem {
  id: string;
  blob: Blob;
  durationSeconds: number;
  fileSizeBytes: number;
  timestamp: string;
  createdAt: number;
}

const DB_NAME = 'teleprompter_camera_studio_db';
const STORE_NAME = 'recorded_videos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoToGallery(video: {
  blob: Blob;
  durationSeconds: number;
  fileSizeBytes: number;
  timestamp: string;
}): Promise<StoredVideoItem> {
  const db = await openDB();
  const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const item: StoredVideoItem = {
    id,
    blob: video.blob,
    durationSeconds: video.durationSeconds,
    fileSizeBytes: video.fileSizeBytes,
    timestamp: video.timestamp,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllStoredVideos(): Promise<StoredVideoItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = (request.result as StoredVideoItem[]) || [];
      // Sort newest first
      list.sort((a, b) => b.createdAt - a.createdAt);
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVideoFromGallery(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
