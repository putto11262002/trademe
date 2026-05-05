import { tool } from "ai"
import { z } from "zod"
import { getPortfolioDashboard } from "@/trade/portfolio.server"

export const portfolioTools = {
  get_portfolio: tool({
    description:
      "Get the user's current portfolio — all open positions with market values, unrealized P&L, sector, and a total summary. Call this when the user asks about their holdings, portfolio performance, or overall financial picture.",
    inputSchema: z.object({}),
    execute: async () => {
      const dashboard = await getPortfolioDashboard()
      return {
        summary: {
          totalValueUSD: dashboard.summary.totalValueUSD,
          totalValueTHB: dashboard.summary.totalValueTHB,
          unrealizedPnLUSD: dashboard.summary.unrealizedPnLUSD,
          unrealizedPnLPct: dashboard.summary.unrealizedPnLPct,
          unrealizedPnLTHB: dashboard.summary.unrealizedPnLTHB,
          realizedPnLUSD: dashboard.summary.realizedPnLUSD,
          realizedPnLTHB: dashboard.summary.realizedPnLTHB,
          fxRate: dashboard.summary.fxRate,
          positionCount: dashboard.summary.positionCount,
        },
        positions: dashboard.positions.map((p) => ({
          ticker: p.ticker,
          name: p.name,
          sector: p.sector ?? "Unknown",
          quantity: p.netQuantity,
          avgCostUSD: p.avgCost,
          currentPriceUSD: p.currentPriceUSD,
          valueUSD: p.valueUSD,
          valueTHB: p.valueTHB,
          unrealizedPnLUSD: p.unrealizedPnLUSD,
          unrealizedPnLPct: p.unrealizedPnLPct,
        })),
      }
    },
  }),
}
