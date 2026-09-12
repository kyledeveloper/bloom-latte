import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { PourDraft } from "@/lib/pours";
import { addPour } from "@/lib/pours-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { AppShell } from "@/components/app-shell";
import { AuthSlot } from "@/components/auth-slot";
import { PourForm } from "@/components/pour-form";

export const Route = createFileRoute("/new")({ component: NewPour });

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
    const pour = await addPour({ data: draft });
    toast("记下了。换手机登录同一个账号也能看见。");
    void navigate({ to: "/pour/$id", params: { id: pour.id } });
  }

  return (
    <AppShell title="记录一杯" backTo="/" action={<AuthSlot />}>
      <PourForm submitLabel="保存这杯" onSubmit={onSubmit} />
    </AppShell>
  );
}
