export type ToolDisplay = {
  label: string
  loadingMessage: string | ((input: Record<string, unknown>) => string)
  resultMessage: (output: unknown) => string
}

type Portfolio = { summary: { positionCount: number; totalValueUSD: number }; positions: unknown[] }
type Quote = { ticker: string; price: number; changePct: number }
type Company = { name: string; sector?: string }
type NewsItem = { headline: string }[]

export const toolDisplayRegistry: Record<string, ToolDisplay> = {
  get_portfolio: {
    label: "Portfolio",
    loadingMessage: "Fetching your portfolio…",
    resultMessage: (out) => {
      const o = out as Portfolio
      return `${o.summary.positionCount} positions · $${o.summary.totalValueUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    },
  },

  get_quote: {
    label: "Quote",
    loadingMessage: (input) => `Looking up ${input.ticker}…`,
    resultMessage: (out) => {
      const o = out as Quote
      const sign = o.changePct >= 0 ? "+" : ""
      return `${o.ticker} $${o.price.toFixed(2)} (${sign}${o.changePct.toFixed(2)}%)`
    },
  },

  get_company_info: {
    label: "Company",
    loadingMessage: (input) => `Looking up ${input.ticker}…`,
    resultMessage: (out) => {
      const o = out as Company
      return o.sector ? `${o.name} · ${o.sector}` : o.name
    },
  },

  get_news: {
    label: "News",
    loadingMessage: (input) => `Fetching news for ${input.ticker}…`,
    resultMessage: (out) => {
      const o = out as NewsItem
      return `${o.length} article${o.length !== 1 ? "s" : ""} found`
    },
  },
}
