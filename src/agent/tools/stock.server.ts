import { tool } from "ai"
import { z } from "zod"
import { getQuote, getNews, getCompanyProfile, getFundamentals } from "@/market/api.server"

export const stockTools = {
  get_quote: tool({
    description:
      "Get the current price, daily change, and basic stats for a stock ticker. Use this for any question about a stock's current price or today's performance.",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol, e.g. AAPL, NVDA, TSLA"),
    }),
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

  get_company_info: tool({
    description:
      "Get company profile and key fundamentals (P/E ratio, EPS, market cap, 52-week high/low) for a ticker. Use when the user asks about a company's business, valuation, or key stats.",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol"),
    }),
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
        week52High: fundamentals.week52High,
        week52Low: fundamentals.week52Low,
        beta: fundamentals.beta,
        dividendYield: fundamentals.dividendYield,
      }
    },
  }),

  get_news: tool({
    description:
      "Get recent news headlines for a stock ticker. Use when the user asks what's happening with a stock or wants market context.",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol"),
      days: z.number().optional().describe("Days to look back, default 7"),
    }),
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
}
