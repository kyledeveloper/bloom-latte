import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cachePours, cachedOwnPours } from "@/lib/pour-cache";
import { restoreIfNeeded } from "@/lib/local-backup";
import { SEED_POURS } from "@/lib/seed";
import type { Pour } from "@/lib/pours";

export function usePours() {
  const { user, isPending } = useCurrentUserState();
  const [pours, setPours] = useState<Pour[]>(() => cachedOwnPours());
  const [fetched, setFetched] = useState(() => cachedOwnPours().length > 0);

  const signedIn = Boolean(user) || (isPending && cachedOwnPours().length > 0);
  const ready = fetched || !isPending;

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
    void restoreIfNeeded(user.id).then((rows) => {
      if (cancelled) return;
      cachePours(rows);
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
