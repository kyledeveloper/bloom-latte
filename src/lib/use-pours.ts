import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cachePours } from "@/lib/pour-cache";
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
    const rows = initial?.signedIn ? initial.pours : initial ? SEED_POURS : [];
    if (rows.length) cachePours(rows);
    return rows;
  });
  const [fetched, setFetched] = useState(() => Boolean(initial));

  const signedIn = isPending ? Boolean(initial?.signedIn) : Boolean(user);
  const ready = fetched && (!isPending || initial != null);

  const reload = useCallback(async () => {
    if (!user) {
      setPours(SEED_POURS);
      return;
    }
    const rows = await listPours();
    cachePours(rows);
    setPours(rows);
  }, [user]);

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    if (!user) {
      setPours(SEED_POURS);
      setFetched(true);
      return;
    }
    listPours()
      .then((rows) => {
        if (!cancelled) {
          cachePours(rows);
          setPours(rows);
        }
      })
      .catch(() => {
        if (!cancelled && !initial?.signedIn) setPours([]);
      })
      .finally(() => {
        if (!cancelled) setFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending, initial?.signedIn]);

  return {
    pours,
    ready,
    signedIn,
    sessionPending: isPending,
    reload,
  };
}
