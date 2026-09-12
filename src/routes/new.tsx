import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { notice } from "@/components/notice-host";
import { newId, type Pour, type PourDraft } from "@/lib/pours";
import { cachePour } from "@/lib/pour-cache";
import { rememberPour } from "@/lib/local-backup";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { Route as RootRoute } from "@/routes/__root";
import { AppShell } from "@/components/app-shell";
import { AuthSlot } from "@/components/auth-slot";
import { PourForm } from "@/components/pour-form";

export const Route = createFileRoute("/new")({ component: NewPour });

function NewPour() {
  const navigate = useNavigate();
  const { sessionUser } = RootRoute.useRouteContext();
  const { user } = useCurrentUserState();

  if (!user && !sessionUser) return <RedirectToSignIn />;

  async function onSubmit(draft: PourDraft) {
    if (!user) throw new Error("请先登录");
    try {
      const pour: Pour = {
        id: newId(),
        createdAt: draft.createdAt ?? new Date().toISOString(),
        photo: draft.photo,
        pattern: draft.pattern,
        rating: draft.rating,
        beans: draft.beans,
        milk: draft.milk,
        grind: draft.grind,
        notes: draft.notes,
      };
      cachePour(pour);
      await rememberPour(user.id, pour);
      notice("记下了。这杯存在这台设备上，云端稍后备份。");
      void navigate({
        to: "/pour/$id",
        params: { id: pour.id },
        state: { pour } as never,
      });
    } catch (err) {
      notice(err instanceof Error ? err.message : "没保存上，再试一次。");
      throw err;
    }
  }

  if (!user) {
    return (
      <AppShell title="记录一杯" backTo="/" action={<AuthSlot />}>
        <div className="mx-auto aspect-square w-full max-w-sm rounded-2xl bg-cream" />
      </AppShell>
    );
  }

  return (
    <AppShell title="记录一杯" backTo="/" action={<AuthSlot />}>
      <PourForm submitLabel="保存这杯" onSubmit={onSubmit} />
    </AppShell>
  );
}
