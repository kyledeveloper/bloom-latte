import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cachePours, cachedOwnPours } from "@/lib/pour-cache";
import { restoreIfNeeded } from "@/lib/local-backup";
import { SEED_POURS } from "@/lib/seed";
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
    () =>
      (Boolean(initial) && !initial?.signedIn) || cachedOwnPours().length > 0,
  );

  const signedIn = isPending ? Boolean(initial?.signedIn) : Boolean(user);
  const ready = fetched && (!isPending || initial != null);

  const reload = useCallback(async () => {
    if (!user) {
      setPours(SEED_POURS);
      return;
    }
    const rows = await restoreIfNeeded(user.id);
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
    const userId = user.id;
    void restoreIfNeeded(userId).then((rows) => {
      if (cancelled) return;
      setPours(rows);
      setFetched(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  return {
    pours,
    ready,
    signedIn,
    sessionPending: isPending,
    reload,
  };
}
