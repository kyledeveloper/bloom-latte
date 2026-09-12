import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  GROK_PROVIDERS,
  authClient,
  signIn,
} from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Route as RootRoute } from "@/routes/__root";
import { notice } from "@/components/notice-host";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function socialLoginAllowed(grokOAuth: boolean) {
  if (grokOAuth) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host.endsWith(".grok-sandbox.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

export const Route = createFileRoute("/login")({
  loader: () => ({
    grokOAuth: Boolean(process.env.GROK_AUTH_CLIENT_ID?.trim()),
  }),
  component: Login,
});

function Login() {
  const { grokOAuth } = Route.useLoaderData();
  const { sessionUser } = RootRoute.useRouteContext();
  const { user } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  useEffect(() => {
    setShowSocial(socialLoginAllowed(grokOAuth));
  }, [grokOAuth]);

  if (user || sessionUser) return <Navigate to="/" />;

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] || "杯中花",
        });
        if (error) throw new Error(error.message ?? "注册失败");
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message ?? "登录失败");
      }
      window.location.href = "/";
    } catch (err) {
      notice(err instanceof Error ? err.message : "没登录上，再试一次。");
      setBusy(false);
    }
  }

  async function onSocial(providerId: string) {
    try {
      await signIn(providerId, { callbackURL: "/" });
    } catch (err) {
      notice(
        err instanceof Error
          ? err.message
          : "Google / X 在这个网站上不可用，请用邮箱登录。",
      );
    }
  }

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

        {emailAndPasswordEnabled ? (
          <form className="flex w-full flex-col gap-3 text-left" onSubmit={onEmailSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "请稍等…" : mode === "up" ? "注册并登录" : "登录"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted underline-offset-4 hover:underline"
              onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
            >
              {mode === "in" ? "还没有账号？注册一个" : "已有账号？去登录"}
            </button>
          </form>
        ) : null}

        {showSocial ? (
          <div className="flex w-full flex-col gap-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => void onSocial(p.providerId)}
              >
                使用 {p.label} 继续
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            这个网站请用邮箱注册登录。Google / X 只在 Grok 预览里可用。
          </p>
        )}
        <Link to="/" className="text-sm text-muted underline-offset-4 hover:underline">
          先看看示例
        </Link>
      </div>
    </main>
  );
}
