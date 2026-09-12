import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Route as RootRoute } from "@/routes/__root";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { sessionUser } = RootRoute.useRouteContext();
  const { user } = useCurrentUserState();

  if (user || sessionUser) return <Navigate to="/" />;

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Link to="/" className="flex flex-col items-center gap-3">
          <Wordmark className="size-14" />
          <span className="font-display text-3xl font-medium tracking-tight">
            杯中花
          </span>
        </Link>
        <p className="text-muted">
          登录之后，拉花跟着账号走。换手机打开同一个网页，本子还在。
        </p>
        <div className="flex w-full flex-col gap-2">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
            >
              使用 {p.label} 继续
            </Button>
          ))}
        </div>
        <Link to="/" className="text-sm text-muted underline-offset-4 hover:underline">
          先看看示例
        </Link>
      </div>
    </main>
  );
}
