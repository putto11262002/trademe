import { z } from "zod"
import { getPortfolioDashboard } from "@/trade/portfolio.server"
import {
  getDailyBars,
  getFundamentals,
  getNews,
  getQuote,
} from "@/market/api.server"
import { requireSandboxSession } from "./auth.server"

const MAX_CANDLE_RANGE_DAYS = 730
const tickerSchema = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9.-]+$/)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init)
}

function jsonError(error: string, status = 400): Response {
  return Response.json({ ok: false, error }, { status })
}

function parseSearchParams<T>(
  url: URL,
  schema: z.ZodType<T>,
): T | Response {
  const raw = Object.fromEntries(url.searchParams.entries())
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(z.prettifyError(parsed.error), 400)
  }
  return parsed.data
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

const tickerInput = z.object({
  ticker: tickerSchema.transform((value) => value.toUpperCase()),
})

const candlesInput = tickerInput.extend({
  from: dateSchema,
  to: dateSchema,
})

const newsInput = tickerInput.extend({
  days: z.coerce.number().int().positive().max(30).default(7),
})

export async function handleSandboxApi(
  request: Request,
  env: Env,
): Promise<Response> {
  const session = requireSandboxSession(request, env)
  if (session instanceof Response) return session

  if (request.method !== "GET") {
    return jsonError("Method not allowed", 405)
  }

  const url = new URL(request.url)

  try {
    if (url.pathname === "/api/sandbox/portfolio/dashboard") {
      return json(await getPortfolioDashboard())
    }

    if (url.pathname === "/api/sandbox/market/quote") {
      const input = parseSearchParams(url, tickerInput)
      if (input instanceof Response) return input
      return json(await getQuote(input.ticker))
    }

    if (url.pathname === "/api/sandbox/market/candles") {
      const input = parseSearchParams(url, candlesInput)
      if (input instanceof Response) return input

      const from = parseDate(input.from)
      const to = parseDate(input.to)
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return jsonError("Invalid date")
      }
      if (from > to) return jsonError("from must be before or equal to to")
      if (daysBetween(from, to) > MAX_CANDLE_RANGE_DAYS) {
        return jsonError(`Candle range cannot exceed ${MAX_CANDLE_RANGE_DAYS} days`)
      }

      return json(await getDailyBars(input.ticker, { from, to }))
    }

    if (url.pathname === "/api/sandbox/market/news") {
      const input = parseSearchParams(url, newsInput)
      if (input instanceof Response) return input
      return json(await getNews(input.ticker, { days: input.days }))
    }

    if (url.pathname === "/api/sandbox/market/fundamentals") {
      const input = parseSearchParams(url, tickerInput)
      if (input instanceof Response) return input
      return json(await getFundamentals(input.ticker))
    }

    return jsonError("Unknown sandbox endpoint", 404)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonError(message, 500)
  }
}

