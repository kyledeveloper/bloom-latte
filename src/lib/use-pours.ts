import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cachePours, cachedOwnPours } from "@/lib/pour-cache";
import {
  loadGuestPours,
  migrateGuestPours,
  restoreIfNeeded,
} from "@/lib/local-backup";
import type { Pour } from "@/lib/pours";

export function usePours() {
  const { user, isPending } = useCurrentUserState();
  const [pours, setPours] = useState<Pour[]>(() => cachedOwnPours());
  const [fetched, setFetched] = useState(() => cachedOwnPours().length > 0);

  const signedIn = Boolean(user);
  const ready = fetched || !isPending;

  const reload = useCallback(async () => {
    if (user) {
      await migrateGuestPours(user.id);
      const rows = await restoreIfNeeded(user.id);
      setPours(rows);
    } else {
      const rows = await loadGuestPours();
      setPours(rows);
    }
  }, [user]);

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;

    void (async () => {
      if (user) {
        await migrateGuestPours(user.id);
        const rows = await restoreIfNeeded(user.id);
        if (cancelled) return;
        cachePours(rows);
        setPours(rows);
        setFetched(true);
      } else {
        const rows = await loadGuestPours();
        if (cancelled) return;
        cachePours(rows);
        setPours(rows);
        setFetched(true);
      }
    })();

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
