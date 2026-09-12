const DB_NAME = "bloom-latte";
const DB_VERSION = 3;
const PHOTO_STORE = "photos";
const JOURNAL_STORE = "journal";
const PENDING_STORE = "pending";
const JOURNAL_KEY = "snapshot";
const PENDING_KEY = "queue";

export type JournalSnapshotRow = {
  userId: string;
  fetchedAt: number;
  restored: boolean;
  lastBackupAt: number | null;
  pours: import("@/lib/pours").Pour[];
};

export type PendingBackup = {
  upserts: import("@/lib/pours").Pour[];
  deletes: string[];
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
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE);
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

export async function saveJournal(
  userId: string,
  pours: import("@/lib/pours").Pour[],
  extra: { fetchedAt?: number; restored?: boolean; lastBackupAt?: number | null } = {},
) {
  if (!canIdb()) return;
  const previous = await loadJournal(userId);
  const slim = pours.filter((p) => !p.demo).map(slimPour);
  for (const pour of pours) {
    if (pour.photo.startsWith("data:image/")) {
      void saveLocalPhoto(pour.id, pour.photo);
    }
  }
  const db = await openDb();
  const row: JournalSnapshotRow = {
    userId,
    fetchedAt: extra.fetchedAt ?? Date.now(),
    restored: extra.restored ?? previous?.restored ?? false,
    lastBackupAt:
      extra.lastBackupAt !== undefined
        ? extra.lastBackupAt
        : previous?.lastBackupAt ?? null,
    pours: slim,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(JOURNAL_STORE, "readwrite");
    tx.objectStore(JOURNAL_STORE).put(row, JOURNAL_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markJournalRestored(userId: string, pours: import("@/lib/pours").Pour[]) {
  await saveJournal(userId, pours, { fetchedAt: Date.now(), restored: true });
}

export async function upsertCachedPour(
  userId: string,
  pour: import("@/lib/pours").Pour,
) {
  if (pour.photo.startsWith("data:image/")) {
    await saveLocalPhoto(pour.id, pour.photo);
  }
  const current = await loadJournal(userId);
  const next = slimPour(pour);
  const pours = [next, ...(current?.pours ?? []).filter((p) => p.id !== pour.id)];
  pours.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  await saveJournal(userId, pours);
}

export async function removeCachedPour(userId: string, id: string) {
  await deleteLocalPhoto(id);
  const current = await loadJournal(userId);
  await saveJournal(
    userId,
    (current?.pours ?? []).filter((p) => p.id !== id),
  );
}

export async function loadPending(): Promise<PendingBackup> {
  const empty: PendingBackup = { upserts: [], deletes: [] };
  if (!canIdb()) return empty;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(PENDING_STORE, "readonly");
      const req = tx.objectStore(PENDING_STORE).get(PENDING_KEY);
      req.onsuccess = () => {
        const value = req.result as PendingBackup | undefined;
        resolve(
          value && Array.isArray(value.upserts)
            ? value
            : empty,
        );
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return empty;
  }
}

export async function savePendingQueue(pending: PendingBackup) {
  if (!canIdb()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, "readwrite");
    tx.objectStore(PENDING_STORE).put(pending, PENDING_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function queueBackupUpsert(pour: import("@/lib/pours").Pour) {
  const pending = await loadPending();
  pending.deletes = pending.deletes.filter((id) => id !== pour.id);
  pending.upserts = [
    slimPour(pour),
    ...pending.upserts.filter((p) => p.id !== pour.id),
  ];
  await savePendingQueue(pending);
}

export async function queueBackupDelete(id: string) {
  const pending = await loadPending();
  pending.upserts = pending.upserts.filter((p) => p.id !== id);
  if (!pending.deletes.includes(id)) pending.deletes.push(id);
  await savePendingQueue(pending);
}

export async function photoAsDataUrl(
  id: string,
  fallback = "",
): Promise<string | null> {
  if (fallback.startsWith("data:image/")) return fallback;
  const local = await loadLocalPhoto(id);
  if (typeof local === "string" && local.startsWith("data:image/")) return local;
  if (local instanceof Blob) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(local);
    });
  }
  return null;
}
