import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { notice } from "@/components/notice-host";
import {
  formatPourDate,
  type Pour,
  type PourDraft,
} from "@/lib/pours";
import { cachedPour, cachePour } from "@/lib/pour-cache";
import { loadJournal } from "@/lib/photo-store";
import { forgetPour, rememberPour } from "@/lib/local-backup";
import { milkLabel, patternLabel, useLocale, useT } from "@/lib/i18n";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/app-shell";
import { AuthSlot } from "@/components/auth-slot";
import { PourForm } from "@/components/pour-form";
import { PatternMark } from "@/components/pattern-mark";
import { PourPhoto } from "@/components/pour-photo";
import { RatingStars } from "@/components/rating";
import { SharePourButton } from "@/components/share-pour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/pour/$id")({
  ssr: false,
  component: PourDetail,
});

function pourFromLocation(id: string, state: unknown): Pour | null {
  if (!state || typeof state !== "object" || !("pour" in state)) return null;
  const pour = (state as { pour?: Pour }).pour;
  return pour?.id === id ? pour : null;
}

function PourDetail() {
  const { id } = Route.useParams();
  const locationPour = useRouterState({
    select: (s) => pourFromLocation(id, s.location.state),
  });
  const { user, isPending } = useCurrentUserState();
  const t = useT();
  const locale = useLocale();
  const [pour, setPour] = useState<Pour | null>(
    () => locationPour ?? cachedPour(id),
  );
  const [ready, setReady] = useState(() => Boolean(locationPour ?? cachedPour(id)));
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const canEdit = Boolean(user) && Boolean(pour) && !pour?.demo;
  const signedIn = Boolean(user);

  useEffect(() => {
    const hit = locationPour ?? cachedPour(id);
    if (!hit) return;
    cachePour(hit);
    setPour((prev) => ({
      ...hit,
      photo: prev?.photo || hit.photo,
    }));
    setReady(true);
  }, [id, locationPour]);

  useEffect(() => {
    if (!signedIn) {
      if (!isPending) setReady(true);
      return;
    }
    if (locationPour ?? cachedPour(id)) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const userId = user?.id;
    void (async () => {
      if (userId) {
        const journal = await loadJournal(userId);
        const hit = journal?.pours.find((p) => p.id === id);
        if (cancelled) return;
        if (hit) {
          cachePour(hit);
          setPour(hit);
          setReady(true);
          return;
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, signedIn, user?.id, locationPour, isPending]);

  if (!ready && !pour) {
    return (
      <AppShell title={t("latteArt")} backTo="/" action={<AuthSlot />}>
        <div className="aspect-square animate-pulse rounded-2xl bg-cream" />
        <p className="mt-4 text-sm text-muted">{t("openingPour")}</p>
      </AppShell>
    );
  }

  if (!pour) {
    return (
      <AppShell title={t("pourMissingTitle")} backTo="/" action={<AuthSlot />}>
        <div className="rounded-xl bg-surface px-6 py-12 text-center shadow-[var(--shadow-border)]">
          <p className="font-display text-xl">{t("pourMissing")}</p>
          <Button asChild className="mt-5" size="pill">
            <Link to="/">{t("backToJournal")}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const name = patternLabel(pour.pattern, locale);

  async function onSave(draft: PourDraft) {
    if (!pour || !user) return;
    const next = {
      ...pour,
      ...draft,
      createdAt: draft.createdAt ?? pour.createdAt,
      demo: false,
    };
    cachePour(next);
    await rememberPour(user.id, next);
    setPour(next);
    setEditing(false);
    notice(t("updatedLocal"));
  }

  async function onDelete() {
    if (user) await forgetPour(user.id, id);
    setOpen(false);
    notice(t("deleted"));
    void navigate({ to: "/" });
  }

  return (
    <AppShell
      title={name}
      backTo="/"
      width="medium"
      action={
        <div className="flex items-center gap-1">
          <SharePourButton pour={pour} />
          {canEdit ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={editing ? t("cancelEdit") : t("edit")}
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil className="size-4" />
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t("delete")}>
                    <Trash2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("deleteThis")}</DialogTitle>
                    <DialogDescription>{t("deleteBody")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                      {t("keep")}
                    </Button>
                    <Button variant="danger" onClick={() => void onDelete()}>
                      {t("delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
          <AuthSlot />
        </div>
      }
    >
      {editing && canEdit ? (
        <PourForm initial={pour} submitLabel={t("saveEdit")} onSubmit={onSave} />
      ) : (
        <article className="page-enter grid gap-6 md:grid-cols-2 md:items-start md:gap-8">
          <div className="overflow-hidden rounded-2xl bg-cream p-2 shadow-[var(--shadow-border)]">
            <PourPhoto
              src={pour.photo}
              alt={name}
              pourId={pour.demo ? undefined : pour.id}
              priority
              className="rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <PatternMark id={pour.pattern} className="size-3.5" />
                {name}
              </Badge>
              {pour.demo ? <Badge>{t("demo")}</Badge> : null}
              <RatingStars value={pour.rating} />
            </div>

            <div>
              <p className="font-display text-2xl font-medium tracking-tight">
                {formatPourDate(pour.createdAt, locale)}
              </p>
              <p className="mt-1 text-muted">
                {[pour.beans, pour.grind, pour.milk ? milkLabel(pour.milk, locale) : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            {pour.notes ? (
              <p className="rounded-xl bg-surface px-4 py-3 leading-relaxed text-fg shadow-[var(--shadow-border)]">
                {pour.notes}
              </p>
            ) : (
              <p className="text-sm text-muted">{t("noNotes")}</p>
            )}

            <SharePourButton pour={pour} variant="cta" className="self-start" />
          </div>
        </article>
      )}
    </AppShell>
  );
}
