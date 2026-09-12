import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cachePours, cachedOwnPours } from "@/lib/pour-cache";
import {
  journalIsFresh,
  loadJournal,
  saveJournal,
} from "@/lib/photo-store";
import { SEED_POURS } from "@/lib/seed";
import { listPours } from "@/lib/pours-api";
import type { Pour } from "@/lib/pours";

export type JournalSnapshot = {
  signedIn: boolean;
  pours: Pour[];
};

export function usePours(initial?: JournalSnapshot) {
  const { user, isPending } = useCurrentUserState();
  const [pours, setPours] = useState<Pour[]>(() => {
    if (initial?.signedIn) {
      const local = cachedOwnPours();
      return local.length ? local : initial.pours;
    }
    const rows = initial && !initial.signedIn ? SEED_POURS : [];
    if (rows.length) cachePours(rows);
    return rows;
  });
  const [fetched, setFetched] = useState(
    () => (Boolean(initial) && !initial?.signedIn) || cachedOwnPours().length > 0,
  );
  const syncing = useRef(false);

  const signedIn = isPending ? Boolean(initial?.signedIn) : Boolean(user);
  const ready = fetched && (!isPending || initial != null);

  const pullCloud = useCallback(async (userId: string) => {
    const rows = await listPours();
    cachePours(rows);
    await saveJournal(userId, rows);
    return rows;
  }, []);

  const reload = useCallback(async () => {
    if (!user) {
      setPours(SEED_POURS);
      return;
    }
    const rows = await pullCloud(user.id);
    setPours(rows);
  }, [user, pullCloud]);

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    if (!user) {
      setPours(SEED_POURS);
      setFetched(true);
      return;
    }
    const userId = user.id;
    void (async () => {
      const cached = await loadJournal(userId);
      if (cancelled) return;
      if (cached?.pours.length) {
        cachePours(cached.pours);
        setPours(cached.pours);
        setFetched(true);
        if (journalIsFresh(cached)) return;
      }
      if (syncing.current) return;
      syncing.current = true;
      try {
        const rows = await pullCloud(userId);
        if (!cancelled) setPours(rows);
      } catch {
        if (!cancelled && !cached) setPours([]);
      } finally {
        syncing.current = false;
        if (!cancelled) setFetched(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isPending, pullCloud]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const maybeRefresh = () => {
      if (document.visibilityState !== "visible") return;
      void loadJournal(userId).then((cached) => {
        if (journalIsFresh(cached)) return;
        return pullCloud(userId).then(setPours);
      });
    };
    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("focus", maybeRefresh);
    return () => {
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("focus", maybeRefresh);
    };
  }, [user, pullCloud]);

  return {
    pours,
    ready,
    signedIn,
    sessionPending: isPending,
    reload,
  };
}
