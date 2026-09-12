import { useEffect, useState } from "react";
import { usePourStore } from "@/lib/store";

export function useHydrated() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persistApi = usePourStore.persist;
    const finish = () => {
      usePourStore.getState().setHasHydrated(true);
      setReady(true);
    };
    if (!persistApi) {
      finish();
      return;
    }
    const unsub = persistApi.onFinishHydration(finish);
    void persistApi.rehydrate();
    if (persistApi.hasHydrated()) finish();
    return unsub;
  }, []);

  return ready;
}
