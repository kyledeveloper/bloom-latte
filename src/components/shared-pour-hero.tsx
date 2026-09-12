import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, Flame, Sparkles, X } from "lucide-react";
import { patternLabel, useLocale, useT } from "@/lib/i18n";
import type { SharedPourData } from "@/lib/share-payload";
import { PatternMark } from "@/components/pattern-mark";
import { RatingStars } from "@/components/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/pours";
import { loadLocalPhoto } from "@/lib/photo-store";
import { cn } from "@/lib/utils";

export function SharedPourHero({
  data,
  onDismiss,
}: {
  data: SharedPourData;
  onDismiss?: () => void;
}) {
  const t = useT();
  const locale = useLocale();

  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setPhotoFailed(false);
    setPhotoLoading(true);

    async function resolvePhoto() {
      // 1. Explicit static/public image path
      if (data.photo && !data.photo.startsWith("data:")) {
        if (active) {
          setPhotoSrc(data.photo);
          setPhotoLoading(false);
        }
        return;
      }

      // 2. Try loading from local IndexedDB if on creator's device
      if (data.id) {
        try {
          const local = await loadLocalPhoto(data.id);
          if (active && local) {
            if (typeof local === "string") {
              setPhotoSrc(local);
              setPhotoLoading(false);
              return;
            }
            if (local instanceof Blob) {
              objectUrl = URL.createObjectURL(local);
              setPhotoSrc(objectUrl);
              setPhotoLoading(false);
              return;
            }
          }
        } catch {
          // ignore local idb error
        }

        // 3. Remote endpoint for friend / cross-device access
        if (active) {
          setPhotoSrc(`/api/pours/${data.id}/photo`);
          return;
        }
      }

      if (active) {
        setPhotoSrc(null);
        setPhotoLoading(false);
      }
    }

    void resolvePhoto();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data.id, data.photo]);

  const authorName = data.userName || t("anonymousFriend");
  const patternName = patternLabel(data.pattern, locale);

  // Parse notes for tag capsules if separated by '、' or ' · ' or ','
  const noteTokens = data.notes
    ? data.notes
        .split(/[、,·\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const recipe = [data.beans, data.grind, data.milk]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-[var(--shadow-border)] transition-all">
      {/* Dismiss button */}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-muted transition-colors hover:bg-cream hover:text-fg"
          title={t("closeSharedBanner")}
        >
          <X className="size-4" />
        </button>
      ) : null}

      {/* Top Banner: Friend's journal badge */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Sparkles className="size-3.5 text-amber-600" />
        <span>{t("sharedFromFriend")}</span>
      </div>

      {/* Main Practice Title */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg shadow-xs">
            {authorName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
              {t("friendPracticeTitle", {
                name: authorName,
                day: data.dayNumber,
              })}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              {data.streak && data.streak > 1 ? (
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <Flame className="size-3 text-amber-600" />
                  {t("streakDaysCount", { n: data.streak })}
                </span>
              ) : null}
              {data.cupNumber ? (
                <span className="tabular-nums">
                  {t("cupCountBadge", { n: data.cupNumber })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Pattern & Rating pill */}
        <div className="flex items-center gap-2 rounded-xl bg-cream/70 px-3 py-1.5 border border-border/50">
          <PatternMark id={data.pattern} className="size-4 text-primary" />
          <span className="text-sm font-medium text-fg">{patternName}</span>
          <span className="text-muted">·</span>
          <RatingStars value={data.rating} />
        </div>
      </div>

      {/* Cup Photo Showcase */}
      <div className="relative mt-3.5 aspect-[4/3] max-h-[360px] w-full overflow-hidden rounded-xl bg-cream/70 border border-border/60 shadow-inner flex items-center justify-center">
        {photoSrc && !photoFailed ? (
          <>
            {photoLoading && (
              <div className="absolute inset-0 animate-pulse bg-cream/80" />
            )}
            <img
              src={photoSrc}
              alt={patternName}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                photoLoading ? "opacity-0" : "opacity-100",
              )}
              onLoad={() => setPhotoLoading(false)}
              onError={() => {
                setPhotoFailed(true);
                setPhotoLoading(false);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none text-white drop-shadow">
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium backdrop-blur-xs">
                <PatternMark id={data.pattern} className="size-3.5 text-amber-300" />
                <span>{patternName}</span>
                <span className="text-white/60">·</span>
                <RatingStars value={data.rating} />
              </div>
              {data.createdAt ? (
                <span className="text-[11px] font-mono text-white/80">
                  {formatShortDate(data.createdAt)}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          /* Graceful illustration fallback if photo is unavailable */
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-cream shadow-xs border-2 border-border/40">
              <PatternMark id={data.pattern} className="size-10 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-semibold text-fg">{patternName}</p>
            <div className="mt-1 flex items-center justify-center">
              <RatingStars value={data.rating} />
            </div>
          </div>
        )}
      </div>

      {/* Tags / Recipe / Notes Box */}
      <div className="mt-4 flex flex-col gap-2.5 rounded-xl bg-cream/35 p-3.5 border border-border/40">
        {recipe ? (
          <p className="text-xs text-muted">
            <span className="font-medium text-fg">{recipe}</span>
          </p>
        ) : null}

        {noteTokens.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {noteTokens.map((token, idx) => (
              <Badge
                key={`${token}-${idx}`}
                variant="outline"
                className="bg-surface/80 text-[11px] font-normal"
              >
                {token}
              </Badge>
            ))}
          </div>
        ) : null}

        {data.notes && noteTokens.length === 0 ? (
          <p className="text-xs leading-relaxed text-fg italic">
            “{data.notes}”
          </p>
        ) : null}
      </div>

      {/* High-Converting Call to Action */}
      <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <div className="w-full sm:w-auto flex-1">
          <Button
            asChild
            size="lg"
            className="w-full gap-2 text-sm font-semibold shadow-md transition-transform active:scale-[0.99]"
          >
            <Link to="/new">
              <Camera className="size-4 text-amber-300" />
              <span>{t("joinAndRecordCTA")}</span>
            </Link>
          </Button>
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted transition-colors hover:text-fg hover:underline underline-offset-4 py-1.5 px-2"
          >
            {t("browseJournal")}
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-center sm:text-left text-[11px] text-subtle">
        {t("joinAndRecordSub")}
      </p>
    </section>
  );
}
