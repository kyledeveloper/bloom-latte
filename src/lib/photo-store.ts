const DB_NAME = "bloom-latte";
const DB_VERSION = 2;
const PHOTO_STORE = "photos";
const JOURNAL_STORE = "journal";
const JOURNAL_KEY = "snapshot";

/** Skip a Neon/Vercel list pull when the local journal is newer than this. */
export const JOURNAL_FRESH_MS = 20 * 60 * 1000;

export type JournalSnapshotRow = {
  userId: string;
  fetchedAt: number;
  pours: import("@/lib/pours").Pour[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE);
      }
      if (!db.objectStoreNames.contains(JOURNAL_STORE)) {
        db.createObjectStore(JOURNAL_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("本地手记打不开"));
  });
}

function canIdb() {
  return typeof indexedDB !== "undefined";
}

export async function saveLocalPhoto(id: string, data: string | Blob) {
  if (!canIdb()) return;
  if (typeof data === "string" && !data.startsWith("data:") && !data.startsWith("blob:")) {
    return;
  }
  if (data instanceof Blob && data.size < 20) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).put(data, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("照片没存上"));
  });
}

export async function loadLocalPhoto(id: string): Promise<string | Blob | null> {
  if (!canIdb()) return null;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readonly");
      const req = tx.objectStore(PHOTO_STORE).get(id);
      req.onsuccess = () => {
        const value = req.result;
        if (typeof value === "string" || value instanceof Blob) resolve(value);
        else resolve(null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteLocalPhoto(id: string) {
  if (!canIdb()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
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
  if (!photo) return pourPhotoUrl(id);
  return photo;
}

function slimPour(pour: import("@/lib/pours").Pour): import("@/lib/pours").Pour {
  return {
    ...pour,
    photo: pour.photo.startsWith("data:") ? pourPhotoUrl(pour.id) : pour.photo,
  };
}

export async function loadJournal(
  userId: string,
): Promise<JournalSnapshotRow | null> {
  if (!canIdb()) return null;
  try {
    const db = await openDb();
    const row = await new Promise<JournalSnapshotRow | null>((resolve, reject) => {
      const tx = db.transaction(JOURNAL_STORE, "readonly");
      const req = tx.objectStore(JOURNAL_STORE).get(JOURNAL_KEY);
      req.onsuccess = () => {
        const value = req.result as JournalSnapshotRow | undefined;
        resolve(value && value.userId === userId ? value : null);
      };
      req.onerror = () => reject(req.error);
    });
    return row;
  } catch {
    return null;
  }
}

export function journalIsFresh(row: JournalSnapshotRow | null) {
  if (!row) return false;
  return Date.now() - row.fetchedAt < JOURNAL_FRESH_MS;
}

export async function saveJournal(
  userId: string,
  pours: import("@/lib/pours").Pour[],
  fetchedAt = Date.now(),
) {
  if (!canIdb()) return;
  const slim = pours.filter((p) => !p.demo).map(slimPour);
  for (const pour of pours) {
    if (pour.photo.startsWith("data:image/")) {
      void saveLocalPhoto(pour.id, pour.photo);
    }
  }
  const db = await openDb();
  const row: JournalSnapshotRow = {
    userId,
    fetchedAt,
    pours: slim,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(JOURNAL_STORE, "readwrite");
    tx.objectStore(JOURNAL_STORE).put(row, JOURNAL_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function upsertCachedPour(
  userId: string,
  pour: import("@/lib/pours").Pour,
) {
  const current = await loadJournal(userId);
  if (pour.photo.startsWith("data:image/")) {
    await saveLocalPhoto(pour.id, pour.photo);
  }
  if (!current) return;
  const next = slimPour(pour);
  const pours = [next, ...current.pours.filter((p) => p.id !== pour.id)];
  pours.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  await saveJournal(userId, pours, Date.now());
}

export async function removeCachedPour(userId: string, id: string) {
  const current = await loadJournal(userId);
  await deleteLocalPhoto(id);
  if (!current) return;
  await saveJournal(
    userId,
    current.pours.filter((p) => p.id !== id),
    Date.now(),
  );
}
