import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { readAuthHint, useCurrentUserState } from "@/lib/auth/use-current-user";
import { coldBackup } from "@/lib/local-backup";
import { notice } from "@/components/notice-host";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const hint = !user ? readAuthHint() : null;

  if (user) return <AccountMenu />;

  if (isPending && hint) {
    const label = hint.displayName ?? hint.primaryEmail ?? "账号";
    return (
      <span className="grid size-8 place-items-center rounded-full bg-cream text-sm font-medium">
        {label.charAt(0).toUpperCase()}
      </span>
    );
  }

  if (isPending) return <span className="inline-block size-8 rounded-full bg-cream" />;

  return (
    <Button asChild variant="secondary" size="sm">
      <Link to="/login">登录</Link>
    </Button>
  );
}

function AccountMenu() {
  const { user } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "账号";

  async function onBackup() {
    if (backingUp) return;
    setBackingUp(true);
    try {
      await coldBackup(user.id);
      setOpen(false);
      notice("已做冷备份。换设备时，空着手记登录会从这里恢复。");
    } catch (err) {
      notice(err instanceof Error ? err.message : "备份没完成，稍后再试。");
    } finally {
      setBackingUp(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="账号"
        onClick={() => setOpen((v) => !v)}
        className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-cream text-sm font-medium transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="size-8 object-cover"
          />
        ) : (
          label.charAt(0).toUpperCase()
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-40 w-44 rounded-xl bg-surface py-1.5 shadow-[var(--shadow-border)]"
        >
          <p className="truncate px-3 py-1.5 text-xs text-muted">{label}</p>
          <button
            type="button"
            role="menuitem"
            disabled={backingUp}
            onClick={() => void onBackup()}
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-cream/80 disabled:opacity-50"
          >
            {backingUp ? "备份中…" : "备份"}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut().catch(() => setSigningOut(false));
            }}
            className="flex w-full px-3 py-2 text-left text-sm text-muted hover:bg-cream/80 disabled:opacity-50"
          >
            {signingOut ? "正在退出…" : "退出"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
