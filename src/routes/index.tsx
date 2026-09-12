import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PATTERNS, pourCardSrc, type PatternId } from "@/lib/pours";
import { SEED_POURS } from "@/lib/seed";
import { usePours } from "@/lib/use-pours";
import { patternLabel, useLocale, useT } from "@/lib/i18n";
import { AppShell } from "@/components/app-shell";
import { AuthSlot } from "@/components/auth-slot";
import { PourCard } from "@/components/pour-card";
import { PatternFilter } from "@/components/pattern-picker";
import { StatsBar } from "@/components/stats-bar";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    links: SEED_POURS.slice(0, 4).map((p) => ({
      rel: "preload" as const,
      href: pourCardSrc(p),
      as: "image" as const,
    })),
  }),
  component: Home,
});

function Home() {
  const { pours, ready, signedIn } = usePours();
  const t = useT();
  const locale = useLocale();
  const [filter, setFilter] = useState<PatternId | "all">("all");
  const ownPours = signedIn ? pours : SEED_POURS;
  const gallery = signedIn ? pours : SEED_POURS;

  const counts = useMemo(() => {
    const next: Partial<Record<PatternId | "all", number>> = {
      all: gallery.length,
    };
    for (const p of PATTERNS) {
      next[p.id] = gallery.filter((x) => x.pattern === p.id).length;
    }
    return next;
  }, [gallery]);

  const visible =
    filter === "all" ? gallery : gallery.filter((p) => p.pattern === filter);
  const ranked = useMemo(() => {
    return PATTERNS.map((p) => ({
      ...p,
      n: ownPours.filter((x) => x.pattern === p.id).length,
    }))
      .filter((p) => p.n > 0)
      .sort((a, b) => b.n - a.n);
  }, [ownPours]);

  const showExamples = Boolean(ready && signedIn && pours.length === 0);

  return (
    <>
    <AppShell
      editorial
      width="wide"
      action={
        <div className="flex flex-col items-end gap-2">
          <AuthSlot />
          <Button
            asChild
            size="sm"
            className="hidden rounded-full sm:inline-flex"
          >
            <Link to="/new">
              <Camera />
              {t("record")}
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <p className="max-w-md text-muted">{t("tagline")}</p>
        </div>

        {ready ? <StatsBar pours={ownPours} /> : <StatsSkeleton />}

        {ready && !signedIn ? (
          <div className="flex flex-col gap-2 rounded-lg bg-cream/80 px-3 py-2.5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{t("examplesHint")}</p>
            <Link
              to="/login"
              className="shrink-0 font-medium text-fg underline-offset-4 hover:underline"
            >
              {t("signIn")}
            </Link>
          </div>
        ) : null}

        {showExamples ? (
          <div className="rounded-lg bg-cream/80 px-3 py-2.5 text-sm text-muted">
            {t("emptyHint")}
          </div>
        ) : (
          <PatternFilter value={filter} onChange={setFilter} counts={counts} />
        )}

        {!ready ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="rounded-xl bg-surface p-2 shadow-[var(--shadow-border)]"
              >
                <div className="aspect-square rounded-lg bg-cream" />
                <div className="mt-3 h-3 w-1/2 rounded-full bg-cream" />
              </div>
            ))}
          </div>
        ) : showExamples ? (
          <div className="stagger-in grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SEED_POURS.map((pour, i) => (
              <PourCard key={pour.id} pour={pour} priority={i < 4} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filtered={filter !== "all"} signedIn={signedIn} />
        ) : (
          <div
            key={filter}
            className="stagger-in grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {visible.map((pour, i) => (
              <PourCard key={pour.id} pour={pour} priority={i < 4} />
            ))}
          </div>
        )}

        {ready && ranked.length > 0 ? (
          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-base font-medium tracking-tight">
              {t("practicedMost")}
            </h2>
            <ul className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 text-sm">
              {ranked.map((p) => (
                <li key={p.id} className="contents">
                  <span className="whitespace-nowrap text-muted">
                    {patternLabel(p.id, locale)}
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-cream">
                    <span
                      className="bar-fill block h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max(8, (p.n / ownPours.length) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-6 text-right tabular-nums text-muted">
                    {p.n}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>

      <Link
        to="/new"
        className="fab-in fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg shadow-[var(--shadow-border)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.96] sm:hidden"
      >
        <Camera className="size-5" />
        {t("record")}
      </Link>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-xl bg-surface py-3 shadow-[var(--shadow-border)]">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 py-1">
          <div className="h-6 w-8 rounded-full bg-cream" />
          <div className="h-3 w-8 rounded-full bg-cream" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  filtered,
  signedIn,
}: {
  filtered: boolean;
  signedIn: boolean;
}) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-14 text-center shadow-[var(--shadow-border)]">
      <Wordmark className="size-12" />
      <h2 className="font-display text-xl font-medium tracking-tight">
        {filtered ? t("emptyFiltered") : t("emptyNone")}
      </h2>
      <p className="max-w-xs text-sm text-muted">
        {filtered
          ? t("emptyFilteredBody")
          : signedIn
            ? t("emptySignedInBody")
            : t("emptyGuestBody")}
      </p>
      <Button asChild size="pill" className="mt-2">
        <Link to="/new">
          <Camera />
          {t("record")}
        </Link>
      </Button>
    </div>
  );
}
