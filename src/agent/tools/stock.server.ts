import { tool } from "ai"
import { z } from "zod"
import {
  getCompanyProfile,
  getDailyBars,
  getFXRate,
  getFundamentals,
  getNews,
  getNextEarnings,
  getPastEarnings,
  getPriceTarget,
  getQuote,
  getRecommendationTrends,
} from "@/market/api.server"
import type { Currency } from "@/market"

const tickerInput = z.object({
  ticker: z.string().trim().min(1).max(20).describe("Stock ticker symbol, e.g. AAPL, NVDA, TSLA"),
})

const DAY_MS = 24 * 60 * 60 * 1000

function rangeToDates(range: "1mo" | "3mo" | "6mo" | "1y" | "2y"): {
  from: Date
  to: Date
} {
  const to = new Date()
  const days =
    range === "1mo" ? 31 :
    range === "3mo" ? 93 :
    range === "6mo" ? 186 :
    range === "1y" ? 366 :
    732
  return { from: new Date(to.getTime() - days * DAY_MS), to }
}

function compactNews(daysDefault = 7) {
  return tickerInput.extend({
    days: z.number().int().positive().max(30).default(daysDefault).describe("Days to look back, max 30"),
  })
}

export const stockTools = {
  market_get_quote: tool({
    description:
      "Get the current price, daily change, and basic stats for a stock ticker. Use this for any question about a stock's current price or today's performance.",
    inputSchema: tickerInput,
    execute: async ({ ticker }) => {
      const quote = await getQuote(ticker)
      return {
        ticker: quote.ticker,
        price: quote.price,
        change: quote.change,
        changePct: quote.changePct,
        previousClose: quote.previousClose,
        asOf: quote.asOf,
      }
    },
  }),

  market_get_company_info: tool({
    description:
      "Get a compact company profile plus key stats for a ticker. Use for business, sector, industry, profile, or quick company-context questions.",
    inputSchema: tickerInput,
    execute: async ({ ticker }) => {
      const [profile, fundamentals] = await Promise.all([
        getCompanyProfile(ticker),
        getFundamentals(ticker),
      ])
      return {
        name: profile.name,
        industry: profile.industry,
        sector: profile.sector,
        marketCap: fundamentals.marketCap,
        peRatio: fundamentals.peRatio,
        eps: fundamentals.eps,
        revenue: fundamentals.revenue,
        week52High: fundamentals.week52High,
        week52Low: fundamentals.week52Low,
        beta: fundamentals.beta,
        dividendYield: fundamentals.dividendYield,
      }
    },
  }),

  news_get_recent: tool({
    description:
      "Get recent news headlines for a stock ticker. Use when the user asks what's happening with a stock or wants market context. Returns compact headline/source/URL context, not full article bodies.",
    inputSchema: compactNews(),
    execute: async ({ ticker, days = 7 }) => {
      const articles = await getNews(ticker, { days })
      return articles.slice(0, 5).map((a) => ({
        headline: a.headline,
        summary: a.summary,
        source: a.source,
        publishedAt: a.publishedAt,
        url: a.url,
      }))
    },
  }),

  market_get_fundamentals: tool({
    description:
      "Get compact fundamental and valuation metrics for a stock ticker. Use for valuation, size, earnings, dividend, beta, and 52-week range questions.",
    inputSchema: tickerInput,
    execute: async ({ ticker }) => {
      const f = await getFundamentals(ticker)
      return {
        ticker: f.ticker,
        asOf: f.asOf,
        marketCap: f.marketCap,
        peRatio: f.peRatio,
        eps: f.eps,
        revenue: f.revenue,
        week52High: f.week52High,
        week52Low: f.week52Low,
        dividendYield: f.dividendYield,
        beta: f.beta,
      }
    },
  }),

  market_get_earnings: tool({
    description:
      "Get next earnings date and recent past earnings for a stock ticker. Use for earnings prep, upcoming catalyst, and post-earnings context.",
    inputSchema: tickerInput.extend({
      pastLimit: z.number().int().positive().max(12).default(4).describe("Number of past earnings events to include, max 12"),
    }),
    execute: async ({ ticker, pastLimit = 4 }) => {
      const [next, past] = await Promise.all([
        getNextEarnings(ticker),
        getPastEarnings(ticker, pastLimit),
      ])
      return {
        ticker: ticker.toUpperCase(),
        next,
        past,
      }
    },
  }),

  market_get_price_target: tool({
    description:
      "Get analyst price-target summary for a ticker. Use only as analyst-context, not as a prediction or recommendation.",
    inputSchema: tickerInput,
    execute: async ({ ticker }) => getPriceTarget(ticker),
  }),

  market_get_recommendation_trends: tool({
    description:
      "Get analyst recommendation trends for a ticker. Use to describe broad analyst sentiment changes with caveats.",
    inputSchema: tickerInput,
    execute: async ({ ticker }) => {
      const trends = await getRecommendationTrends(ticker)
      return {
        ticker: ticker.toUpperCase(),
        latest: trends[0] ?? null,
        trends: trends.slice(0, 6),
      }
    },
  }),

  market_get_fx_rate: tool({
    description:
      "Get the current FX rate for a currency pair. Use for USD/THB portfolio context and currency-impact questions.",
    inputSchema: z.object({
      from: z.string().trim().length(3).default("USD").describe("Base currency code, e.g. USD"),
      to: z.string().trim().length(3).default("THB").describe("Quote currency code, e.g. THB"),
    }),
    execute: async ({ from = "USD", to = "THB" }) => {
      const rate = await getFXRate(from.toUpperCase() as Currency, to.toUpperCase() as Currency)
      return rate
    },
  }),

  market_get_price_history_summary: tool({
    description:
      "Get a compact summary of daily price history for a ticker. Use for trend context without returning raw candle arrays. Use analysis_run_code when detailed candle calculations are required.",
    inputSchema: tickerInput.extend({
      range: z.enum(["1mo", "3mo", "6mo", "1y", "2y"]).default("1y").describe("History window to summarize"),
    }),
    execute: async ({ ticker, range = "1y" }) => {
      const { from, to } = rangeToDates(range)
      const bars = await getDailyBars(ticker, { from, to })
      const first = bars[0]
      const latest = bars.at(-1)
      const high = bars.reduce((max, bar) => Math.max(max, bar.high), Number.NEGATIVE_INFINITY)
      const low = bars.reduce((min, bar) => Math.min(min, bar.low), Number.POSITIVE_INFINITY)
      const totalVolume = bars.reduce((sum, bar) => sum + bar.volume, 0)
      const avgVolume = bars.length > 0 ? totalVolume / bars.length : null
      return {
        ticker: ticker.toUpperCase(),
        range,
        from,
        to,
        barCount: bars.length,
        firstClose: first?.close ?? null,
        latestClose: latest?.close ?? null,
        latestDate: latest?.date ?? null,
        periodReturnPct:
          first && latest && first.close > 0
            ? ((latest.close - first.close) / first.close) * 100
            : null,
        high: Number.isFinite(high) ? high : null,
        low: Number.isFinite(low) ? low : null,
        avgVolume,
      }
    },
  }),
}
