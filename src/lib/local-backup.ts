import {
  loadJournal,
  loadPending,
  markJournalRestored,
  photoAsDataUrl,
  queueBackupDelete,
  queueBackupUpsert,
  saveLocalPhoto,
  savePendingQueue,
  upsertCachedPour,
  removeCachedPour,
} from "@/lib/photo-store";
import { deletePour, restoreJournal, upsertPour } from "@/lib/pours-api";
import { cachePours } from "@/lib/pour-cache";
import type { Pour } from "@/lib/pours";

let flushing = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export async function rememberPour(userId: string, pour: Pour) {
  await upsertCachedPour(userId, pour);
  await queueBackupUpsert(pour);
  scheduleFlush();
}

export async function forgetPour(userId: string, id: string) {
  await removeCachedPour(userId, id);
  await queueBackupDelete(id);
  scheduleFlush();
}

export function scheduleFlush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void flushBackup();
  }, 800);
}

export async function flushBackup() {
  if (flushing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    let pending = await loadPending();
    for (const pour of [...pending.upserts]) {
      const photo = await photoAsDataUrl(pour.id, pour.photo);
      if (!photo) continue;
      await upsertPour({
        data: {
          id: pour.id,
          createdAt: pour.createdAt,
          photo,
          pattern: pour.pattern,
          rating: pour.rating,
          beans: pour.beans,
          milk: pour.milk,
          grind: pour.grind,
          notes: pour.notes,
        },
      });
      pending = await loadPending();
      pending.upserts = pending.upserts.filter((p) => p.id !== pour.id);
      await savePendingQueue(pending);
    }
    pending = await loadPending();
    for (const id of [...pending.deletes]) {
      await deletePour({ data: id });
      pending = await loadPending();
      pending.deletes = pending.deletes.filter((x) => x !== id);
      await savePendingQueue(pending);
    }
  } catch {
    /* stay queued */
  } finally {
    flushing = false;
  }
}

export async function restoreIfNeeded(userId: string): Promise<Pour[]> {
  const local = await loadJournal(userId);
  if (local) {
    cachePours(local.pours);
    return local.pours;
  }
  try {
    const rows = await restoreJournal();
    for (const pour of rows) {
      if (pour.photo.startsWith("data:image/")) {
        await saveLocalPhoto(pour.id, pour.photo);
      }
    }
    await markJournalRestored(userId, rows);
    cachePours(rows);
    return rows;
  } catch {
    return [];
  }
}

export function listenBackup() {
  if (typeof window === "undefined") return () => undefined;
  const onOnline = () => void flushBackup();
  const onVisible = () => {
    if (document.visibilityState === "visible") void flushBackup();
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  void flushBackup();
  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
