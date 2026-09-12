import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId, PATTERN_IDS, type PatternId, type Pour, type PourDraft } from "@/lib/pours";

type PourRow = {
  id: string;
  created_at: string | Date;
  photo: string;
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

function toPour(row: PourRow): Pour {
  const created =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at);
  const pattern = isPattern(row.pattern) ? row.pattern : "free-pour";
  return {
    id: row.id,
    createdAt: created,
    photo: row.photo,
    pattern,
    rating: Number(row.rating),
    beans: row.beans,
    milk: row.milk,
    grind: row.grind,
    notes: row.notes,
  };
}

function cleanDraft(draft: PourDraft): PourDraft {
  const photo = draft.photo.trim();
  if (!photo) throw new Error("先拍一张，再记下这杯。");
  if (photo.length > 900_000) throw new Error("照片太大，请换一张再试。");
  if (!isPattern(draft.pattern)) throw new Error("未知图案");
  const rating = Math.round(Number(draft.rating));
  if (rating < 1 || rating > 5) throw new Error("评分要在 1 到 5 之间");
  return {
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

export const listPours = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<PourRow>`
      select id, created_at, photo, pattern, rating, beans, milk, grind, notes
      from pours
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map(toPour);
  });

export const getPour = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<PourRow>`
      select id, created_at, photo, pattern, rating, beans, milk, grind, notes
      from pours
      where id = ${id} and user_id = ${context.userId}
      limit 1
    `;
    return rows[0] ? toPour(rows[0]) : null;
  });

export const addPour = createServerFn({ method: "POST" })
  .validator((draft: PourDraft) => cleanDraft(draft))
  .middleware([authMiddleware])
  .handler(async ({ context, data: draft }) => {
    const sql = await getSql();
    const id = newId();
    const createdAt = draft.createdAt ?? new Date().toISOString();
    await sql`
      insert into pours (id, user_id, created_at, photo, pattern, rating, beans, milk, grind, notes)
      values (
        ${id},
        ${context.userId},
        ${createdAt}::timestamptz,
        ${draft.photo},
        ${draft.pattern},
        ${draft.rating},
        ${draft.beans},
        ${draft.milk},
        ${draft.grind},
        ${draft.notes}
      )
    `;
    return {
      id,
      createdAt,
      photo: draft.photo,
      pattern: draft.pattern,
      rating: draft.rating,
      beans: draft.beans,
      milk: draft.milk,
      grind: draft.grind,
      notes: draft.notes,
    } satisfies Pour;
  });

export const updatePour = createServerFn({ method: "POST" })
  .validator((input: PourDraft & { id: string }) => {
    if (!input.id) throw new Error("找不到这杯");
    return { id: input.id, ...cleanDraft(input) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const createdAt = data.createdAt ?? new Date().toISOString();
    await sql`
      update pours
      set
        created_at = ${createdAt}::timestamptz,
        photo = ${data.photo},
        pattern = ${data.pattern},
        rating = ${data.rating},
        beans = ${data.beans},
        milk = ${data.milk},
        grind = ${data.grind},
        notes = ${data.notes}
      where id = ${data.id} and user_id = ${context.userId}
    `;
  });

export const deletePour = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from pours where id = ${id} and user_id = ${context.userId}`;
  });
