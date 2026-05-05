export type TradeSide = "buy" | "sell"
export type TradeSource = "manual"

export type Trade = {
  id: string
  userId: string
  ticker: string
  side: TradeSide
  quantity: number
  pricePerShare: number
  fees: number
  fxRate: number | null
  tradedAt: Date
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

export type EnrichedPosition = Position & {
  name: string
  logoUrl?: string
  currentPriceUSD: number
  priceAsOf: Date
  avgCost: number
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
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
  positionCount: number
  asOf: Date
  fxRate: number
  fxAsOf: Date
}

export type PortfolioDashboard = {
  summary: PortfolioSummary
  positions: Array<EnrichedPosition>
}
