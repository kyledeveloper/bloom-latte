import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  GROK_PROVIDERS,
  authClient,
  signIn,
} from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useT } from "@/lib/i18n";
import { notice } from "@/lib/notice";
import { LocaleToggle } from "@/components/auth-slot";
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
  ssr: false,
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  const t = useT();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  useEffect(() => {
    setShowSocial(socialLoginAllowed(false));
  }, []);

  if (isPending) return null;
  if (user) return <Navigate to="/" />;

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] || t("bloom"),
        });
        if (error) throw new Error(error.message ?? t("registerFail"));
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message ?? t("loginFail"));
      }
      window.location.href = "/";
    } catch (err) {
      notice(err instanceof Error ? err.message : t("loginFail"));
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
          : t("socialFail"),
      );
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center bg-bg px-6">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))]">
        <LocaleToggle />
      </div>
      <div className="page-enter flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Link to="/" className="flex flex-col items-center gap-3">
          <Wordmark className="size-14" />
          <span className="font-display text-3xl font-medium tracking-tight">
            {t("bloom")}
          </span>
        </Link>
        <p className="text-muted">{t("loginLead")}</p>

        {emailAndPasswordEnabled ? (
          <form className="flex w-full flex-col gap-3 text-left" onSubmit={onEmailSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
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
              <Label htmlFor="password">{t("password")}</Label>
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
              {busy ? t("wait") : mode === "up" ? t("registerLogin") : t("signIn")}
            </Button>
            <button
              type="button"
              className="text-sm text-muted underline-offset-4 hover:underline"
              onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
            >
              {mode === "in" ? t("noAccount") : t("hasAccount")}
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
                {t("continueWith", { name: p.label })}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            {t("emailOnly")}
          </p>
        )}
        <Link to="/" className="text-sm text-muted underline-offset-4 hover:underline">
          {t("seeExamples")}
        </Link>
      </div>
    </main>
  );
}
