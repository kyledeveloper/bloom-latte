import type { Locale } from "@/lib/i18n";

export interface PourTag {
  id: string;
  category: "equipment" | "technique";
  labelZh: string;
  labelEn: string;
  isCustom?: boolean;
}

export const DEFAULT_EQUIPMENT_TAGS: PourTag[] = [
  { id: "sharp-spout", category: "equipment", labelZh: "尖嘴缸", labelEn: "Sharp pitcher" },
  { id: "round-spout", category: "equipment", labelZh: "圆嘴缸", labelEn: "Round pitcher" },
  { id: "cup-150", category: "equipment", labelZh: "150ml平白", labelEn: "150ml Flat White" },
  { id: "cup-220", category: "equipment", labelZh: "220ml拿铁", labelEn: "220ml Latte" },
  { id: "cup-300", category: "equipment", labelZh: "300ml大杯", labelEn: "300ml Large" },
];

export const DEFAULT_TECHNIQUE_TAGS: PourTag[] = [
  { id: "silky-foam", category: "technique", labelZh: "奶泡细密", labelEn: "Silky microfoam" },
  { id: "thick-foam", category: "technique", labelZh: "奶泡偏厚", labelEn: "Foam too thick" },
  { id: "thin-foam", category: "technique", labelZh: "奶泡偏薄", labelEn: "Foam too thin" },
  { id: "crisp-ripples", category: "technique", labelZh: "压纹清晰", labelEn: "Crisp ripples" },
  { id: "symmetric", category: "technique", labelZh: "摆幅对称", labelEn: "Symmetric swing" },
  { id: "asymmetric", category: "technique", labelZh: "摆幅不对称", labelEn: "Asymmetric swing" },
  { id: "clean-cut", category: "technique", labelZh: "收口干净", labelEn: "Clean cut" },
  { id: "dragged-cut", category: "technique", labelZh: "收口拖尾", labelEn: "Cut dragged" },
  { id: "late-float", category: "technique", labelZh: "起花偏迟", labelEn: "Late float" },
  { id: "deep-merge", category: "technique", labelZh: "融合过深", labelEn: "Merged too deep" },
];

export const EQUIPMENT_TAGS = DEFAULT_EQUIPMENT_TAGS;
export const TECHNIQUE_TAGS = DEFAULT_TECHNIQUE_TAGS;
export const ALL_POUR_TAGS = [...DEFAULT_EQUIPMENT_TAGS, ...DEFAULT_TECHNIQUE_TAGS];

export const STORAGE_TAGS_KEY = "bloom_latte_pour_tags_v1";

export function loadPourTags(): PourTag[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_EQUIPMENT_TAGS, ...DEFAULT_TECHNIQUE_TAGS];
  }
  try {
    const raw = localStorage.getItem(STORAGE_TAGS_KEY);
    if (!raw) {
      return [...DEFAULT_EQUIPMENT_TAGS, ...DEFAULT_TECHNIQUE_TAGS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as PourTag[];
    }
  } catch {
    // fallback to defaults on error
  }
  return [...DEFAULT_EQUIPMENT_TAGS, ...DEFAULT_TECHNIQUE_TAGS];
}

export function savePourTags(tags: PourTag[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_TAGS_KEY, JSON.stringify(tags));
  } catch {
    // ignore quota errors
  }
}

export function resetDefaultPourTags(): PourTag[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_TAGS_KEY);
    } catch {
      // ignore
    }
  }
  return [...DEFAULT_EQUIPMENT_TAGS, ...DEFAULT_TECHNIQUE_TAGS];
}

export function createCustomTag(
  name: string,
  category: "equipment" | "technique",
): PourTag {
  const trimmed = name.trim();
  const id = `tag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    category,
    labelZh: trimmed,
    labelEn: trimmed,
    isCustom: true,
  };
}

export function updateTagLabel(
  tags: PourTag[],
  id: string,
  newLabel: string,
  locale: Locale,
): PourTag[] {
  const trimmed = newLabel.trim();
  if (!trimmed) return tags;
  return tags.map((t) => {
    if (t.id !== id) return t;
    return {
      ...t,
      labelZh: locale === "en" ? t.labelZh : trimmed,
      labelEn: locale === "en" ? trimmed : t.labelEn,
    };
  });
}

export function deleteTag(tags: PourTag[], id: string): PourTag[] {
  return tags.filter((t) => t.id !== id);
}

export interface PresetSuggestion {
  zh: string;
  en: string;
}

export const BEAN_SUGGESTIONS: PresetSuggestion[] = [
  { zh: "埃塞俄比亚 古吉", en: "Ethiopia Guji" },
  { zh: "耶加雪菲", en: "Yirgacheffe" },
  { zh: "哥伦比亚", en: "Colombia" },
  { zh: "意式深烘拼配", en: "Espresso Blend" },
  { zh: "厌氧日晒 SOE", en: "Anaerobic SOE" },
];

export const GRIND_SUGGESTIONS: PresetSuggestion[] = [
  { zh: "中细", en: "Medium-fine" },
  { zh: "偏细", en: "Fine" },
  { zh: "EK43 8.5", en: "EK43 8.5" },
  { zh: "C40 12格", en: "C40 12 clicks" },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isTagActive(notes: string, tag: PourTag): boolean {
  if (!notes) return false;
  return (
    (Boolean(tag.labelZh) && notes.includes(tag.labelZh)) ||
    (Boolean(tag.labelEn) && notes.includes(tag.labelEn))
  );
}

export function removeTagText(text: string, label: string): string {
  if (!text || !text.includes(label)) return text;

  // 1. Delimiter before label: e.g. "、label", " · label", ", label"
  const beforeRegex = new RegExp(`(?:[、,，·•]|\\s*·\\s*)\\s*${escapeRegex(label)}`, "g");
  if (beforeRegex.test(text)) {
    return text.replace(beforeRegex, "").trim();
  }

  // 2. Delimiter after label: e.g. "label、", "label · ", "label, "
  const afterRegex = new RegExp(`${escapeRegex(label)}\\s*(?:[、,，·•]|\\s*·\\s*)`, "g");
  if (afterRegex.test(text)) {
    return text.replace(afterRegex, "").trim();
  }

  // 3. Just the label alone
  const aloneRegex = new RegExp(escapeRegex(label), "g");
  return text.replace(aloneRegex, "").replace(/^[、,，·•\s]+|[、,，·•\s]+$/g, "").trim();
}

export function toggleTagInNotes(
  currentNotes: string,
  tag: PourTag,
  locale: Locale,
): string {
  const active = isTagActive(currentNotes, tag);
  const targetLabel = locale === "en" ? tag.labelEn : tag.labelZh;
  const otherLabel = locale === "en" ? tag.labelZh : tag.labelEn;

  if (active) {
    let next = removeTagText(currentNotes, targetLabel);
    if (otherLabel && otherLabel !== targetLabel && next.includes(otherLabel)) {
      next = removeTagText(next, otherLabel);
    }
    return next;
  } else {
    const trimmed = currentNotes.trim();
    if (!trimmed) {
      return targetLabel;
    }
    const endsWithPeriod = /[。！？!?]$/.test(trimmed);
    const endsWithDelim = /[、,，·•\s]$/.test(trimmed);
    const sep = endsWithPeriod ? " " : locale === "en" ? " · " : "、";

    const next = endsWithDelim ? `${trimmed}${targetLabel}` : `${trimmed}${sep}${targetLabel}`;
    return next.slice(0, 280);
  }
}
