import { and, desc, eq } from "drizzle-orm"
import { kvCache } from "../cache/kv.server"
import { getDb } from "@/db/index.server"
import { marketFundamentals } from "@/db/schema"
import { finnhub } from "../vendors/finnhub.server"
import type { Fundamentals } from "../types"

const TTL_SECONDS = 24 * 60 * 60

type Row = typeof marketFundamentals.$inferSelect

function toFundamentals(row: Row): Fundamentals {
  const num = (s: string | null) => (s != null ? parseFloat(s) : undefined)
  return {
    ticker: row.ticker,
    asOf: row.asOf,
    marketCap: num(row.marketCap),
    peRatio: num(row.peRatio),
    eps: num(row.eps),
    revenue: num(row.revenue),
    week52High: num(row.week52High),
    week52Low: num(row.week52Low),
    dividendYield: num(row.dividendYield),
    // beta is not persisted yet; comes through fresh fetches via KV cache
  }
}

function toRow(f: Fundamentals): typeof marketFundamentals.$inferInsert {
  const str = (n: number | undefined) => (n != null ? n.toString() : null)
  return {
    ticker: f.ticker,
    asOf: f.asOf,
    marketCap: str(f.marketCap),
    peRatio: str(f.peRatio),
    eps: str(f.eps),
    revenue: str(f.revenue),
    week52High: str(f.week52High),
    week52Low: str(f.week52Low),
    dividendYield: str(f.dividendYield),
  }
}

function startOfUTCDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

export async function getFundamentals(ticker: string): Promise<Fundamentals> {
  const symbol = ticker.toUpperCase()
  const k = `fundamentals:${symbol}`
  const cached = await kvCache.get<Fundamentals>(k)
  if (cached) return { ...cached.value, asOf: new Date(cached.value.asOf) }

  const today = startOfUTCDay(new Date())
  const [stored] = await getDb()
    .select()
    .from(marketFundamentals)
    .where(and(eq(marketFundamentals.ticker, symbol), eq(marketFundamentals.asOf, today)))
    .orderBy(desc(marketFundamentals.asOf))
    .limit(1)
  if (stored) {
    const f = toFundamentals(stored)
    await kvCache.set(k, f, TTL_SECONDS)
    return f
  }

  const fresh = await finnhub.fetchFundamentals(symbol)
  await getDb()
    .insert(marketFundamentals)
    .values(toRow({ ...fresh, asOf: today }))
    .onConflictDoNothing()
  await kvCache.set(k, fresh, TTL_SECONDS)
  return fresh
}
