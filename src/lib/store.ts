import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { SEED_POURS } from "@/lib/seed";
import { newId, type Pour, type PourDraft } from "@/lib/pours";

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

type PourState = {
  pours: Pour[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addPour: (draft: PourDraft) => Pour;
  updatePour: (id: string, draft: PourDraft) => void;
  deletePour: (id: string) => void;
  clearDemos: () => void;
};

export const usePourStore = create<PourState>()(
  persist(
    (set, get) => ({
      pours: SEED_POURS,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addPour: (draft) => {
        const pour: Pour = {
          id: newId(),
          createdAt: draft.createdAt ?? new Date().toISOString(),
          photo: draft.photo,
          pattern: draft.pattern,
          rating: draft.rating,
          beans: draft.beans.trim(),
          milk: draft.milk,
          grind: draft.grind.trim(),
          notes: draft.notes.trim(),
        };
        set({ pours: [pour, ...get().pours] });
        return pour;
      },
      updatePour: (id, draft) => {
        set({
          pours: get().pours.map((p) =>
            p.id === id
              ? {
                  ...p,
                  createdAt: draft.createdAt ?? p.createdAt,
                  photo: draft.photo,
                  pattern: draft.pattern,
                  rating: draft.rating,
                  beans: draft.beans.trim(),
                  milk: draft.milk,
                  grind: draft.grind.trim() || p.grind,
                  notes: draft.notes.trim(),
                  demo: false,
                }
              : p,
          ),
        });
      },
      deletePour: (id) => {
        set({ pours: get().pours.filter((p) => p.id !== id) });
      },
      clearDemos: () => {
        set({ pours: get().pours.filter((p) => !p.demo) });
      },
    }),
    {
      name: "bloom-latte-journal",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage : localStorage,
      ),
      partialize: (state) => ({ pours: state.pours }),
      skipHydration: true,
    },
  ),
);
