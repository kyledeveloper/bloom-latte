import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { notice } from "@/components/notice-host";
import type { PourDraft } from "@/lib/pours";
import { addPour } from "@/lib/pours-api";
import { cachePour } from "@/lib/pour-cache";
import { saveLocalPhoto, upsertCachedPour } from "@/lib/photo-store";
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
    try {
      const pour = await addPour({ data: draft });
      await saveLocalPhoto(pour.id, draft.photo);
      const stored = { ...pour, photo: draft.photo };
      cachePour(stored);
      if (user) void upsertCachedPour(user.id, stored);
      notice("记下了。换手机登录同一个账号也能看见。");
      void navigate({
        to: "/pour/$id",
        params: { id: pour.id },
        state: { pour: stored } as never,
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
