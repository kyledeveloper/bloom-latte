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
        const session = await auth.api.getSession({ headers });
        const userId = session?.user?.id;
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const sql = await getSql();
        const rows = await sql<{ photo: string }>`
          select photo from pours where id = ${id} and user_id = ${userId} limit 1
        `;
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
            "cache-control": "private, max-age=86400, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
