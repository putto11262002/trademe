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
  totalProceeds: number
  tradeCount: number
}

export type SectorAllocation = {
  sector: string
  valueUSD: number
  pct: number
}

export type EnrichedPosition = Position & {
  name: string
  sector?: string
  logoUrl?: string
  currentPriceUSD: number
  priceAsOf: Date
  avgCost: number
  valueUSD: number
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
}

export type PortfolioSummary = {
  totalValueUSD: number
  totalCostUSD: number
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
  /** Realized P&L in USD using avg-cost method across all closed/partially-closed positions. */
  realizedPnLUSD: number
  sectorAllocation: Array<SectorAllocation>
  positionCount: number
  asOf: Date
  /** Current USD→THB rate, kept solely for display ("≈฿X at today's rate"). Not used in P&L math. */
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
}
