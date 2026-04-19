import type {
  PhrasePoolEntry,
  DistractionCategory,
  RoastIntensity,
  VoicePreset,
} from '../shared/types';

const DB_NAME = 'work-bestie-audio';
const DB_VERSION = 1;
const STORE_NAME = 'phrases';

/**
 * Opens (or creates) the IndexedDB database with the phrase pool schema.
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category_intensity_voice', ['category', 'intensity', 'voicePreset'], {
          unique: false,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a single phrase clip entry in IndexedDB.
 */
export async function storePhraseClip(entry: PhrasePoolEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Retrieves all phrase clips matching the given category, intensity, and voice preset.
 */
export async function getClipsByFilter(
  category: DistractionCategory,
  intensity: RoastIntensity,
  voicePreset: VoicePreset,
): Promise<PhrasePoolEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('category_intensity_voice');
    const request = index.getAll([category, intensity, voicePreset]);

    request.onsuccess = () => {
      db.close();
      resolve(request.result as PhrasePoolEntry[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clears all stored phrase clips from IndexedDB.
 */
export async function clearPool(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
