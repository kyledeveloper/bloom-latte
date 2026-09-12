import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { readAuthHint, useCurrentUserState } from "@/lib/auth/use-current-user";
import { setLocale, useLocale, useT } from "@/lib/i18n";
import { coldBackup } from "@/lib/local-backup";
import { notice } from "@/lib/notice";
import { Button } from "@/components/ui/button";

export function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className={
        className ??
        "h-9 rounded-full bg-surface px-3 text-xs font-medium text-muted shadow-[var(--shadow-border)] transition-colors hover:text-fg active:scale-95"
      }
      aria-label="Toggle language"
    >
      {locale === "zh" ? "EN" : "中"}
    </button>
  );
}

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const hint = !user ? readAuthHint() : null;
  const t = useT();

  if (user) return <AccountMenu />;

  if (isPending && hint) {
    const label = hint.displayName ?? hint.primaryEmail ?? t("account");
    return (
      <div className="flex items-center gap-2">
        <LocaleToggle />
        <span className="grid size-8 place-items-center rounded-full bg-cream text-sm font-medium">
          {label.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <LocaleToggle />
        <span className="inline-block size-8 rounded-full bg-cream" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <LocaleToggle />
      <Button asChild variant="secondary" size="sm">
        <Link to="/login">{t("signIn")}</Link>
      </Button>
    </div>
  );
}

function AccountMenu() {
  const { user } = useCurrentUserState();
  const t = useT();
  const locale = useLocale();
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
  const account = user;
  const label = account.displayName ?? account.primaryEmail ?? t("account");

  async function onBackup() {
    if (backingUp) return;
    setBackingUp(true);
    try {
      await coldBackup(account.id);
      setOpen(false);
      notice(t("backupOk"));
    } catch (err) {
      notice(err instanceof Error ? err.message : t("backupFail"));
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
        aria-label={t("account")}
        onClick={() => setOpen((v) => !v)}
        className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-cream text-sm font-medium transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
      >
        {account.profileImageUrl ? (
          <img
            src={account.profileImageUrl}
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
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-52 rounded-xl bg-surface py-1.5 shadow-[var(--shadow-border)]"
        >
          <p className="truncate px-3 py-1.5 text-xs text-muted">{label}</p>
          <div className="mx-2 mb-1 grid grid-cols-2 gap-0.5 rounded-lg bg-cream p-0.5">
            <button
              type="button"
              onClick={() => setLocale("zh")}
              className={
                locale === "zh"
                  ? "rounded-md bg-surface py-1.5 text-xs font-medium"
                  : "rounded-md py-1.5 text-xs text-muted"
              }
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={
                locale === "en"
                  ? "rounded-md bg-surface py-1.5 text-xs font-medium"
                  : "rounded-md py-1.5 text-xs text-muted"
              }
            >
              English
            </button>
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={backingUp}
            onClick={() => void onBackup()}
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-cream/80 disabled:opacity-50"
          >
            {backingUp ? t("backingUp") : t("backup")}
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
            {signingOut ? t("signingOut") : t("signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
