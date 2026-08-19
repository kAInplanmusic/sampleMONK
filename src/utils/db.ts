// src/utils/db.ts
export const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('AudioMonastryDB', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('scratchpad', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveToDB = async (item: any) => {
  const db = await openDB();
  const tx = db.transaction('scratchpad', 'readwrite');
  tx.objectStore('scratchpad').put({ ...item, lastModified: Date.now() });
};
