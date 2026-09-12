import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

function isModuleScriptError(error: unknown): boolean {
  if (!error) return false;
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const lower = msg.toLowerCase();
  return (
    lower.includes("importing a module script failed") ||
    lower.includes("dynamically imported module") ||
    lower.includes("failed to fetch dynamically imported module") ||
    lower.includes("preload") ||
    lower.includes("chunk")
  );
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const [showDetail, setShowDetail] = useState(false);
  const isModuleError = isModuleScriptError(error);

  useEffect(() => {
    if (typeof window !== "undefined" && isModuleError) {
      try {
        const key = "bloom_chunk_reload_ts";
        const last = sessionStorage.getItem(key);
        const now = Date.now();
        if (!last || now - Number(last) > 10000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
        }
      } catch {
        // ignore session storage error
      }
    }
  }, [isModuleError]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12 text-center text-fg">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <div className="flex size-14 items-center justify-center rounded-full bg-cream text-primary">
          {isModuleError ? (
            <RotateCcw className="size-6 animate-[spin_4s_linear_infinite]" />
          ) : (
            <AlertCircle className="size-7 text-danger" />
          )}
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-lg font-semibold tracking-tight">
            {isModuleError ? "正在更新手记资源" : "页面加载遇到问题"}
          </h1>
          <p className="text-xs leading-relaxed text-muted">
            {isModuleError
              ? "手记已更新至新版本，或网络正在重新连接。点击下方按钮即可载入最新页面。"
              : "网络可能稍有波动或发生短暂异常。请尝试刷新重试，或直接返回首页。"}
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-2">
          <Button
            type="button"
            size="default"
            className="w-full gap-2 rounded-full font-medium"
            onClick={handleReload}
          >
            <RefreshCw className="size-4" />
            刷新重试
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted hover:text-fg"
            onClick={handleGoHome}
          >
            返回手记首页
          </Button>
        </div>

        <div className="mt-2 w-full border-t border-border/40 pt-2">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="text-[11px] text-subtle underline-offset-2 hover:underline"
          >
            {showDetail ? "收起错误信息" : "查看技术详情"}
          </button>
          {showDetail && (
            <p className="mt-2 max-w-full rounded bg-cream/60 p-2 text-left font-mono text-[10px] text-muted break-all">
              {errorMessage(error)}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
