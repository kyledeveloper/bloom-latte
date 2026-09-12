import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { auth } from "@/lib/auth/server";

export const Route = createFileRoute("/api/pours/$id/photo")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const id =
          params.id ||
          new URL(request.url).pathname.split("/").filter(Boolean)[2] ||
          "";
        if (!id) return new Response("Not found", { status: 404 });
        const url = new URL(request.url);
        const headers = new Headers(request.headers);
        const bearer =
          headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          url.searchParams.get("bt") ||
          "";
        if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
        let userId: string | undefined;
        try {
          const session = await auth.api.getSession({ headers });
          userId = session?.user?.id;
        } catch {
          // ignore session lookup failure
        }

        const sql = await getSql();
        let rows: { photo: string }[] = [];
        if (userId) {
          rows = await sql<{ photo: string }>`
            select photo from pours where id = ${id} and user_id = ${userId} limit 1
          `;
        }
        if (rows.length === 0) {
          rows = await sql<{ photo: string }>`
            select photo from pours where id = ${id} limit 1
          `;
        }
        const photo = rows[0]?.photo;
        if (!photo) return new Response("Not found", { status: 404 });
        if (photo.startsWith("/") && !photo.startsWith("/api/")) {
          return Response.redirect(new URL(photo, request.url), 302);
        }
        const comma = photo.indexOf(",");
        const header = comma >= 0 ? photo.slice(0, comma) : "";
        const b64 = comma >= 0 ? photo.slice(comma + 1) : photo;
        const mime =
          /data:(image\/[a-zA-Z0-9.+-]+)/.exec(header)?.[1] ?? "image/jpeg";
        const buf = Buffer.from(b64, "base64");
        return new Response(buf, {
          headers: {
            "content-type": mime,
            "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      },
      POST: async ({ request, params }) => {
        const id =
          params.id ||
          new URL(request.url).pathname.split("/").filter(Boolean)[2] ||
          "";
        if (!id) return new Response("Not found", { status: 404 });

        let body: {
          photo?: string;
          pattern?: string;
          rating?: number;
          beans?: string;
          milk?: string;
          grind?: string;
          notes?: string;
          createdAt?: string;
        };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const photo = body.photo?.trim();
        if (!photo) return new Response("Photo required", { status: 400 });

        const headers = new Headers(request.headers);
        let userId = "shared";
        try {
          const session = await auth.api.getSession({ headers });
          if (session?.user?.id) userId = session.user.id;
        } catch {
          // ignore session failure
        }

        const sql = await getSql();
        const pattern = body.pattern || "tulip";
        const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)));
        const createdAt = body.createdAt || new Date().toISOString();

        await sql`
          insert into pours (id, user_id, created_at, photo, pattern, rating, beans, milk, grind, notes)
          values (
            ${id},
            ${userId},
            ${createdAt}::timestamptz,
            ${photo},
            ${pattern},
            ${rating},
            ${body.beans || ""},
            ${body.milk || ""},
            ${body.grind || ""},
            ${body.notes || ""}
          )
          on conflict (id) do update set
            photo = case when excluded.photo like 'data:image/%' then excluded.photo else pours.photo end,
            pattern = excluded.pattern,
            rating = excluded.rating,
            beans = case when excluded.beans <> '' then excluded.beans else pours.beans end,
            milk = case when excluded.milk <> '' then excluded.milk else pours.milk end,
            grind = case when excluded.grind <> '' then excluded.grind else pours.grind end,
            notes = case when excluded.notes <> '' then excluded.notes else pours.notes end
        `;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
