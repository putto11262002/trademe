import { MarketNotFoundError, MarketRateLimitError, MarketUpstreamError } from "../errors"
import {
  finnhubEarningsSchema,
  finnhubCandleSchema,
  finnhubMetricSchema,
  finnhubNewsItemSchema,
  finnhubPriceTargetSchema,
  finnhubProfileSchema,
  finnhubQuoteSchema,
  finnhubRecommendationSchema,
} from "../schemas"
import type {
  CompanyProfile,
  Bar,
  EarningsEvent,
  Fundamentals,
  NewsItem,
  PriceTarget,
  Quote,
  RecommendationTrend,
} from "../types"

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

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export const finnhub = {
  async fetchDailyBars(
    ticker: string,
    opts: { from: Date; to: Date },
  ): Promise<Array<Bar>> {
    const from = Math.floor(opts.from.getTime() / 1000)
    const to = Math.floor(opts.to.getTime() / 1000)
    const raw = await get<unknown>(
      `/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}`,
    )
    const parsed = finnhubCandleSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /stock/candle response", {
        cause: parsed.error,
      })
    }
    const candles = parsed.data
    if (candles.s === "no_data") return []
    if (candles.s !== "ok") {
      throw new MarketUpstreamError("finnhub", `unexpected /stock/candle status ${candles.s}`)
    }

    const closes = candles.c ?? []
    const highs = candles.h ?? []
    const lows = candles.l ?? []
    const opens = candles.o ?? []
    const times = candles.t ?? []
    const volumes = candles.v ?? []
    const len = times.length
    if (
      closes.length !== len ||
      highs.length !== len ||
      lows.length !== len ||
      opens.length !== len ||
      volumes.length !== len
    ) {
      throw new MarketUpstreamError("finnhub", "invalid /stock/candle response lengths")
    }

    return times.map((time, i) => ({
      date: new Date(time * 1000),
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i],
      adjustedClose: closes[i],
    }))
  },

  async fetchQuote(ticker: string): Promise<Quote> {
    const raw = await get<unknown>(`/quote?symbol=${encodeURIComponent(ticker)}`)
    const parsed = finnhubQuoteSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /quote response", { cause: parsed.error })
    }
    const q = parsed.data
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

  async fetchNews(ticker: string, days: number): Promise<Array<NewsItem>> {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
    const raw = await get<unknown>(
      `/company-news?symbol=${encodeURIComponent(ticker)}&from=${isoDate(from)}&to=${isoDate(to)}`,
    )
    if (!Array.isArray(raw)) {
      throw new MarketUpstreamError("finnhub", "invalid /company-news response (not array)")
    }
    const items: Array<NewsItem> = []
    for (const item of raw) {
      const parsed = finnhubNewsItemSchema.safeParse(item)
      if (!parsed.success) continue
      const n = parsed.data
      items.push({
        id: String(n.id),
        ticker,
        headline: n.headline,
        summary: n.summary || undefined,
        url: n.url,
        source: n.source,
        publishedAt: new Date(n.datetime * 1000),
      })
    }
    return items
  },

  async fetchEarnings(
    ticker: string,
    opts?: { from?: Date; to?: Date },
  ): Promise<Array<EarningsEvent>> {
    const params = new URLSearchParams({ symbol: ticker })
    if (opts?.from) params.set("from", isoDate(opts.from))
    if (opts?.to) params.set("to", isoDate(opts.to))
    const raw = await get<unknown>(`/calendar/earnings?${params.toString()}`)
    const parsed = finnhubEarningsSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /calendar/earnings response", {
        cause: parsed.error,
      })
    }
    const events: Array<EarningsEvent> = []
    for (const e of parsed.data.earningsCalendar ?? []) {
      events.push({
        ticker: e.symbol,
        date: new Date(e.date),
        estimatedEPS: e.epsEstimate ?? undefined,
        actualEPS: e.epsActual ?? undefined,
      })
    }
    return events
  },

  async fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
    const raw = await get<unknown>(`/stock/profile2?symbol=${encodeURIComponent(ticker)}`)
    const parsed = finnhubProfileSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /stock/profile2 response", {
        cause: parsed.error,
      })
    }
    const p = parsed.data
    if (!p.ticker || !p.name || !p.exchange) {
      throw new MarketNotFoundError(`profile for ${ticker}`)
    }
    return {
      ticker: p.ticker,
      name: p.name,
      exchange: p.exchange,
      industry: p.finnhubIndustry || undefined,
      logoUrl: p.logo || undefined,
      website: p.weburl || undefined,
    }
  },

  async fetchFundamentals(ticker: string): Promise<Fundamentals> {
    const raw = await get<unknown>(
      `/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`,
    )
    const parsed = finnhubMetricSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /stock/metric response", {
        cause: parsed.error,
      })
    }
    const m = parsed.data.metric ?? {}
    const num = (k: string): number | undefined => {
      const v = m[k]
      return typeof v === "number" ? v : undefined
    }
    const revenuePerShare = num("revenuePerShareTTM")
    const sharesOut = num("shareOutstanding")
    const revenue =
      revenuePerShare != null && sharesOut != null
        ? revenuePerShare * sharesOut * 1_000_000
        : undefined
    return {
      ticker,
      asOf: new Date(),
      marketCap: num("marketCapitalization"),
      peRatio: num("peTTM") ?? num("peNormalizedAnnual"),
      eps: num("epsTTM") ?? num("epsAnnual"),
      revenue,
      week52High: num("52WeekHigh"),
      week52Low: num("52WeekLow"),
      dividendYield: num("dividendYieldIndicatedAnnual"),
      beta: num("beta"),
    }
  },

  async fetchPriceTarget(ticker: string): Promise<PriceTarget> {
    const raw = await get<unknown>(
      `/stock/price-target?symbol=${encodeURIComponent(ticker)}`,
    )
    const parsed = finnhubPriceTargetSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /stock/price-target response", {
        cause: parsed.error,
      })
    }
    const p = parsed.data
    return {
      ticker,
      targetHigh: p.targetHigh ?? undefined,
      targetLow: p.targetLow ?? undefined,
      targetMean: p.targetMean ?? undefined,
      targetMedian: p.targetMedian ?? undefined,
      numberOfAnalysts: p.numberOfAnalysts ?? undefined,
      lastUpdated: p.lastUpdated ? new Date(p.lastUpdated) : undefined,
    }
  },

  async fetchRecommendationTrends(
    ticker: string,
  ): Promise<Array<RecommendationTrend>> {
    const raw = await get<unknown>(
      `/stock/recommendation?symbol=${encodeURIComponent(ticker)}`,
    )
    const parsed = finnhubRecommendationSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("finnhub", "invalid /stock/recommendation response", {
        cause: parsed.error,
      })
    }
    return parsed.data.map((r) => ({
      ticker: r.symbol,
      period: new Date(r.period),
      buy: r.buy,
      hold: r.hold,
      sell: r.sell,
      strongBuy: r.strongBuy,
      strongSell: r.strongSell,
    }))
  },
}
