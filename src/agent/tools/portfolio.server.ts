import { tool } from "ai"
import { z } from "zod"
import { getPortfolioDashboard } from "@/trade/portfolio.server"
import { getPositionDetail } from "@/trade/position-detail.server"

const tickerInput = z.object({
  ticker: z.string().trim().min(1).max(20).describe("Stock ticker symbol, e.g. AAPL, NVDA, TSLA"),
})

export function createPortfolioTools(userId: string) {
  return {
    portfolio_get_summary: tool({
      description:
        "Get the user's current portfolio — all open positions with market values, unrealized P&L, sector, and a total summary. Call this when the user asks about their holdings, portfolio performance, or overall financial picture.",
      inputSchema: z.object({}),
      execute: async () => {
        const dashboard = await getPortfolioDashboard(userId)
        return {
          summary: {
            totalValueUSD: dashboard.summary.totalValueUSD,
            unrealizedPnLUSD: dashboard.summary.unrealizedPnLUSD,
            unrealizedPnLPct: dashboard.summary.unrealizedPnLPct,
            realizedPnLUSD: dashboard.summary.realizedPnLUSD,
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
            unrealizedPnLUSD: p.unrealizedPnLUSD,
            unrealizedPnLPct: p.unrealizedPnLPct,
          })),
        }
      },
    }),

    portfolio_get_position_detail: tool({
      description:
        "Get compact user-specific details for one ticker: position, P&L, cost basis, recent trades, quote, fundamentals, analyst context, earnings, and recent news. Use when the user asks about a holding or one ticker in their portfolio.",
      inputSchema: tickerInput,
      execute: async ({ ticker }) => {
        const detail = await getPositionDetail(ticker, userId)
        return {
          ticker: detail.ticker,
          position: detail.position
            ? {
                ticker: detail.position.ticker,
                name: detail.position.name,
                quantity: detail.position.netQuantity,
                avgCostUSD: detail.position.avgCost,
                currentPriceUSD: detail.position.currentPriceUSD,
                valueUSD: detail.position.valueUSD,
                unrealizedPnLUSD: detail.position.unrealizedPnLUSD,
                unrealizedPnLPct: detail.position.unrealizedPnLPct,
                tradeCount: detail.position.tradeCount,
              }
            : null,
          quote: {
            price: detail.quote.price,
            change: detail.quote.change,
            changePct: detail.quote.changePct,
            previousClose: detail.quote.previousClose,
            asOf: detail.quote.asOf,
          },
          company: {
            name: detail.profile.name,
            sector: detail.profile.sector,
            industry: detail.profile.industry,
          },
          fundamentals: detail.fundamentals,
          priceTarget: detail.priceTarget,
          recommendation: detail.recommendation,
          nextEarnings: detail.nextEarnings,
          recentNews: detail.news.slice(0, 5).map((a) => ({
            headline: a.headline,
            source: a.source,
            publishedAt: a.publishedAt,
            url: a.url,
          })),
          recentTrades: detail.trades.slice(0, 5).map((t) => ({
            side: t.side,
            quantity: t.quantity,
            pricePerShare: t.pricePerShare,
            tradedAt: t.tradedAt,
          })),
        }
      },
    }),

    portfolio_get_allocation: tool({
      description:
        "Get compact portfolio allocation by ticker and sector. Use for diversification, concentration, and exposure questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const dashboard = await getPortfolioDashboard(userId)
        const totalValueUSD = dashboard.summary.totalValueUSD
        return {
          asOf: dashboard.summary.asOf,
          totalValueUSD,
          approxTotalValueTHB: totalValueUSD * dashboard.summary.fxRate,
          fxRate: dashboard.summary.fxRate,
          fxAsOf: dashboard.summary.fxAsOf,
          byTicker: dashboard.positions.map((p) => ({
            ticker: p.ticker,
            name: p.name,
            sector: p.sector ?? "Unknown",
            valueUSD: p.valueUSD,
            approxValueTHB: p.valueUSD * dashboard.summary.fxRate,
            weightPct: totalValueUSD > 0 ? (p.valueUSD / totalValueUSD) * 100 : 0,
          })).sort((a, b) => b.weightPct - a.weightPct),
          bySector: dashboard.summary.sectorAllocation,
        }
      },
    }),

    portfolio_get_risk_snapshot: tool({
      description:
        "Get a compact portfolio risk snapshot: concentration, biggest positions, biggest unrealized P&L drivers, sector exposure, and FX context. Use for portfolio-risk and 'what should I watch' questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const dashboard = await getPortfolioDashboard(userId)
        const totalValueUSD = dashboard.summary.totalValueUSD
        const weighted = dashboard.positions
          .map((p) => ({
            ticker: p.ticker,
            name: p.name,
            sector: p.sector ?? "Unknown",
            valueUSD: p.valueUSD,
            approxValueTHB: p.valueUSD * dashboard.summary.fxRate,
            weightPct: totalValueUSD > 0 ? (p.valueUSD / totalValueUSD) * 100 : 0,
            unrealizedPnLUSD: p.unrealizedPnLUSD,
            unrealizedPnLPct: p.unrealizedPnLPct,
          }))
          .sort((a, b) => b.weightPct - a.weightPct)
        const pnlDrivers = [...weighted].sort(
          (a, b) => Math.abs(b.unrealizedPnLUSD) - Math.abs(a.unrealizedPnLUSD),
        )
        return {
          asOf: dashboard.summary.asOf,
          positionCount: dashboard.summary.positionCount,
          totalValueUSD,
          approxTotalValueTHB: totalValueUSD * dashboard.summary.fxRate,
          topPositionWeightPct: weighted[0]?.weightPct ?? 0,
          top3WeightPct: weighted.slice(0, 3).reduce((sum, p) => sum + p.weightPct, 0),
          topPositions: weighted.slice(0, 5),
          biggestPnLDrivers: pnlDrivers.slice(0, 5),
          sectorAllocation: dashboard.summary.sectorAllocation.slice(0, 8),
          fx: {
            rate: dashboard.summary.fxRate,
            asOf: dashboard.summary.fxAsOf,
            note: "THB values are display-only approximations using current FX; P&L is tracked in USD in this portfolio shape.",
          },
        }
      },
    }),
  }
}
