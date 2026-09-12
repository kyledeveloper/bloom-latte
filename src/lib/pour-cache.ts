import { SEED_POURS } from "@/lib/seed";
import type { Pour } from "@/lib/pours";

const STORAGE_KEY = "bloom-pour-cache-v1";
const cache = new Map<string, Pour>();

for (const pour of SEED_POURS) cache.set(pour.id, pour);

function canStore() {
  try {
    return typeof sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

function readStored(): Pour[] {
  if (!canStore()) return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Pour[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  if (!canStore()) return;
  try {
    const rows = [...cache.values()]
      .filter((p) => !p.demo)
      .map((p) =>
        p.photo.startsWith("data:")
          ? { ...p, photo: `/api/pours/${p.id}/photo` }
          : p,
      )
      .slice(0, 40);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* quota */
  }
}

export function cachedOwnPours(): Pour[] {
  return [...cache.values()]
    .filter((p) => !p.demo)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

if (canStore()) {
  for (const pour of readStored()) cache.set(pour.id, pour);
}

export function cachePour(pour: Pour) {
  cache.set(pour.id, pour);
  persist();
}

export function cachePours(pours: Pour[]) {
  for (const pour of pours) cache.set(pour.id, pour);
  persist();
}

export function cachedPour(id: string): Pour | null {
  return cache.get(id) ?? SEED_POURS.find((p) => p.id === id) ?? null;
}
