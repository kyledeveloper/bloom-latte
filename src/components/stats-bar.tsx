import { pourStreak, type Pour } from "@/lib/pours";

export function StatsBar({ pours }: { pours: Pour[] }) {
  const count = pours.length;
  const avg =
    count === 0
      ? 0
      : Math.round((pours.reduce((s, p) => s + p.rating, 0) / count) * 10) / 10;
  const streak = pourStreak(pours);
  const items = [
    { label: "杯", value: String(count) },
    { label: "均分", value: avg.toFixed(1) },
    { label: "连续", value: streak ? `${streak} 日` : "—" },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
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
