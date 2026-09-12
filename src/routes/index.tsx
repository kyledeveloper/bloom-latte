import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PATTERNS, pourCardSrc, type PatternId } from "@/lib/pours";
import { SEED_POURS } from "@/lib/seed";
import { usePours } from "@/lib/use-pours";
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
              记录
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <p className="max-w-md text-muted">倒一杯，开一朵。</p>
        </div>

        {ready ? <StatsBar pours={ownPours} /> : <StatsSkeleton />}

        {ready && !signedIn ? (
          <div className="flex flex-col gap-2 rounded-lg bg-cream/80 px-3 py-2.5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>现在看到的是示例。登录后开始记你自己的拉花。</p>
            <Link
              to="/login"
              className="shrink-0 font-medium text-fg underline-offset-4 hover:underline"
            >
              登录
            </Link>
          </div>
        ) : null}

        {showExamples ? (
          <div className="rounded-lg bg-cream/80 px-3 py-2.5 text-sm text-muted">
            你的手记还是空的。下面是示例，点「记录」记第一杯。
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
              练得最多
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {ranked.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted">{p.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
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
        记录
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
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-14 text-center shadow-[var(--shadow-border)]">
      <Wordmark className="size-12" />
      <h2 className="font-display text-xl font-medium tracking-tight">
        {filtered ? "这个图案还是空白" : "还没有开出第一朵"}
      </h2>
      <p className="max-w-xs text-sm text-muted">
        {filtered
          ? "换个筛选，或者现在就去拉一杯这个形状。"
          : signedIn
            ? "倒一杯热牛奶，在浓缩上留下你的图案。"
            : "登录后开始记你自己的拉花。"}
      </p>
      <Button asChild size="pill" className="mt-2">
        <Link to="/new">
          <Camera />
          记录
        </Link>
      </Button>
    </div>
  );
}
