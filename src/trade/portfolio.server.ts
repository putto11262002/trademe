import {
  getCompanyProfile,
  getFXRate,
  getQuote,
} from "@/market/api.server"
import type { CompanyProfile, FXRate, Quote } from "@/market"
import { getPositions } from "./api.server"
import type {
  EnrichedPosition,
  PortfolioDashboard,
  PortfolioSummary,
  Position,
} from "./types"

function enrich(
  p: Position,
  quote: Quote,
  profile: CompanyProfile,
  fx: FXRate,
): EnrichedPosition {
  const avgCost = p.totalBought > 0 ? p.totalCost / p.totalBought : 0
  const valueUSD = p.netQuantity * quote.price
  const valueTHB = valueUSD * fx.rate
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
    fxRate: fx.rate,
    fxAsOf: fx.asOf,
  }
}

function computeSummary(
  enriched: Array<EnrichedPosition>,
  fx: FXRate,
): PortfolioSummary {
  const totalValueUSD = enriched.reduce((s, p) => s + p.valueUSD, 0)
  const totalCostUSD = enriched.reduce((s, p) => s + p.avgCost * p.netQuantity, 0)
  const unrealizedPnLUSD = totalValueUSD - totalCostUSD
  const unrealizedPnLPct = totalCostUSD > 0 ? (unrealizedPnLUSD / totalCostUSD) * 100 : 0
  return {
    totalValueUSD,
    totalValueTHB: totalValueUSD * fx.rate,
    totalCostUSD,
    unrealizedPnLUSD,
    unrealizedPnLPct,
    positionCount: enriched.length,
    asOf: new Date(),
    fxRate: fx.rate,
    fxAsOf: fx.asOf,
  }
}

export async function getPortfolioDashboard(): Promise<PortfolioDashboard> {
  const positions = await getPositions()
  const open = positions.filter((p) => p.netQuantity > 0)

  const fx = await getFXRate("USD", "THB")

  const enriched = await Promise.all(
    open.map(async (p) => {
      const [quote, profile] = await Promise.all([
        getQuote(p.ticker),
        getCompanyProfile(p.ticker),
      ])
      return enrich(p, quote, profile, fx)
    }),
  )

  return {
    summary: computeSummary(enriched, fx),
    positions: enriched,
  }
}
