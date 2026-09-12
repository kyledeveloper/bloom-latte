import { PATTERNS, type PatternId } from "@/lib/pours";
import { PatternMark } from "@/components/pattern-mark";
import { cn } from "@/lib/utils";

export function PatternPicker({
  value,
  onChange,
}: {
  value: PatternId;
  onChange: (id: PatternId) => void;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      role="radiogroup"
      aria-label="拉花图案"
    >
      {PATTERNS.map((p) => {
        const selected = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.id)}
            className={cn(
              "flex min-h-20 flex-col items-center gap-1.5 rounded-lg px-1 py-2.5 text-center transition-[background-color,color,box-shadow,transform] duration-200 ease-out",
              selected
                ? "bg-primary text-primary-fg shadow-[var(--shadow-border)] scale-[1.02]"
                : "bg-surface text-fg shadow-[var(--shadow-border)] hover:bg-cream active:scale-[0.97]",
            )}
          >
            <PatternMark id={p.id} className="size-5" />
            <span className="text-xs font-medium leading-tight">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PatternFilter({
  value,
  onChange,
  counts,
}: {
  value: PatternId | "all";
  onChange: (id: PatternId | "all") => void;
  counts: Partial<Record<PatternId | "all", number>>;
}) {
  const chips: { id: PatternId | "all"; name: string }[] = [
    { id: "all", name: "全部" },
    ...PATTERNS.map((p) => ({ id: p.id, name: p.name })),
  ];
  return (
    <div className="no-scrollbar -mx-5 flex flex-nowrap gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {chips.map((chip) => {
        const selected = chip.id === value;
        const n = counts[chip.id] ?? 0;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-out",
              selected
                ? "bg-primary text-primary-fg scale-[1.03]"
                : "bg-surface text-muted shadow-[var(--shadow-border)] hover:text-fg active:scale-[0.97]",
            )}
          >
            {chip.name}
            <span className="tabular-nums opacity-70">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
