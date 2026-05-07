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
): EnrichedPosition {
  const avgCost = p.totalBought > 0 ? p.totalCost / p.totalBought : 0
  const valueUSD = p.netQuantity * quote.price
  const costForOpenLeg = avgCost * p.netQuantity
  const unrealizedPnLUSD = valueUSD - costForOpenLeg
  const unrealizedPnLPct =
    costForOpenLeg > 0 ? (unrealizedPnLUSD / costForOpenLeg) * 100 : 0

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
    valueUSD,
    unrealizedPnLUSD,
    unrealizedPnLPct,
  }
}

function computeSectorAllocation(
  enriched: Array<EnrichedPosition>,
): Array<SectorAllocation> {
  const totalValueUSD = enriched.reduce((s, p) => s + p.valueUSD, 0)
  const bySector = new Map<string, number>()
  for (const p of enriched) {
    const key = p.sector?.trim() || UNKNOWN_SECTOR
    bySector.set(key, (bySector.get(key) ?? 0) + p.valueUSD)
  }
  return Array.from(bySector.entries())
    .map(([sector, valueUSD]) => ({
      sector,
      valueUSD,
      pct: totalValueUSD > 0 ? (valueUSD / totalValueUSD) * 100 : 0,
    }))
    .sort((a, b) => b.valueUSD - a.valueUSD)
}

/**
 * Realized P&L using average-cost method, summed across every position
 * that has had at least one sell (including fully-closed ones).
 *   realizedUSD = sum( totalProceeds - avgCostUSD * totalSold )
 * Avg cost is computed from the total buys *to date*, which is a reasonable
 * approximation when buys precede sells. Pure FIFO can refine this later.
 */
function computeRealizedPnL(positions: Array<Position>): number {
  let realizedPnLUSD = 0
  for (const p of positions) {
    if (p.totalSold <= 0 || p.totalBought <= 0) continue
    const avgCostUSD = p.totalCost / p.totalBought
    realizedPnLUSD += p.totalProceeds - avgCostUSD * p.totalSold
  }
  return realizedPnLUSD
}

function computeSummary(
  enriched: Array<EnrichedPosition>,
  allPositions: Array<Position>,
  fx: FXRate,
): PortfolioSummary {
  const totalValueUSD = enriched.reduce((s, p) => s + p.valueUSD, 0)
  const totalCostUSD = enriched.reduce((s, p) => s + p.avgCost * p.netQuantity, 0)
  const unrealizedPnLUSD = totalValueUSD - totalCostUSD
  const unrealizedPnLPct =
    totalCostUSD > 0 ? (unrealizedPnLUSD / totalCostUSD) * 100 : 0

  const realizedPnLUSD = computeRealizedPnL(allPositions)
  const sectorAllocation = computeSectorAllocation(enriched)

  return {
    totalValueUSD,
    totalCostUSD,
    unrealizedPnLUSD,
    unrealizedPnLPct,
    realizedPnLUSD,
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
      return enrich(p, quote, profile)
    }),
  )

  return {
    summary: computeSummary(enriched, positions, fx),
    positions: enriched,
  }
}
