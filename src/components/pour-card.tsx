import { Link } from "@tanstack/react-router";
import { formatShortDate, patternOf, pourCardSrc, type Pour } from "@/lib/pours";
import { cachePour } from "@/lib/pour-cache";
import { PatternMark } from "@/components/pattern-mark";
import { PourPhoto } from "@/components/pour-photo";
import { Badge } from "@/components/ui/badge";

export function PourCard({
  pour,
  priority = false,
}: {
  pour: Pour;
  priority?: boolean;
}) {
  const pattern = patternOf(pour.pattern);
  return (
    <Link
      to="/pour/$id"
      params={{ id: pour.id }}
      state={{ pour } as never}
      onClick={() => cachePour(pour)}
      onPointerDown={() => cachePour(pour)}
      className="group block rounded-xl bg-surface p-2 shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="relative overflow-hidden rounded-lg bg-cream">
        <PourPhoto
          src={pourCardSrc(pour)}
          alt={`${pattern.name}拉花`}
          priority={priority}
        />
        {pour.demo ? (
          <Badge className="absolute top-2 left-2 bg-surface/90 text-muted backdrop-blur-sm">
            示例
          </Badge>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-2 px-1.5 pt-2.5 pb-1">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="text-muted">
              <PatternMark id={pour.pattern} className="size-3.5" />
            </span>
            <span className="truncate">{pattern.name}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {formatShortDate(pour.createdAt)}
            {pour.grind ? ` · ${pour.grind}` : ""}
          </p>
        </div>
        <span className="font-display text-sm tabular-nums text-muted">
          {pour.rating}
        </span>
      </div>
    </Link>
  );
}
