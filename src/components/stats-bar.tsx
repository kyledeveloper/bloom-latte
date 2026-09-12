import { pourStreak, type Pour } from "@/lib/pours";
import { useT } from "@/lib/i18n";

export function StatsBar({ pours }: { pours: Pour[] }) {
  const t = useT();
  const count = pours.length;
  const avg =
    count === 0
      ? 0
      : Math.round((pours.reduce((s, p) => s + p.rating, 0) / count) * 10) / 10;
  const streak = pourStreak(pours);
  const items = [
    { label: t("cups"), value: String(count) },
    { label: t("avg"), value: avg.toFixed(1) },
    { label: t("streak"), value: streak ? t("streakDays", { n: streak }) : "—" },
  ];
  return (
    <dl className="stagger-in grid grid-cols-3 divide-x divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5 py-3">
          <dd className="font-display text-xl font-medium tabular-nums tracking-tight">
            {item.value}
          </dd>
          <dt className="text-xs text-muted">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
