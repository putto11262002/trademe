import { MarketNotFoundError, MarketRateLimitError, MarketUpstreamError } from "../errors"
import { finnhubQuoteSchema } from "../schemas"
import type { Quote } from "../types"

const BASE_URL = "https://finnhub.io/api/v1"

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new MarketUpstreamError("finnhub", "FINNHUB_API_KEY is not set")
  return key
}

async function get<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}token=${apiKey()}`
  const res = await fetch(url)
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after")) || undefined
    throw new MarketRateLimitError("finnhub", retry)
  }
  if (!res.ok) {
    throw new MarketUpstreamError("finnhub", `HTTP ${res.status}`, { status: res.status })
  }
  return (await res.json()) as T
}

export const finnhub = {
  async fetchQuote(ticker: string): Promise<Quote> {
    const raw = await get<unknown>(`/quote?symbol=${encodeURIComponent(ticker)}`)
    const parsed = finnhubQuoteSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /quote response", { cause: parsed.error })
    }
    const q = parsed.data
    // Finnhub returns 0s when ticker is unknown.
    if (q.c === 0 && q.pc === 0 && q.t === 0) {
      throw new MarketNotFoundError(`ticker ${ticker}`)
    }
    return {
      ticker,
      price: q.c,
      previousClose: q.pc,
      change: q.d ?? q.c - q.pc,
      changePct: q.dp ?? ((q.c - q.pc) / q.pc) * 100,
      asOf: new Date(q.t * 1000),
    }
  },
}
