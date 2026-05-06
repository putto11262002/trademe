import { and, desc, eq } from "drizzle-orm"
import { requireUser } from "@/auth/api.server"
import { getDb } from "@/db/index.server"
import { trade, tradeSlip } from "@/db/schema"
import { getCompanyProfile } from "@/market/api.server"
import { markSlipAttached } from "@/slip/api.server"
import type { BrokerSlug } from "./brokers"
import type { Position, Trade } from "./types"
import type { AddTradeInput } from "./schemas"

type TradeRow = typeof trade.$inferSelect

function toTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    userId: row.userId,
    ticker: row.ticker,
    side: row.side,
    quantity: parseFloat(row.quantity),
    pricePerShare: parseFloat(row.pricePerShare),
    fees: parseFloat(row.fees),
    fxRate: row.fxRate ? parseFloat(row.fxRate) : null,
    tradedAt: row.tradedAt,
    broker: (row.broker as BrokerSlug | null) ?? null,
    slipId: row.slipId ?? null,
    source: row.source,
    createdAt: row.createdAt,
  }
}

export async function addTrade(input: AddTradeInput): Promise<Trade> {
  const user = await requireUser()
  const ticker = input.ticker.toUpperCase()
  await getCompanyProfile(ticker)

  if (input.slipId) {
    const [slipRow] = await getDb()
      .select({ status: tradeSlip.status })
      .from(tradeSlip)
      .where(and(eq(tradeSlip.id, input.slipId), eq(tradeSlip.userId, user.id)))
      .limit(1)
    if (!slipRow) throw new Error("Slip not found")
    if (slipRow.status !== "parsed")
      throw new Error("Slip already attached to a trade")
  }

  const [row] = await getDb()
    .insert(trade)
    .values({
      userId: user.id,
      ticker,
      side: input.side,
      quantity: input.quantity.toString(),
      pricePerShare: input.pricePerShare.toString(),
      fees: input.fees.toString(),
      fxRate: input.fxRate != null ? input.fxRate.toString() : null,
      tradedAt: input.tradedAt,
      broker: input.broker ?? null,
      slipId: input.slipId ?? null,
      source: input.slipId ? "slip" : "manual",
    })
    .returning()

  if (input.slipId) {
    await markSlipAttached(input.slipId, user.id)
  }

  return toTrade(row)
}

export async function listTrades(): Promise<Array<Trade>> {
  const user = await requireUser()
  const rows = await getDb()
    .select()
    .from(trade)
    .where(eq(trade.userId, user.id))
    .orderBy(desc(trade.tradedAt))
  return rows.map(toTrade)
}

export async function getTradesForTicker(ticker: string): Promise<Array<Trade>> {
  const user = await requireUser()
  const rows = await getDb()
    .select()
    .from(trade)
    .where(and(eq(trade.userId, user.id), eq(trade.ticker, ticker.toUpperCase())))
    .orderBy(desc(trade.tradedAt))
  return rows.map(toTrade)
}

export async function getPositions(): Promise<Array<Position>> {
  const trades = await listTrades()
  const byTicker = new Map<string, Position>()
  for (const t of trades) {
    const p =
      byTicker.get(t.ticker) ??
      ({
        ticker: t.ticker,
        netQuantity: 0,
        totalBought: 0,
        totalSold: 0,
        totalCost: 0,
        totalCostTHB: 0,
        totalProceeds: 0,
        totalProceedsTHB: 0,
        tradeCount: 0,
      } satisfies Position)
    // For older rows without an FX rate captured at trade time, fall back to 1
    // so THB totals at least equal USD totals (a no-op rather than NaN/0).
    const fx = t.fxRate ?? 1
    const grossUSD = t.quantity * t.pricePerShare
    if (t.side === "buy") {
      const costUSD = grossUSD + t.fees
      p.netQuantity += t.quantity
      p.totalBought += t.quantity
      p.totalCost += costUSD
      p.totalCostTHB += costUSD * fx
    } else {
      const proceedsUSD = grossUSD - t.fees
      p.netQuantity -= t.quantity
      p.totalSold += t.quantity
      p.totalProceeds += proceedsUSD
      p.totalProceedsTHB += proceedsUSD * fx
    }
    p.tradeCount += 1
    byTicker.set(t.ticker, p)
  }
  return Array.from(byTicker.values()).sort((a, b) => a.ticker.localeCompare(b.ticker))
}
