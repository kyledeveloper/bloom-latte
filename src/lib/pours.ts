export const PATTERN_IDS = [
  "heart",
  "tulip",
  "rosetta",
  "swan",
  "winged-heart",
  "phoenix",
  "free-pour",
] as const;

export type PatternId = (typeof PATTERN_IDS)[number];

export type Pour = {
  id: string;
  createdAt: string;
  photo: string;
  pattern: PatternId;
  rating: number;
  beans: string;
  milk: string;
  grind: string;
  notes: string;
  demo?: boolean;
};

export type PourDraft = Omit<Pour, "id" | "createdAt" | "demo"> & {
  id?: string;
  createdAt?: string;
};

export const PATTERNS: {
  id: PatternId;
  name: string;
  en: string;
  hint: string;
}[] = [
  { id: "heart", name: "爱心", en: "Heart", hint: "停杯、一提" },
  { id: "tulip", name: "郁金香", en: "Tulip", hint: "点、推、叠" },
  { id: "rosetta", name: "罗斯塔", en: "Rosetta", hint: "摆腕成叶" },
  { id: "swan", name: "天鹅", en: "Swan", hint: "S 线出颈" },
  { id: "winged-heart", name: "翅膀爱心", en: "Winged Heart", hint: "对称双翼" },
  { id: "phoenix", name: "凤凰", en: "Phoenix", hint: "扇羽收尾" },
  { id: "free-pour", name: "自由拉花", en: "Free pour", hint: "随手一笔" },
];

export const MILKS = ["全脂鲜奶", "燕麦奶", "杏仁奶", "豆奶", "椰奶"] as const;

export function patternOf(id: PatternId) {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

export function pourCardSrc(pour: Pour) {
  const photo = pour.photo;
  if (photo.startsWith("/pours/") && !photo.startsWith("/pours/card/")) {
    return `/pours/card/${photo.slice("/pours/".length)}`;
  }
  return photo;
}


export function newId() {
  return crypto.randomUUID();
}

export async function compressImage(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(file);
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("无法处理照片");
  }
  let data = "";
  for (const edge of [800, 640, 480]) {
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.7, 0.58, 0.46]) {
      data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= 280_000) {
        bitmap.close();
        return data;
      }
    }
  }
  bitmap.close();
  return data;
}

export function formatPourDate(iso: string, locale: "zh" | "en" = "zh") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (locale === "en") {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const week = "日一二三四五六"[d.getDay()];
  return `${month} 月 ${day} 日 · 周${week}`;
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function toStreakDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function pourStreak(pours: Pour[], now = new Date()) {
  const days = new Set(
    pours.map((p) => toStreakDateKey(new Date(p.createdAt))),
  );
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  while (days.has(toStreakDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (streak === 0) {
    cursor.setDate(cursor.getDate() - 1);
    while (days.has(toStreakDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  return streak;
}

export const emptyDraft = (): PourDraft => ({
  photo: "",
  pattern: "heart",
  rating: 3,
  beans: "",
  milk: "全脂鲜奶",
  grind: "",
  notes: "",
});
