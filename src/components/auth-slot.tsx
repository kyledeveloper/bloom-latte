import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Route as RootRoute } from "@/routes/__root";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { coldBackup } from "@/lib/local-backup";
import { notice } from "@/components/notice-host";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { sessionUser } = RootRoute.useRouteContext();
  const { user } = useCurrentUserState();
  const [backingUp, setBackingUp] = useState(false);

  async function onBackup() {
    if (!user || backingUp) return;
    setBackingUp(true);
    try {
      await coldBackup(user.id);
      notice("已做冷备份。换设备时，空着手记登录会从这里恢复。");
    } catch (err) {
      notice(err instanceof Error ? err.message : "备份没完成，稍后再试。");
    } finally {
      setBackingUp(false);
    }
  }

  if (user) {
    return (
      <div className="flex min-w-0 max-w-[70vw] items-center gap-1 sm:max-w-none">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted"
          disabled={backingUp}
          onClick={() => void onBackup()}
        >
          {backingUp ? "备份中…" : "备份"}
        </Button>
        <div className="min-w-0 [&>div>span:nth-child(2)]:max-sm:hidden">
          <UserButton />
        </div>
      </div>
    );
  }

  if (sessionUser) {
    const label = sessionUser.email ?? "账号";
    return (
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-cream text-sm font-medium">
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium sm:inline">{label}</span>
      </div>
    );
  }

  return (
    <Button asChild variant="secondary" size="sm">
      <Link to="/login">登录</Link>
    </Button>
  );
}
