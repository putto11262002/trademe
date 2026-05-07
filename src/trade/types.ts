import type { BrokerSlug } from "./brokers"

export type TradeSide = "buy" | "sell"
export type TradeSource = "manual" | "slip"

export type Trade = {
  id: string
  userId: string
  ticker: string
  side: TradeSide
  quantity: number
  pricePerShare: number
  fees: number
  tradedAt: Date
  broker: BrokerSlug | null
  slipId: string | null
  source: TradeSource
  createdAt: Date
}

export type Position = {
  ticker: string
  netQuantity: number
  totalBought: number
  totalSold: number
  totalCost: number
  totalCostTHB: number
  totalProceeds: number
  totalProceedsTHB: number
  tradeCount: number
}

export type SectorAllocation = {
  sector: string
  valueTHB: number
  pct: number
}

export type EnrichedPosition = Position & {
  name: string
  sector?: string
  logoUrl?: string
  currentPriceUSD: number
  priceAsOf: Date
  avgCost: number
  avgCostTHB: number
  valueUSD: number
  valueTHB: number
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
  fxRate: number
  fxAsOf: Date
}

export type PortfolioSummary = {
  totalValueUSD: number
  totalValueTHB: number
  totalCostUSD: number
  totalCostTHB: number
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
  unrealizedPnLTHB: number
  /** THB P&L attributable to stock price moves (= unrealizedPnLUSD * blended entry FX). */
  stockPnLTHB: number
  /** THB P&L attributable to USD/THB moves (= unrealizedPnLTHB - stockPnLTHB). */
  fxPnLTHB: number
  /** Realized P&L in USD using avg-cost method across all closed/partially-closed positions. */
  realizedPnLUSD: number
  /** Realized P&L in THB using each trade's FX rate (entry FX for cost, exit FX for proceeds). */
  realizedPnLTHB: number
  sectorAllocation: Array<SectorAllocation>
  positionCount: number
  asOf: Date
  fxRate: number
  fxAsOf: Date
}

export type PortfolioDashboard = {
  summary: PortfolioSummary
  positions: Array<EnrichedPosition>
}

import type {
  CompanyProfile,
  EarningsEvent,
  Fundamentals,
  NewsItem,
  PriceTarget,
  Quote,
  RecommendationTrend,
} from "@/market"

export type PositionDetail = {
  ticker: string
  position: EnrichedPosition | null
  quote: Quote
  profile: CompanyProfile
  fundamentals: Fundamentals | null
  priceTarget: PriceTarget | null
  recommendation: RecommendationTrend | null
  news: Array<NewsItem>
  nextEarnings: EarningsEvent | null
  pastEarnings: Array<EarningsEvent>
  trades: Array<Trade>
  fxRate: number
  fxAsOf: Date
}
