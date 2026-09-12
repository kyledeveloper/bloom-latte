const DB_NAME = "bloom-latte";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("照片库打不开"));
  });
}

export async function saveLocalPhoto(id: string, dataUrl: string) {
  if (typeof indexedDB === "undefined" || !dataUrl.startsWith("data:")) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("照片没存上"));
  });
}

export async function loadLocalPhoto(id: string): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () =>
        resolve(typeof req.result === "string" ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export function pourPhotoUrl(id: string) {
  return `/api/pours/${id}/photo`;
}

export function isStoredPhoto(photo: string) {
  return photo.startsWith("data:image/") || photo.startsWith("/api/pours/");
}

export function displayPhotoSrc(id: string, photo: string) {
  if (photo.startsWith("data:image/")) return pourPhotoUrl(id);
  return photo;
}
