import { useState } from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import {
  createCustomTag,
  deleteTag,
  resetDefaultPourTags,
  updateTagLabel,
  type PourTag,
} from "@/lib/pour-tags";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ManageTagsDialog({
  open,
  onOpenChange,
  tags,
  onChangeTags,
  initialCategory = "equipment",
  onTagRenamed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: PourTag[];
  onChangeTags: (tags: PourTag[]) => void;
  initialCategory?: "equipment" | "technique";
  onTagRenamed?: (oldLabel: string, newLabel: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<"equipment" | "technique">(
    initialCategory,
  );
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const categoryTags = tags.filter((t) => t.category === activeCategory);

  function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    // Check if tag already exists in this category
    const exists = tags.some(
      (t) =>
        t.category === activeCategory &&
        (t.labelZh.toLowerCase() === trimmed.toLowerCase() ||
          t.labelEn.toLowerCase() === trimmed.toLowerCase()),
    );
    if (exists) {
      setError(t("tagAlreadyExists"));
      return;
    }

    const newTag = createCustomTag(trimmed, activeCategory);
    const next = [...tags, newTag];
    onChangeTags(next);
    setNewTagName("");
    setError(null);
  }

  function startEdit(tag: PourTag) {
    setEditingId(tag.id);
    setEditName(locale === "en" ? tag.labelEn : tag.labelZh);
    setError(null);
  }

  function saveEdit(tag: PourTag) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const oldLabel = locale === "en" ? tag.labelEn : tag.labelZh;
    if (trimmed !== oldLabel) {
      const next = updateTagLabel(tags, tag.id, trimmed, locale);
      onChangeTags(next);
      onTagRenamed?.(oldLabel, trimmed);
    }
    setEditingId(null);
    setError(null);
  }

  function handleDelete(id: string) {
    const next = deleteTag(tags, id);
    onChangeTags(next);
    if (editingId === id) setEditingId(null);
    setError(null);
  }

  function handleResetDefaults() {
    if (window.confirm(t("resetTagsConfirm"))) {
      const defaults = resetDefaultPourTags();
      onChangeTags(defaults);
      setEditingId(null);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[min(100%-2rem,32rem)] overflow-hidden flex flex-col p-5">
        <DialogHeader className="gap-1">
          <DialogTitle>{t("manageTagsTitle")}</DialogTitle>
          <DialogDescription>{t("manageTagsDesc")}</DialogDescription>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-border/50 pb-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("equipment");
              setEditingId(null);
              setError(null);
            }}
            className={
              activeCategory === "equipment"
                ? "h-8 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-fg shadow-xs transition-colors"
                : "h-8 rounded-full bg-cream/70 px-3.5 text-xs font-medium text-muted transition-colors hover:bg-cream hover:text-fg"
            }
          >
            {t("equipmentAndCup")}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("technique");
              setEditingId(null);
              setError(null);
            }}
            className={
              activeCategory === "technique"
                ? "h-8 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-fg shadow-xs transition-colors"
                : "h-8 rounded-full bg-cream/70 px-3.5 text-xs font-medium text-muted transition-colors hover:bg-cream hover:text-fg"
            }
          >
            {t("techniqueAndFoam")}
          </button>
        </div>

        {/* Add Tag Form */}
        <form onSubmit={handleAddTag} className="flex gap-2 pt-1">
          <Input
            value={newTagName}
            placeholder={t("addTagPlaceholder")}
            onChange={(e) => {
              setNewTagName(e.target.value);
              if (error) setError(null);
            }}
            className="h-9 text-sm"
          />
          <Button type="submit" size="sm" className="shrink-0 gap-1 px-3">
            <Plus className="size-4" />
            <span>{t("addTag")}</span>
          </Button>
        </form>
        {error ? <p className="-mt-1 text-xs text-danger">{error}</p> : null}

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5 py-1">
            {categoryTags.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">
                {locale === "en" ? "No tags in this category" : "当前分类暂无标签"}
              </p>
            ) : (
              categoryTags.map((tag) => {
                const isEditing = editingId === tag.id;
                const label = locale === "en" ? tag.labelEn : tag.labelZh;

                if (isEditing) {
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-1.5 rounded-lg bg-cream/50 p-1.5 border border-border/60"
                    >
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEdit(tag);
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => saveEdit(tag)}
                        className="h-8 w-8 p-0"
                        title={t("save")}
                      >
                        <Check className="size-3.5 text-primary" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-8 w-8 p-0"
                        title={t("cancel")}
                      >
                        <X className="size-3.5 text-muted" />
                      </Button>
                    </div>
                  );
                }

                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between rounded-lg bg-cream/40 px-3 py-2 text-sm transition-colors hover:bg-cream/70"
                  >
                    <span className="font-medium text-fg truncate">{label}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => startEdit(tag)}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-cream hover:text-fg"
                        title={t("editTag")}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-cream hover:text-danger"
                        title={t("deleteTag")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border/40 pt-3 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="gap-1.5 text-xs text-muted hover:text-fg"
          >
            <RotateCcw className="size-3.5" />
            <span>{t("resetDefaultTags")}</span>
          </Button>
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
