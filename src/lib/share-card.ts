import {
  formatPourDate,
  patternOf,
  type Pour,
} from "@/lib/pours";
import { getBearerToken } from "@/lib/auth/client";
import { loadLocalPhoto } from "@/lib/photo-store";

const W = 1080;
const H = 1440;
const PAPER = "#f3ece4";
const SURFACE = "#faf6f0";
const INK = "#1a1510";
const MUTED = "#7a6d62";
const CREAM = "#e8ddd0";
const PRIMARY = "#2c2118";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadPhoto(src: string, pourId?: string): Promise<HTMLImageElement> {
  return (async () => {
    let url = src;
    if (pourId) {
      const local = await loadLocalPhoto(pourId);
      if (local) url = local;
    }
    if (url.startsWith("/api/")) {
      const headers = new Headers();
      const token = getBearerToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const href = token ? `${url}${url.includes("?") ? "&" : "?"}bt=${encodeURIComponent(token)}` : url;
      const res = await fetch(href, { headers, credentials: "include" });
      if (!res.ok) throw new Error("照片加载失败");
      url = URL.createObjectURL(await res.blob());
    }
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (!url.startsWith("data:")) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("照片加载失败"));
      img.src = url;
    });
  })();
}

function cover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  iw: number,
  ih: number,
) {
  const ir = iw / ih;
  const r = w / h;
  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;
  if (ir > r) {
    sw = ih * r;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / r;
    sy = (ih - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapChars(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  if (chars.length === 0) return [];
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < chars.length; i++) {
    const next = line + chars[i];
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = chars[i] ?? "";
    if (lines.length === maxLines - 1) {
      const rest = line + chars.slice(i + 1).join("");
      let cut = rest;
      while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
        cut = cut.slice(0, -1);
      }
      lines.push(cut === rest ? rest : `${cut}…`);
      return lines;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  const s = size / 16;
  ctx.save();
  ctx.translate(cx - 8 * s, cy - 7 * s);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(8, 13.4);
  ctx.bezierCurveTo(3.5, 10.2, 1.2, 8.2, 1.2, 5.4);
  ctx.bezierCurveTo(1.2, 3.4, 2.7, 2, 4.6, 2);
  ctx.bezierCurveTo(5.8, 2, 6.9, 2.6, 8, 4);
  ctx.bezierCurveTo(9.1, 2.6, 10.2, 2, 11.4, 2);
  ctx.bezierCurveTo(13.3, 2, 14.8, 3.4, 14.8, 5.4);
  ctx.bezierCurveTo(14.8, 8.2, 12.5, 10.2, 8, 13.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  roundRect(ctx, x, y, size, size, size * 0.28);
  ctx.fillStyle = PRIMARY;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.47, size * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.fillStyle = INK;
  drawHeart(ctx, x + size / 2, y + size * 0.5, size * 0.42);
}

async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load('600 72px "Noto Serif SC"'),
      document.fonts.load('500 36px "Noto Sans SC"'),
      document.fonts.ready,
    ]);
  } catch {
    /* system fallback */
  }
}

export async function renderPourShareCard(pour: Pour): Promise<Blob> {
  await waitForFonts();
  const photo = await loadPhoto(pour.photo, pour.demo ? undefined : pour.id);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法生成图片");

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const pad = 72;
  const photoSize = 936;
  roundRect(ctx, pad - 10, pad - 10, photoSize + 20, photoSize + 20, 36);
  ctx.fillStyle = SURFACE;
  ctx.fill();

  ctx.save();
  roundRect(ctx, pad, pad, photoSize, photoSize, 28);
  ctx.clip();
  cover(ctx, photo, pad, pad, photoSize, photoSize, photo.naturalWidth, photo.naturalHeight);
  ctx.restore();

  const pattern = patternOf(pour.pattern);
  let y = pad + photoSize + 64;

  ctx.fillStyle = INK;
  ctx.font = '600 64px "Noto Serif SC", "Songti SC", serif';
  ctx.textBaseline = "alphabetic";
  ctx.fillText(pattern.name, pad, y);

  const nameWidth = ctx.measureText(pattern.name).width;
  const starX = pad + nameWidth + 28;
  const starY = y - 22;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(starX + i * 28, starY, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < pour.rating ? PRIMARY : CREAM;
    ctx.fill();
  }

  y += 48;
  ctx.fillStyle = MUTED;
  ctx.font = '500 30px "Noto Sans SC", sans-serif';
  ctx.fillText(formatPourDate(pour.createdAt), pad, y);

  const meta = [pour.beans, pour.grind, pour.milk].filter(Boolean).join("  ·  ");
  if (meta) {
    y += 44;
    ctx.fillText(meta, pad, y);
  }

  if (pour.notes.trim()) {
    y += 56;
    ctx.fillStyle = INK;
    ctx.font = '400 32px "Noto Sans SC", sans-serif';
    const lines = wrapChars(ctx, pour.notes, W - pad * 2, 3);
    for (const line of lines) {
      ctx.fillText(line, pad, y);
      y += 46;
    }
  }

  const footerY = H - 88;
  drawMark(ctx, pad, footerY - 22, 48);
  ctx.fillStyle = INK;
  ctx.font = '600 32px "Noto Serif SC", "Songti SC", serif';
  ctx.fillText("杯中花", pad + 62, footerY + 12);
  ctx.fillStyle = MUTED;
  ctx.font = '400 24px "Noto Sans SC", sans-serif';
  ctx.fillText("倒一杯，开一朵", pad + 180, footerY + 12);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("无法导出图片"))),
      "image/jpeg",
      0.92,
    );
  });
}

export function shareFilename(pour: Pour) {
  const pattern = patternOf(pour.pattern).name;
  const d = new Date(pour.createdAt);
  const stamp = Number.isNaN(d.getTime())
    ? ""
    : `-${d.getMonth() + 1}月${d.getDate()}日`;
  return `杯中花-${pattern}${stamp}.jpg`;
}

export async function nativeShareImage(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title,
      text: title,
    });
    return "shared" as const;
  }
  if (typeof navigator.share === "function") {
    const url = URL.createObjectURL(blob);
    try {
      await navigator.share({ title, text: title, url });
      return "shared" as const;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  downloadBlob(blob, filename);
  return "saved" as const;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function canNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
