import { count } from "drizzle-orm"
import handler from "@tanstack/react-start/server-entry"
import { getDb } from "@/db/index.server"
import { trade } from "@/db/schema"
import { getFXRate, getQuote } from "@/market/api.server"
import type { Currency } from "@/market"

function jsonError(e: unknown, status = 500) {
  return Response.json(
    { ok: false, error: e instanceof Error ? e.message : String(e) },
    { status },
  )
}

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === "/api/health") {
      try {
        const [row] = await getDb().select({ value: count() }).from(trade)
        return Response.json({ ok: true, tradeCount: row.value })
      } catch (e) {
        return jsonError(e)
      }
    }

    // DEV smoke endpoints — remove once chat/portfolio consume the market layer directly.
    const quoteMatch = url.pathname.match(/^\/api\/dev\/quote\/([A-Za-z0-9.-]+)$/)
    if (quoteMatch) {
      try {
        const quote = await getQuote(quoteMatch[1])
        return Response.json({ ok: true, quote })
      } catch (e) {
        return jsonError(e)
      }
    }

    const fxMatch = url.pathname.match(/^\/api\/dev\/fx\/([A-Za-z]{3})\/([A-Za-z]{3})$/)
    if (fxMatch) {
      try {
        const rate = await getFXRate(fxMatch[1].toUpperCase() as Currency, fxMatch[2].toUpperCase() as Currency)
        return Response.json({ ok: true, rate })
      } catch (e) {
        return jsonError(e)
      }
    }

    return handler.fetch(request)
  },
} satisfies ExportedHandler<Env>
