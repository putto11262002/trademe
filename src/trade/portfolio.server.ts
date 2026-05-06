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
  SectorAllocation,
} from "./types"

const UNKNOWN_SECTOR = "Unknown"

function enrich(
  p: Position,
  quote: Quote,
  profile: CompanyProfile,
  fx: FXRate,
): EnrichedPosition {
  const avgCost = p.totalBought > 0 ? p.totalCost / p.totalBought : 0
  // USD-funded buys contribute 0 to totalCostTHB. Fall back to current FX so
  // pure-USD positions still surface a sensible THB basis. This means fxPnLTHB
  // on USD-funded trades will read as ~0 (we don't track when the user
  // originally acquired their USD, so honest attribution isn't possible).
  const avgCostTHB =
    p.totalBought > 0 && p.totalCostTHB > 0
      ? p.totalCostTHB / p.totalBought
      : avgCost * fx.rate
  const valueUSD = p.netQuantity * quote.price
  const valueTHB = valueUSD * fx.rate
  const costForOpenLeg = avgCost * p.netQuantity
  const unrealizedPnLUSD = valueUSD - costForOpenLeg
  const unrealizedPnLPct = costForOpenLeg > 0 ? (unrealizedPnLUSD / costForOpenLeg) * 100 : 0

  return {
    ...p,
    name: profile.name,
    // Finnhub's /stock/profile2 returns industry only; fall back so the
    // sector breakdown is meaningful today and upgrades for free if a
    // vendor provides true sector later.
    sector: profile.sector ?? profile.industry,
    logoUrl: profile.logoUrl,
    currentPriceUSD: quote.price,
    priceAsOf: quote.asOf,
    avgCost,
    avgCostTHB,
    valueUSD,
    valueTHB,
    unrealizedPnLUSD,
    unrealizedPnLPct,
    fxRate: fx.rate,
    fxAsOf: fx.asOf,
  }
}

function computeSectorAllocation(
  enriched: Array<EnrichedPosition>,
): Array<SectorAllocation> {
  const totalValueTHB = enriched.reduce((s, p) => s + p.valueTHB, 0)
  const bySector = new Map<string, number>()
  for (const p of enriched) {
    const key = p.sector?.trim() || UNKNOWN_SECTOR
    bySector.set(key, (bySector.get(key) ?? 0) + p.valueTHB)
  }
  return Array.from(bySector.entries())
    .map(([sector, valueTHB]) => ({
      sector,
      valueTHB,
      pct: totalValueTHB > 0 ? (valueTHB / totalValueTHB) * 100 : 0,
    }))
    .sort((a, b) => b.valueTHB - a.valueTHB)
}

/**
 * Realized P&L using average-cost method, summed across every position
 * that has had at least one sell (including fully-closed ones).
 *   realizedUSD = sum( totalProceeds - avgCostUSD * totalSold )
 *   realizedTHB = sum( totalProceedsTHB - avgCostTHB * totalSold )
 * Avg cost is computed from the total buys *to date*, which is a reasonable
 * approximation when buys precede sells. Pure FIFO can refine this later.
 *
 * Note: realizedPnLTHB is approximate for positions with mixed
 * THB-funded and USD-funded legs — totalCostTHB / totalBought blends
 * a THB-only numerator over an all-shares denominator. Pure-currency
 * positions are exact.
 */
function computeRealizedPnL(positions: Array<Position>): {
  realizedPnLUSD: number
  realizedPnLTHB: number
} {
  let realizedPnLUSD = 0
  let realizedPnLTHB = 0
  for (const p of positions) {
    if (p.totalSold <= 0 || p.totalBought <= 0) continue
    const avgCostUSD = p.totalCost / p.totalBought
    const avgCostTHB = p.totalCostTHB / p.totalBought
    realizedPnLUSD += p.totalProceeds - avgCostUSD * p.totalSold
    realizedPnLTHB += p.totalProceedsTHB - avgCostTHB * p.totalSold
  }
  return { realizedPnLUSD, realizedPnLTHB }
}

function computeSummary(
  enriched: Array<EnrichedPosition>,
  allPositions: Array<Position>,
  fx: FXRate,
): PortfolioSummary {
  const totalValueUSD = enriched.reduce((s, p) => s + p.valueUSD, 0)
  const totalValueTHB = totalValueUSD * fx.rate
  const totalCostUSD = enriched.reduce((s, p) => s + p.avgCost * p.netQuantity, 0)
  const totalCostTHB = enriched.reduce((s, p) => s + p.avgCostTHB * p.netQuantity, 0)
  const unrealizedPnLUSD = totalValueUSD - totalCostUSD
  const unrealizedPnLPct = totalCostUSD > 0 ? (unrealizedPnLUSD / totalCostUSD) * 100 : 0
  const unrealizedPnLTHB = totalValueTHB - totalCostTHB

  // Stock-vs-FX decomposition (THB):
  // stockPnLTHB = USD gain converted at the *blended entry FX* — i.e. what
  // the THB gain would have been had USD/THB never moved since entry.
  // fxPnLTHB = the residual, which is the FX-driven contribution.
  const blendedEntryFx =
    totalCostUSD > 0 ? totalCostTHB / totalCostUSD : fx.rate
  const stockPnLTHB = unrealizedPnLUSD * blendedEntryFx
  const fxPnLTHB = unrealizedPnLTHB - stockPnLTHB

  const { realizedPnLUSD, realizedPnLTHB } = computeRealizedPnL(allPositions)
  const sectorAllocation = computeSectorAllocation(enriched)

  return {
    totalValueUSD,
    totalValueTHB,
    totalCostUSD,
    totalCostTHB,
    unrealizedPnLUSD,
    unrealizedPnLPct,
    unrealizedPnLTHB,
    stockPnLTHB,
    fxPnLTHB,
    realizedPnLUSD,
    realizedPnLTHB,
    sectorAllocation,
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
    summary: computeSummary(enriched, positions, fx),
    positions: enriched,
  }
}
