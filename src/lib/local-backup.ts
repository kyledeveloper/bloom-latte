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

export const GUEST_USER_ID = "guest";

export async function rememberPour(userId: string, pour: Pour) {
  await upsertCachedPour(userId, pour);
}

export async function forgetPour(userId: string, id: string) {
  await removeCachedPour(userId, id);
}

export async function loadGuestPours(): Promise<Pour[]> {
  const local = await loadJournal(GUEST_USER_ID);
  if (local && local.pours.length > 0) {
    cachePours(local.pours);
    return local.pours;
  }
  return [];
}

export async function migrateGuestPours(signedInUserId: string): Promise<void> {
  if (!signedInUserId || signedInUserId === GUEST_USER_ID) return;
  const guest = await loadJournal(GUEST_USER_ID);
  if (!guest || guest.pours.length === 0) return;

  const userJournal = await loadJournal(signedInUserId);
  const existingIds = new Set((userJournal?.pours ?? []).map((p) => p.id));
  const newPours = guest.pours.filter((p) => !existingIds.has(p.id));

  if (newPours.length > 0) {
    const merged = [...newPours, ...(userJournal?.pours ?? [])];
    merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    await saveJournal(signedInUserId, merged, {
      lastBackupAt: userJournal?.lastBackupAt ?? null,
      restored: userJournal?.restored ?? false,
    });
    cachePours(merged);
  }
  await saveJournal(GUEST_USER_ID, []);
}

export async function restoreIfNeeded(userId: string): Promise<Pour[]> {
  if (userId === GUEST_USER_ID) {
    return loadGuestPours();
  }
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
  const remoteIdSet = new Set(remoteIds);
  const keep = new Set(pours.map((p) => p.id));

  for (const pour of pours) {
    let photo = await photoAsDataUrl(pour.id, pour.photo);
    if (!photo) {
      if (
        remoteIdSet.has(pour.id) ||
        pour.photo.startsWith("/api/pours/") ||
        pour.photo.startsWith("/pours/")
      ) {
        photo = pour.photo || `/api/pours/${pour.id}/photo`;
      } else {
        // Fallback or skip gracefully so a single corrupted image doesn't hold hostage all other pours
        continue;
      }
    }
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
