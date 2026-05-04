export type Currency = "USD" | "THB" | (string & {})

export type Quote = {
  ticker: string
  price: number
  previousClose: number
  change: number
  changePct: number
  asOf: Date
}

export type Bar = {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
}

export type Fundamentals = {
  ticker: string
  asOf: Date
  marketCap?: number
  peRatio?: number
  eps?: number
  revenue?: number
  week52High?: number
  week52Low?: number
  dividendYield?: number
}

export type NewsItem = {
  id: string
  ticker: string
  headline: string
  summary?: string
  url: string
  source: string
  publishedAt: Date
  sentiment?: "positive" | "negative" | "neutral"
}

export type EarningsEvent = {
  ticker: string
  date: Date
  estimatedEPS?: number
  actualEPS?: number
}

export type CompanyProfile = {
  ticker: string
  name: string
  exchange: string
  sector?: string
  industry?: string
  logoUrl?: string
  website?: string
  description?: string
}

export type FXRate = {
  from: Currency
  to: Currency
  rate: number
  asOf: Date
}

export type FXBar = {
  from: Currency
  to: Currency
  date: Date
  rate: number
}
