import { pourStreak, type PatternId, type Pour } from "./pours.ts";
import { getWebsiteShareUrl } from "./qr-code.ts";

export interface SharedPourData {
  id?: string;
  photo?: string;
  userName: string;
  dayNumber: number;
  cupNumber?: number;
  streak?: number;
  pattern: PatternId;
  rating: number;
  beans?: string;
  milk?: string;
  grind?: string;
  notes?: string;
  createdAt: string;
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function calculatePracticeMetrics(
  allPours: Pour[],
  targetPour: Pour,
): { dayNumber: number; cupNumber: number; streak: number } {
  if (!allPours.length) {
    return { dayNumber: 1, cupNumber: 1, streak: 1 };
  }

  const sorted = [...allPours].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const targetDate = new Date(targetPour.createdAt);
  const upToTarget = sorted.filter(
    (p) => new Date(p.createdAt).getTime() <= targetDate.getTime(),
  );

  const distinctDays = new Set(
    upToTarget.map((p) => toDateKey(p.createdAt)).filter(Boolean),
  );

  const dayNumber = Math.max(1, distinctDays.size);
  const cupNumber = Math.max(1, upToTarget.length);
  const streak = Math.max(1, pourStreak(upToTarget, targetDate));

  return { dayNumber, cupNumber, streak };
}

export function buildPourSharePayload(
  pour: Pour,
  allPours: Pour[],
  userName?: string,
): SharedPourData {
  const { dayNumber, cupNumber, streak } = calculatePracticeMetrics(
    allPours,
    pour,
  );

  return {
    id: pour.id,
    photo: pour.photo && !pour.photo.startsWith("data:") ? pour.photo : undefined,
    userName: userName?.trim() || "",
    dayNumber,
    cupNumber,
    streak,
    pattern: pour.pattern,
    rating: pour.rating,
    beans: pour.beans?.trim() || undefined,
    milk: pour.milk?.trim() || undefined,
    grind: pour.grind?.trim() || undefined,
    notes: pour.notes?.trim() || undefined,
    createdAt: pour.createdAt,
  };
}

export function encodeShareUrl(
  data: SharedPourData,
  baseUrl?: string,
): string {
  const origin = (baseUrl || getWebsiteShareUrl() || "https://bloom-latte.vercel.app").replace(
    /\/+$/,
    "",
  );

  const params = new URLSearchParams();
  if (data.id) params.set("id", data.id);
  if (data.photo && !data.photo.startsWith("data:")) params.set("ph", data.photo);
  if (data.userName) params.set("u", data.userName);
  params.set("d", String(data.dayNumber));
  if (data.cupNumber) params.set("c", String(data.cupNumber));
  if (data.streak) params.set("s", String(data.streak));
  params.set("p", data.pattern);
  params.set("r", String(data.rating));
  if (data.beans) params.set("b", data.beans);
  if (data.milk) params.set("m", data.milk);
  if (data.grind) params.set("g", data.grind);
  if (data.notes) params.set("n", data.notes);
  if (data.createdAt) params.set("t", data.createdAt);

  return `${origin}/?${params.toString()}`;
}

export function decodeSharePayload(
  searchOrUrl: string | URLSearchParams,
): SharedPourData | null {
  try {
    const searchParams =
      typeof searchOrUrl === "string"
        ? searchOrUrl.includes("?")
          ? new URLSearchParams(searchOrUrl.slice(searchOrUrl.indexOf("?")))
          : new URLSearchParams(searchOrUrl)
        : searchOrUrl;

    const pattern = searchParams.get("p") as PatternId | null;
    const ratingStr = searchParams.get("r");
    const dayStr = searchParams.get("d");
    const id = searchParams.get("id") || undefined;
    const photo = searchParams.get("ph") || undefined;

    // A valid shared payload must at least specify a pattern or a day count or an id
    if (!pattern && !dayStr && !id) {
      return null;
    }

    const rating = ratingStr ? Number.parseFloat(ratingStr) : 5;
    const dayNumber = dayStr ? Number.parseInt(dayStr, 10) : 1;
    const cupStr = searchParams.get("c");
    const streakStr = searchParams.get("s");

    return {
      id,
      photo,
      userName: searchParams.get("u") || "",
      dayNumber: Number.isNaN(dayNumber) ? 1 : Math.max(1, dayNumber),
      cupNumber: cupStr ? Number.parseInt(cupStr, 10) : undefined,
      streak: streakStr ? Number.parseInt(streakStr, 10) : undefined,
      pattern: pattern || "tulip",
      rating: Number.isNaN(rating) ? 5 : rating,
      beans: searchParams.get("b") || undefined,
      milk: searchParams.get("m") || undefined,
      grind: searchParams.get("g") || undefined,
      notes: searchParams.get("n") || undefined,
      createdAt: searchParams.get("t") || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
