import {
  MarketRateLimitError,
  MarketUpstreamError,
} from "../errors"
import { fmpHistoricalPriceSchema } from "../schemas"
import type { Bar } from "../types"

const BASE_URL = "https://financialmodelingprep.com/stable"

function apiKey(): string {
  const key = process.env.FMP_API_KEY
  if (!key) throw new MarketUpstreamError("fmp", "FMP_API_KEY is not set")
  return key
}

async function get<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}apikey=${apiKey()}`
  const res = await fetch(url)
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after")) || undefined
    throw new MarketRateLimitError("fmp", retry)
  }
  if (!res.ok) {
    throw new MarketUpstreamError("fmp", `HTTP ${res.status}`, {
      status: res.status,
    })
  }
  return (await res.json()) as T
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export const fmp = {
  async fetchDailyBars(
    ticker: string,
    opts: { from: Date; to: Date },
  ): Promise<Array<Bar>> {
    const params = new URLSearchParams({
      symbol: ticker,
      from: isoDate(opts.from),
      to: isoDate(opts.to),
    })
    const raw = await get<unknown>(`/historical-price-eod/full?${params.toString()}`)
    const parsed = fmpHistoricalPriceSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("fmp", "invalid /historical-price-eod/full response", {
        cause: parsed.error,
      })
    }

    return parsed.data
      .map((item) => ({
        date: new Date(`${item.date}T00:00:00.000Z`),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjustedClose: item.close,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  },
}
