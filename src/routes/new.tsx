import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { notice } from "@/components/notice-host";
import { newId, type Pour, type PourDraft } from "@/lib/pours";
import { cachePour } from "@/lib/pour-cache";
import { rememberPour } from "@/lib/local-backup";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { AppShell } from "@/components/app-shell";
import { AuthSlot } from "@/components/auth-slot";
import { PourForm } from "@/components/pour-form";

export const Route = createFileRoute("/new")({
  ssr: false,
  component: NewPour,
});

function NewPour() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <AppShell title="记录一杯" backTo="/" action={<AuthSlot />}>
        <div className="mx-auto aspect-square w-full max-w-sm rounded-2xl bg-cream" />
      </AppShell>
    );
  }

  if (!user) return <RedirectToSignIn />;

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
      notice("记下了。这杯只在这台设备上，需要时再备份到云端。");
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

  return (
    <AppShell title="记录一杯" backTo="/" action={<AuthSlot />}>
      <PourForm submitLabel="保存这杯" onSubmit={onSubmit} />
    </AppShell>
  );
}
