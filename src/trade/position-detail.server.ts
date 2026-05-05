import {
  getCompanyProfile,
  getFXRate,
  getFundamentals,
  getLatestRecommendation,
  getNews,
  getNextEarnings,
  getPastEarnings,
  getPriceTarget,
  getQuote,
} from "@/market/api.server"
import type {
  CompanyProfile,
  EarningsEvent,
  Fundamentals,
  NewsItem,
  PriceTarget,
  Quote,
  RecommendationTrend,
} from "@/market"
import { getPositions, getTradesForTicker } from "./api.server"
import type { EnrichedPosition, PositionDetail, Position, Trade } from "./types"

function settled<T>(p: Promise<T>): Promise<T | null> {
  return p.then(
    (v) => v,
    (err) => {
      console.warn("position-detail: optional fetch failed", err)
      return null
    },
  )
}

function enrich(
  p: Position,
  quote: Quote,
  profile: CompanyProfile,
  fxRate: number,
  fxAsOf: Date,
): EnrichedPosition {
  const avgCost = p.totalBought > 0 ? p.totalCost / p.totalBought : 0
  const valueUSD = p.netQuantity * quote.price
  const valueTHB = valueUSD * fxRate
  const costForOpenLeg = avgCost * p.netQuantity
  const unrealizedPnLUSD = valueUSD - costForOpenLeg
  const unrealizedPnLPct = costForOpenLeg > 0 ? (unrealizedPnLUSD / costForOpenLeg) * 100 : 0

  return {
    ...p,
    name: profile.name,
    logoUrl: profile.logoUrl,
    currentPriceUSD: quote.price,
    priceAsOf: quote.asOf,
    avgCost,
    valueUSD,
    valueTHB,
    unrealizedPnLUSD,
    unrealizedPnLPct,
    fxRate,
    fxAsOf,
  }
}

export async function getPositionDetail(
  ticker: string,
): Promise<PositionDetail> {
  const symbol = ticker.toUpperCase()

  // Required: quote + profile + trades + fx (page is meaningless without these)
  const [quote, profile, trades, fx, positions] = await Promise.all([
    getQuote(symbol),
    getCompanyProfile(symbol),
    getTradesForTicker(symbol),
    getFXRate("USD", "THB"),
    getPositions(),
  ])

  const rawPosition = positions.find((p) => p.ticker === symbol) ?? null
  const position = rawPosition
    ? enrich(rawPosition, quote, profile, fx.rate, fx.asOf)
    : null

  // Optional: enrichment data — failures degrade gracefully
  const [
    fundamentals,
    priceTarget,
    recommendation,
    news,
    nextEarnings,
    pastEarnings,
  ] = await Promise.all([
    settled<Fundamentals>(getFundamentals(symbol)),
    settled<PriceTarget>(getPriceTarget(symbol)),
    settled<RecommendationTrend | null>(getLatestRecommendation(symbol)).then(
      (v) => v ?? null,
    ),
    settled<Array<NewsItem>>(getNews(symbol, { days: 14 })).then(
      (v) => v ?? [],
    ),
    settled<EarningsEvent | null>(getNextEarnings(symbol)).then((v) => v ?? null),
    settled<Array<EarningsEvent>>(getPastEarnings(symbol, 8)).then(
      (v) => v ?? [],
    ),
  ])

  const tradesNormalized: Array<Trade> = trades

  return {
    ticker: symbol,
    position,
    quote,
    profile,
    fundamentals,
    priceTarget,
    recommendation,
    news,
    nextEarnings,
    pastEarnings,
    trades: tradesNormalized,
    fxRate: fx.rate,
    fxAsOf: fx.asOf,
  }
}
