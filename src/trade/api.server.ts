import { and, desc, eq } from "drizzle-orm"
import { requireUser } from "@/auth/api.server"
import { getDb } from "@/db/index.server"
import { trade } from "@/db/schema"
import { markSlipAttached } from "@/slip/api.server"
import type { BrokerSlug } from "./brokers"
import type { Position, Trade } from "./types"
import type { AddTradeInput } from "./schemas"
import { TradeValidationFailed, validateAddTrade } from "./validation.server"

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

  const { errors } = await validateAddTrade(input, user.id)
  if (errors.length > 0) throw new TradeValidationFailed(errors)

  const [row] = await getDb()
    .insert(trade)
    .values({
      userId: user.id,
      ticker,
      side: input.side,
      quantity: input.quantity.toString(),
      pricePerShare: input.pricePerShare.toString(),
      fees: input.fees.toString(),
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
        totalProceeds: 0,
        tradeCount: 0,
      } satisfies Position)
    const grossUSD = t.quantity * t.pricePerShare
    if (t.side === "buy") {
      p.netQuantity += t.quantity
      p.totalBought += t.quantity
      p.totalCost += grossUSD + t.fees
    } else {
      p.netQuantity -= t.quantity
      p.totalSold += t.quantity
      p.totalProceeds += grossUSD - t.fees
    }
    p.tradeCount += 1
    byTicker.set(t.ticker, p)
  }
  return Array.from(byTicker.values()).sort((a, b) => a.ticker.localeCompare(b.ticker))
}
