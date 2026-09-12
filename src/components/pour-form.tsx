import { useState } from "react";
import { emptyDraft, MILKS, type Pour, type PourDraft } from "@/lib/pours";
import { PhotoField } from "@/components/photo-field";
import { PatternPicker } from "@/components/pattern-picker";
import { RatingPicker } from "@/components/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        <p className="-mt-4 text-sm text-danger">先拍一张，再记下这杯。</p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <Label asChild>
          <legend>图案</legend>
        </Label>
        <PatternPicker value={draft.pattern} onChange={(id) => set("pattern", id)} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <Label asChild>
          <legend>评分</legend>
        </Label>
        <RatingPicker value={draft.rating} onChange={(n) => set("rating", n)} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="beans">豆子</Label>
          <Input
            id="beans"
            value={draft.beans}
            placeholder="埃塞俄比亚 古吉"
            onChange={(e) => set("beans", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grind">研磨度</Label>
          <Input
            id="grind"
            value={draft.grind}
            placeholder="中细 / EK43 8.5"
            onChange={(e) => set("grind", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="milk">奶</Label>
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
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">日期</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">笔记</Label>
        <Textarea
          id="notes"
          maxLength={280}
          value={draft.notes}
          placeholder="奶泡细不细，收口偏哪边，下次改什么。"
          onChange={(e) => set("notes", e.target.value)}
        />
        <p className="text-right text-xs text-subtle tabular-nums">
          {draft.notes.length}/280
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "保存中…" : submitLabel}
      </Button>
    </form>
  );
}
