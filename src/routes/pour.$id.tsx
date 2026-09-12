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
  patternOf,
  type Pour,
  type PourDraft,
} from "@/lib/pours";
import { deletePour, getPour, updatePour } from "@/lib/pours-api";
import { cachedPour, cachePour } from "@/lib/pour-cache";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Route as RootRoute } from "@/routes/__root";
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
  const { sessionUser } = RootRoute.useRouteContext();
  const { user, isPending } = useCurrentUserState();
  const [pour, setPour] = useState<Pour | null>(
    () => locationPour ?? cachedPour(id),
  );
  const [ready, setReady] = useState(() => Boolean(locationPour ?? cachedPour(id)));
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const canEdit = Boolean(user) && Boolean(pour) && !pour?.demo;
  const signedIn = Boolean(user ?? sessionUser);

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
    let cancelled = false;
    getPour({ data: id })
      .then((row) => {
        if (cancelled || !row) return;
        setPour((prev) => {
          const next = {
            ...row,
            photo: prev?.photo || row.photo,
          };
          cachePour(next);
          return next;
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, signedIn, user?.id]);

  if (!ready && !pour) {
    return (
      <AppShell title="拉花" backTo="/" action={<AuthSlot />}>
        <div className="aspect-square animate-pulse rounded-2xl bg-cream" />
        <p className="mt-4 text-sm text-muted">正在打开这杯…</p>
      </AppShell>
    );
  }

  if (!pour) {
    return (
      <AppShell title="找不到这杯" backTo="/" action={<AuthSlot />}>
        <div className="rounded-xl bg-surface px-6 py-12 text-center shadow-[var(--shadow-border)]">
          <p className="font-display text-xl">这页已经不在手记里了。</p>
          <Button asChild className="mt-5" size="pill">
            <Link to="/">回到手记</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const pattern = patternOf(pour.pattern);

  async function onSave(draft: PourDraft) {
    if (!pour) return;
    await updatePour({ data: { ...draft, id } });
    const next = {
      ...pour,
      ...draft,
      createdAt: draft.createdAt ?? pour.createdAt,
      demo: false,
    };
    cachePour(next);
    setPour(next);
    setEditing(false);
    notice("已更新。");
  }

  async function onDelete() {
    await deletePour({ data: id });
    setOpen(false);
    notice("删掉了。");
    void navigate({ to: "/" });
  }

  return (
    <AppShell
      title={pattern.name}
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
                aria-label={editing ? "取消编辑" : "编辑"}
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil className="size-4" />
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="删除">
                    <Trash2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>删掉这杯？</DialogTitle>
                    <DialogDescription>
                      照片和笔记都会从云端手记里拿走，不能恢复。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                      留下
                    </Button>
                    <Button variant="danger" onClick={() => void onDelete()}>
                      删除
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
        <PourForm initial={pour} submitLabel="保存修改" onSubmit={onSave} />
      ) : (
        <article className="page-enter grid gap-6 md:grid-cols-2 md:items-start md:gap-8">
          <div className="overflow-hidden rounded-2xl bg-cream p-2 shadow-[var(--shadow-border)]">
            <PourPhoto
              src={pour.photo}
              alt={`${pattern.name}拉花`}
              priority
              className="rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <PatternMark id={pour.pattern} className="size-3.5" />
                {pattern.name}
                <span className="text-subtle">{pattern.en}</span>
              </Badge>
              {pour.demo ? <Badge>示例</Badge> : null}
              <RatingStars value={pour.rating} />
            </div>

            <div>
              <p className="font-display text-2xl font-medium tracking-tight">
                {formatPourDate(pour.createdAt)}
              </p>
              <p className="mt-1 text-muted">
                {[pour.beans, pour.grind, pour.milk].filter(Boolean).join(" · ")}
              </p>
            </div>

            {pour.notes ? (
              <p className="rounded-xl bg-surface px-4 py-3 leading-relaxed text-fg shadow-[var(--shadow-border)]">
                {pour.notes}
              </p>
            ) : (
              <p className="text-sm text-muted">这杯没有写笔记。</p>
            )}

            <SharePourButton pour={pour} variant="cta" className="self-start" />
          </div>
        </article>
      )}
    </AppShell>
  );
}
