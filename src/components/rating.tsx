import { cn } from "@/lib/utils";

function Cup({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        d="M6 8h9a1 1 0 0 1 1 1v4.5A4.5 4.5 0 0 1 11.5 18h-1A4.5 4.5 0 0 1 6 13.5V8Z"
        strokeLinejoin="round"
      />
      <path d="M16 9.5h1.6A2.4 2.4 0 0 1 20 11.9v0A2.4 2.4 0 0 1 17.6 14H16" />
      <path d="M7 19.5h8" strokeLinecap="round" />
    </svg>
  );
}

export function RatingStars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-fg", className)}
      aria-label={`${value} 分`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < value ? "text-fg" : "text-subtle"}
        >
          <Cup filled={i < value} />
        </span>
      ))}
    </span>
  );
}

export function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="评分">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} 分`}
            onClick={() => onChange(n)}
            className={cn(
              "flex size-11 items-center justify-center rounded-md transition-colors duration-150",
              active ? "text-fg" : "text-subtle hover:text-muted",
            )}
          >
            <Cup filled={active} />
          </button>
        );
      })}
    </div>
  );
}
