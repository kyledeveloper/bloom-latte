import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, Coffee, SlidersHorizontal, Smartphone } from "lucide-react";
import { useT } from "@/lib/i18n";
import { isOnboardingDone, markOnboardingDone } from "@/lib/use-onboarding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Step definitions ─────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4;

const STEP_ICONS: Record<StepId, React.ReactNode> = {
  1: <Coffee className="size-8 text-primary/70" />,
  2: <Camera className="size-8 text-primary/70" />,
  3: <SlidersHorizontal className="size-8 text-primary/70" />,
  4: <Smartphone className="size-8 text-primary/70" />,
};

// ── Main component ────────────────────────────────────────────────────────────

export function OnboardingDrawer() {
  const t = useT();

  // Start hidden; reveal after hydration check so SSR never flashes it.
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<StepId>(1);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!isOnboardingDone()) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => {
      markOnboardingDone();
      setVisible(false);
    }, 320);
  }

  function next() {
    if (step < 4) setStep((s) => (s + 1) as StepId);
    else dismiss();
  }

  function prev() {
    if (step > 1) setStep((s) => (s - 1) as StepId);
  }

  if (!visible) return null;

  const isLast = step === 4;
  const TOTAL = 4;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-fg/30 transition-opacity duration-300",
          leaving ? "opacity-0" : "opacity-100",
        )}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("obTitle1")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[91] flex flex-col rounded-t-2xl bg-surface px-6 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] pt-5 shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out",
          leaving ? "translate-y-full" : "translate-y-0",
        )}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        {/* Step counter + skip */}
        <div className="mb-5 flex items-center justify-between text-xs text-muted">
          <span className="tabular-nums">
            {t("obStep", { current: step, total: TOTAL })}
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="rounded px-2 py-1 transition-colors hover:text-fg"
          >
            {t("obSkip")}
          </button>
        </div>

        {/* Step content — animate on change */}
        <StepCard step={step} />

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-1.5">
          {([1, 2, 3, 4] as StepId[]).map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Step ${n}`}
              onClick={() => setStep(n)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                n === step
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-border hover:bg-muted",
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="mt-5 flex gap-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={prev}
            >
              {t("obPrev")}
            </Button>
          ) : null}

          {isLast ? (
            <Button
              type="button"
              size="lg"
              className="flex-1 rounded-full"
              asChild
              onClick={dismiss}
            >
              <Link to="/new">
                <Camera className="size-4" />
                {t("obFinish")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="flex-1 rounded-full"
              onClick={next}
            >
              {t("obNext")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Individual step card ──────────────────────────────────────────────────────

function StepCard({ step }: { step: StepId }) {
  const t = useT();

  const titles: Record<StepId, string> = {
    1: t("obTitle1"),
    2: t("obTitle2"),
    3: t("obTitle3"),
    4: t("obTitle4"),
  };

  const bodies: Record<StepId, string> = {
    1: t("obBody1"),
    2: t("obBody2"),
    3: t("obBody3"),
    4: t("obBody4"),
  };

  return (
    <div
      key={step}
      className="flex flex-col gap-3"
      style={{ animation: "page-in 320ms cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {/* Icon circle */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cream">
        {STEP_ICONS[step]}
      </div>

      <h2 className="font-display text-xl font-medium tracking-tight text-fg">
        {titles[step]}
      </h2>

      <p className="text-sm leading-relaxed text-muted">{bodies[step]}</p>
    </div>
  );
}
