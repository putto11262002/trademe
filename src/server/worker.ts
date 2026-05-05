import { count } from "drizzle-orm"
import handler from "@tanstack/react-start/server-entry"
import { routeAgentRequest } from "agents"
export { ChatAgent } from "@/agent/runtime/chat-agent.server"
import { getDb } from "@/db/index.server"
import { trade } from "@/db/schema"
import {
  getCompanyProfile,
  getFXRate,
  getFundamentals,
  getNews,
  getNextEarnings,
  getQuote,
} from "@/market/api.server"
import type { Currency } from "@/market"

function jsonError(e: unknown, status = 500) {
  return Response.json(
    { ok: false, error: e instanceof Error ? e.message : String(e) },
    { status },
  )
}

export default {
  async fetch(request, env) {
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
    let m
    if ((m = url.pathname.match(/^\/api\/dev\/quote\/([A-Za-z0-9.-]+)$/))) {
      try {
        return Response.json({ ok: true, quote: await getQuote(m[1]) })
      } catch (e) {
        return jsonError(e)
      }
    }
    if ((m = url.pathname.match(/^\/api\/dev\/fx\/([A-Za-z]{3})\/([A-Za-z]{3})$/))) {
      try {
        const rate = await getFXRate(
          m[1].toUpperCase() as Currency,
          m[2].toUpperCase() as Currency,
        )
        return Response.json({ ok: true, rate })
      } catch (e) {
        return jsonError(e)
      }
    }
    if ((m = url.pathname.match(/^\/api\/dev\/news\/([A-Za-z0-9.-]+)$/))) {
      try {
        const days = Number(url.searchParams.get("days") ?? 7)
        return Response.json({ ok: true, news: await getNews(m[1], { days }) })
      } catch (e) {
        return jsonError(e)
      }
    }
    if ((m = url.pathname.match(/^\/api\/dev\/earnings\/([A-Za-z0-9.-]+)$/))) {
      try {
        return Response.json({ ok: true, next: await getNextEarnings(m[1]) })
      } catch (e) {
        return jsonError(e)
      }
    }
    if ((m = url.pathname.match(/^\/api\/dev\/company\/([A-Za-z0-9.-]+)$/))) {
      try {
        return Response.json({ ok: true, profile: await getCompanyProfile(m[1]) })
      } catch (e) {
        return jsonError(e)
      }
    }
    if ((m = url.pathname.match(/^\/api\/dev\/fundamentals\/([A-Za-z0-9.-]+)$/))) {
      try {
        return Response.json({ ok: true, fundamentals: await getFundamentals(m[1]) })
      } catch (e) {
        return jsonError(e)
      }
    }

    const agentRes = await routeAgentRequest(request, env as Env)
    if (agentRes) return agentRes

    return handler.fetch(request)
  },
} satisfies ExportedHandler<Env>
