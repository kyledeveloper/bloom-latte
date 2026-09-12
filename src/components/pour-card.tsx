import { Link } from "@tanstack/react-router";
import { formatShortDate, pourCardSrc, type Pour } from "@/lib/pours";
import { cachePour } from "@/lib/pour-cache";
import { patternLabel, useLocale, useT } from "@/lib/i18n";
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
  const locale = useLocale();
  const t = useT();
  const name = patternLabel(pour.pattern, locale);
  return (
    <Link
      to="/pour/$id"
      params={{ id: pour.id }}
      state={{ pour } as never}
      onClick={() => cachePour(pour)}
      onPointerDown={() => cachePour(pour)}
      className="group block rounded-xl bg-surface p-2 shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_-16px_color-mix(in_oklab,var(--color-fg)_28%,transparent)] active:scale-[0.98]"
    >
      <div className="relative overflow-hidden rounded-lg bg-cream">
        <PourPhoto
          src={pourCardSrc(pour)}
          alt={`${name}`}
          pourId={pour.demo ? undefined : pour.id}
          priority={priority}
        />
        {pour.demo ? (
          <Badge className="absolute top-2 left-2 bg-surface/90 text-muted backdrop-blur-sm">
            {t("demo")}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-2 px-1.5 pt-2.5 pb-1">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="text-muted">
              <PatternMark id={pour.pattern} className="size-3.5" />
            </span>
            <span className="truncate">{name}</span>
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
