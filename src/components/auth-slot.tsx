import { Link } from "@tanstack/react-router";
import { Route as RootRoute } from "@/routes/__root";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { sessionUser } = RootRoute.useRouteContext();
  const { user } = useCurrentUserState();

  if (user) {
    return (
      <div className="max-w-[46vw] min-w-0 sm:max-w-none [&>div>span:nth-child(2)]:max-sm:hidden">
        <UserButton />
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
