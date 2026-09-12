import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-11 shrink-0 rounded-full bg-cream" aria-hidden />;
  }
  if (user) {
    return (
      <div className="max-w-[46vw] min-w-0 sm:max-w-none [&>div>span:nth-child(2)]:max-sm:hidden">
        <UserButton />
      </div>
    );
  }
  return (
    <Button asChild variant="secondary" size="sm">
      <Link to="/login">登录</Link>
    </Button>
  );
}
