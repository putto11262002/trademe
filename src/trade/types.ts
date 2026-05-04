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
