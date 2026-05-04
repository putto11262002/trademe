import { count } from "drizzle-orm"
import handler from "@tanstack/react-start/server-entry"
import { getDb } from "@/db/index.server"
import { testUser } from "@/db/schema"

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === "/api/health") {
      try {
        const [row] = await getDb().select({ value: count() }).from(testUser)
        return Response.json({ ok: true, testUserCount: row.value })
      } catch (e) {
        return Response.json(
          { ok: false, error: e instanceof Error ? e.message : String(e) },
          { status: 500 },
        )
      }
    }

    return handler.fetch(request)
  },
} satisfies ExportedHandler<Env>
