import { useEffect, useState } from "react";
import { emptyDraft, MILKS, type Pour, type PourDraft } from "@/lib/pours";
import { loadLocalPhoto } from "@/lib/photo-store";
import { milkLabel, useLocale, useT } from "@/lib/i18n";
import { PhotoField } from "@/components/photo-field";
import { PatternPicker } from "@/components/pattern-picker";
import { RatingPicker } from "@/components/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  loadPourTags,
  savePourTags,
  BEAN_SUGGESTIONS,
  GRIND_SUGGESTIONS,
  isTagActive,
  toggleTagInNotes,
  type PourTag,
} from "@/lib/pour-tags";
import { ManageTagsDialog } from "@/components/manage-tags-dialog";
import { Plus, SlidersHorizontal } from "lucide-react";

function toDateInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDateInput(value: string, fallbackIso?: string) {
  const previous = fallbackIso ? new Date(fallbackIso) : new Date();
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return previous.toISOString();
  const next = new Date(previous);
  next.setFullYear(y, m - 1, d);
  return next.toISOString();
}

export function PourForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Pour;
  submitLabel: string;
  onSubmit: (draft: PourDraft) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<PourDraft>(() =>
    initial
      ? {
          photo: initial.photo,
          pattern: initial.pattern,
          rating: initial.rating,
          beans: initial.beans,
          milk: initial.milk,
          grind: initial.grind,
          notes: initial.notes,
          createdAt: initial.createdAt,
        }
      : emptyDraft(),
  );
  const [date, setDate] = useState(toDateInput(initial?.createdAt));
  const [missingPhoto, setMissingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<PourTag[]>(() => loadPourTags());
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCategory, setManageCategory] = useState<"equipment" | "technique">("equipment");
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    setTags(loadPourTags());
  }, []);

  function handleSaveTags(nextTags: PourTag[]) {
    setTags(nextTags);
    savePourTags(nextTags);
  }

  function handleTagRenamed(oldLabel: string, newLabel: string) {
    if (!oldLabel || !newLabel || oldLabel === newLabel) return;
    if (draft.notes.includes(oldLabel)) {
      set("notes", draft.notes.replaceAll(oldLabel, newLabel));
    }
  }

  useEffect(() => {
    if (!initial?.id) return;
    if (initial.photo.startsWith("data:")) return;
    let alive = true;
    void loadLocalPhoto(initial.id).then((local) => {
      if (!alive || !local) return;
      if (typeof local === "string") {
        if (local.startsWith("data:")) set("photo", local);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (alive && typeof reader.result === "string") set("photo", reader.result);
      };
      reader.readAsDataURL(local);
    });
    return () => {
      alive = false;
    };
  }, [initial?.id, initial?.photo]);

  function set<K extends keyof PourDraft>(key: K, value: PourDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.photo) {
          setMissingPhoto(true);
          return;
        }
        setSaving(true);
        void Promise.resolve(
          onSubmit({
            ...draft,
            createdAt: fromDateInput(date, draft.createdAt),
          }),
        ).finally(() => setSaving(false));
      }}
    >
      <PhotoField
        value={draft.photo}
        onChange={(photo) => {
          setMissingPhoto(false);
          set("photo", photo);
        }}
      />
      {missingPhoto ? (
        <p className="-mt-4 text-sm text-danger">{t("needPhoto")}</p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <Label asChild>
          <legend>{t("pattern")}</legend>
        </Label>
        <PatternPicker value={draft.pattern} onChange={(id) => set("pattern", id)} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <Label asChild>
          <legend>{t("rating")}</legend>
        </Label>
        <RatingPicker value={draft.rating} onChange={(n) => set("rating", n)} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="beans">{t("beans")}</Label>
          <Input
            id="beans"
            value={draft.beans}
            placeholder={t("beansPh")}
            onChange={(e) => set("beans", e.target.value)}
          />
          <div className="flex flex-wrap gap-1 pt-0.5">
            {BEAN_SUGGESTIONS.map((b) => {
              const label = locale === "en" ? b.en : b.zh;
              const isSelected = draft.beans === label;
              return (
                <button
                  key={b.zh}
                  type="button"
                  onClick={() => set("beans", isSelected ? "" : label)}
                  className={
                    isSelected
                      ? "h-6 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-fg shadow-xs transition-colors"
                      : "h-6 rounded-md bg-cream/70 px-2 text-[11px] text-muted transition-colors hover:bg-cream hover:text-fg"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grind">{t("grind")}</Label>
          <Input
            id="grind"
            value={draft.grind}
            placeholder={t("grindPh")}
            onChange={(e) => set("grind", e.target.value)}
          />
          <div className="flex flex-wrap gap-1 pt-0.5">
            {GRIND_SUGGESTIONS.map((g) => {
              const label = locale === "en" ? g.en : g.zh;
              const isSelected = draft.grind === label;
              return (
                <button
                  key={g.zh}
                  type="button"
                  onClick={() => set("grind", isSelected ? "" : label)}
                  className={
                    isSelected
                      ? "h-6 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-fg shadow-xs transition-colors"
                      : "h-6 rounded-md bg-cream/70 px-2 text-[11px] text-muted transition-colors hover:bg-cream hover:text-fg"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="milk">{t("milk")}</Label>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {MILKS.map((m) => {
            const selected = draft.milk === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => set("milk", m)}
                className={
                  selected
                    ? "h-9 shrink-0 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-fg"
                    : "h-9 shrink-0 rounded-full bg-surface px-3.5 text-sm font-medium text-muted shadow-[var(--shadow-border)]"
                }
              >
                {milkLabel(m, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">{t("date")}</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="notes">{t("notes")}</Label>
          <button
            type="button"
            onClick={() => {
              setManageCategory("equipment");
              setManageOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-fg"
          >
            <SlidersHorizontal className="size-3" />
            <span>{t("manageTags")}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl bg-surface/80 p-3 shadow-[var(--shadow-border)]">
          {/* Group 1: 器具与杯型 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium tracking-wide text-subtle">
              {t("equipmentAndCup")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tags
                .filter((t) => t.category === "equipment")
                .map((tag) => {
                  const active = isTagActive(draft.notes, tag);
                  const label = locale === "en" ? tag.labelEn : tag.labelZh;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => set("notes", toggleTagInNotes(draft.notes, tag, locale))}
                      className={
                        active
                          ? "flex h-7 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-medium text-primary-fg shadow-xs transition-all active:scale-95"
                          : "flex h-7 items-center gap-1 rounded-full bg-cream/70 px-2.5 text-xs font-medium text-muted transition-all hover:bg-cream hover:text-fg active:scale-95"
                      }
                    >
                      <span className="text-[10px] leading-none opacity-80">{active ? "✓" : "+"}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              <button
                type="button"
                onClick={() => {
                  setManageCategory("equipment");
                  setManageOpen(true);
                }}
                className="flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-2 text-xs text-muted transition-colors hover:border-primary/50 hover:text-fg active:scale-95"
                title={t("addTag")}
              >
                <Plus className="size-3" />
                <span>{t("customTag")}</span>
              </button>
            </div>
          </div>

          {/* Group 2: 手法复盘 */}
          <div className="flex flex-col gap-1.5 border-t border-border/40 pt-1.5">
            <span className="text-[11px] font-medium tracking-wide text-subtle">
              {t("techniqueAndFoam")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tags
                .filter((t) => t.category === "technique")
                .map((tag) => {
                  const active = isTagActive(draft.notes, tag);
                  const label = locale === "en" ? tag.labelEn : tag.labelZh;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => set("notes", toggleTagInNotes(draft.notes, tag, locale))}
                      className={
                        active
                          ? "flex h-7 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-medium text-primary-fg shadow-xs transition-all active:scale-95"
                          : "flex h-7 items-center gap-1 rounded-full bg-cream/70 px-2.5 text-xs font-medium text-muted transition-all hover:bg-cream hover:text-fg active:scale-95"
                      }
                    >
                      <span className="text-[10px] leading-none opacity-80">{active ? "✓" : "+"}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              <button
                type="button"
                onClick={() => {
                  setManageCategory("technique");
                  setManageOpen(true);
                }}
                className="flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-2 text-xs text-muted transition-colors hover:border-primary/50 hover:text-fg active:scale-95"
                title={t("addTag")}
              >
                <Plus className="size-3" />
                <span>{t("customTag")}</span>
              </button>
            </div>
          </div>
        </div>

        <Textarea
          id="notes"
          maxLength={280}
          rows={3}
          value={draft.notes}
          placeholder={t("notesPh")}
          onChange={(e) => set("notes", e.target.value)}
        />
        <p className="text-right text-xs text-subtle tabular-nums">
          {draft.notes.length}/280
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? t("saving") : submitLabel}
      </Button>

      <ManageTagsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        tags={tags}
        onChangeTags={handleSaveTags}
        initialCategory={manageCategory}
        onTagRenamed={handleTagRenamed}
      />
    </form>
  );
}
