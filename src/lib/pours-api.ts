import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { PATTERN_IDS, type PatternId, type Pour, type PourDraft } from "@/lib/pours";
import { pourPhotoUrl } from "@/lib/photo-store";

type PourRow = {
  id: string;
  created_at: string | Date;
  photo?: string;
  pattern: string;
  rating: number | string;
  beans: string;
  milk: string;
  grind: string;
  notes: string;
};

function isPattern(value: string): value is PatternId {
  return (PATTERN_IDS as readonly string[]).includes(value);
}

function toRestorePour(row: PourRow): Pour {
  const created =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at);
  const pattern = isPattern(row.pattern) ? row.pattern : "free-pour";
  return {
    id: row.id,
    createdAt: created,
    photo: row.photo ?? pourPhotoUrl(row.id),
    pattern,
    rating: Number(row.rating),
    beans: row.beans,
    milk: row.milk,
    grind: row.grind,
    notes: row.notes,
  };
}

function cleanDraft(draft: PourDraft): PourDraft & { id?: string } {
  const photo = draft.photo.trim();
  if (!photo) throw new Error("先拍一张，再记下这杯。");
  const keepRemote = photo.startsWith("/api/pours/") || photo.startsWith("/pours/");
  if (!keepRemote && photo.length > 900_000) throw new Error("照片太大，请换一张再试。");
  if (!isPattern(draft.pattern)) throw new Error("未知图案");
  const rating = Math.round(Number(draft.rating));
  if (rating < 1 || rating > 5) throw new Error("评分要在 1 到 5 之间");
  return {
    id: draft.id,
    photo,
    pattern: draft.pattern,
    rating,
    beans: draft.beans.trim().slice(0, 80),
    milk: draft.milk.trim().slice(0, 40),
    grind: draft.grind.trim().slice(0, 80),
    notes: draft.notes.trim().slice(0, 280),
    createdAt: draft.createdAt,
  };
}

/** Cold restore only — pulls photos. Not used on ordinary page loads. */
export const restoreJournal = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<PourRow>`
      select id, created_at, photo, pattern, rating, beans, milk, grind, notes
      from pours
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map(toRestorePour);
  });

export const upsertPour = createServerFn({ method: "POST" })
  .validator((input: PourDraft & { id: string }) => {
    if (!input.id) throw new Error("找不到这杯");
    const cleaned = cleanDraft(input);
    if (!cleaned.photo.startsWith("data:image/")) {
      throw new Error("备份需要照片");
    }
    return { id: input.id, ...cleaned };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const createdAt = data.createdAt ?? new Date().toISOString();
    await sql`
      insert into pours (id, user_id, created_at, photo, pattern, rating, beans, milk, grind, notes)
      values (
        ${data.id},
        ${context.userId},
        ${createdAt}::timestamptz,
        ${data.photo},
        ${data.pattern},
        ${data.rating},
        ${data.beans},
        ${data.milk},
        ${data.grind},
        ${data.notes}
      )
      on conflict (id) do update set
        created_at = excluded.created_at,
        photo = excluded.photo,
        pattern = excluded.pattern,
        rating = excluded.rating,
        beans = excluded.beans,
        milk = excluded.milk,
        grind = excluded.grind,
        notes = excluded.notes
      where pours.user_id = ${context.userId}
    `;
  });

export const deletePour = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from pours where id = ${id} and user_id = ${context.userId}`;
  });
