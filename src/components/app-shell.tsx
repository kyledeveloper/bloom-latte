import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  title,
  backTo,
  action,
  editorial,
  width = "narrow",
}: {
  children: ReactNode;
  title?: string;
  backTo?: "/";
  action?: ReactNode;
  editorial?: boolean;
  width?: "wide" | "medium" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto min-h-dvh w-full px-5 pb-[max(7rem,calc(env(safe-area-inset-bottom)+6rem))] pt-[max(1.25rem,env(safe-area-inset-top))]",
        width === "wide" && "max-w-5xl",
        width === "medium" && "max-w-4xl",
        width === "narrow" && "max-w-xl",
      )}
    >
      <header
        className={cn(
          "page-enter mb-6 flex items-center gap-3",
          editorial ? "items-center justify-between sm:items-start" : "min-h-11",
        )}
      >
        {editorial ? (
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Wordmark className="size-10 shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span className="font-display text-2xl font-medium tracking-tight">
                杯中花
              </span>
              <span className="hidden text-xs tracking-[0.18em] text-muted uppercase sm:inline">
                Bloom · 拉花手记
              </span>
            </span>
          </Link>
        ) : (
          <>
            {backTo ? (
              <Button variant="ghost" size="icon" className="-ml-2" asChild>
                <Link to={backTo} aria-label="返回">
                  <ChevronLeft className="size-5" />
                </Link>
              </Button>
            ) : (
              <Link to="/" className="flex items-center gap-2">
                <Wordmark className="size-8" />
              </Link>
            )}
            <h1 className="flex-1 font-display text-lg font-medium tracking-tight">
              {title}
            </h1>
          </>
        )}
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="page-enter [animation-delay:60ms]">{children}</div>
    </div>
  );
}
