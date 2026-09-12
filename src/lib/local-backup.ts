import {
  loadJournal,
  markJournalRestored,
  photoAsDataUrl,
  saveJournal,
  saveLocalPhoto,
  upsertCachedPour,
  removeCachedPour,
} from "@/lib/photo-store";
import { deletePour, listPourIds, restoreJournal, upsertPour } from "@/lib/pours-api";
import { cachePours } from "@/lib/pour-cache";
import type { Pour } from "@/lib/pours";

export async function rememberPour(userId: string, pour: Pour) {
  await upsertCachedPour(userId, pour);
}

export async function forgetPour(userId: string, id: string) {
  await removeCachedPour(userId, id);
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

/** Full snapshot to Neon. Call only when the user asks to back up. */
export async function coldBackup(userId: string) {
  const local = await loadJournal(userId);
  const pours = local?.pours ?? [];
  const remoteIds = await listPourIds();
  const keep = new Set(pours.map((p) => p.id));

  for (const pour of pours) {
    const photo = await photoAsDataUrl(pour.id, pour.photo);
    if (!photo) throw new Error("有杯子还没带上照片，备份中断了。");
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
  }

  for (const id of remoteIds) {
    if (!keep.has(id)) await deletePour({ data: id });
  }

  await saveJournal(userId, pours, { lastBackupAt: Date.now() });
}
