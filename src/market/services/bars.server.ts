import { and, asc, eq, gte, lte, sql } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { marketBar } from "@/db/schema"
import { kvCache } from "../cache/kv.server"
import { finnhub } from "../vendors/finnhub.server"
import type { Bar } from "../types"

const CURRENT_BAR_TTL_SECONDS = 5 * 60
const HISTORICAL_GAP_TTL_SECONDS = 24 * 60 * 60
const DAY_MS = 24 * 60 * 60 * 1000

type Row = typeof marketBar.$inferSelect

function startOfUTCDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function endOfUTCDay(d: Date): Date {
  const x = startOfUTCDay(d)
  x.setUTCHours(23, 59, 59, 999)
  return x
}

function addDays(d: Date, days: number): Date {
  return new Date(startOfUTCDay(d).getTime() + days * DAY_MS)
}

function dateKey(d: Date): string {
  return startOfUTCDay(d).toISOString().slice(0, 10)
}

function toBar(row: Row): Bar {
  return {
    date: row.date,
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close),
    volume: Number(row.volume),
    adjustedClose: row.adjustedClose != null ? parseFloat(row.adjustedClose) : undefined,
  }
}

function toRow(ticker: string, bar: Bar): typeof marketBar.$inferInsert {
  const str = (n: number) => n.toString()
  return {
    ticker,
    date: startOfUTCDay(bar.date),
    open: str(bar.open),
    high: str(bar.high),
    low: str(bar.low),
    close: str(bar.close),
    volume: BigInt(Math.trunc(bar.volume)),
    adjustedClose: bar.adjustedClose != null ? str(bar.adjustedClose) : null,
  }
}

function fetchedWindowKey(ticker: string, from: Date, to: Date): string {
  return `bars:fetched:${ticker}:D:${dateKey(from)}:${dateKey(to)}`
}

function includesToday(from: Date, to: Date): boolean {
  const today = startOfUTCDay(new Date())
  return from <= today && to >= today
}

async function readStored(
  ticker: string,
  from: Date,
  to: Date,
): Promise<Array<Row>> {
  return getDb()
    .select()
    .from(marketBar)
    .where(
      and(
        eq(marketBar.ticker, ticker),
        gte(marketBar.date, from),
        lte(marketBar.date, to),
      ),
    )
    .orderBy(asc(marketBar.date))
}

async function fetchAndMerge(
  ticker: string,
  from: Date,
  to: Date,
): Promise<void> {
  if (from > to) return

  const key = fetchedWindowKey(ticker, from, to)
  const alreadyFetched = await kvCache.get<boolean>(key)
  if (alreadyFetched) return

  const fresh = await finnhub.fetchDailyBars(ticker, {
    from: startOfUTCDay(from),
    to: endOfUTCDay(to),
  })

  if (fresh.length > 0) {
    await getDb()
      .insert(marketBar)
      .values(fresh.map((bar) => toRow(ticker, bar)))
      .onConflictDoUpdate({
        target: [marketBar.ticker, marketBar.date],
        set: {
          open: sql.raw(`excluded.open`),
          high: sql.raw(`excluded.high`),
          low: sql.raw(`excluded.low`),
          close: sql.raw(`excluded.close`),
          volume: sql.raw(`excluded.volume`),
          adjustedClose: sql.raw(`excluded.adjusted_close`),
          createdAt: sql`now()`,
        },
      })
  }

  await kvCache.set(
    key,
    true,
    includesToday(from, to) ? CURRENT_BAR_TTL_SECONDS : HISTORICAL_GAP_TTL_SECONDS,
  )
}

export async function getDailyBars(
  ticker: string,
  opts: { from: Date; to: Date },
): Promise<Array<Bar>> {
  const symbol = ticker.toUpperCase()
  const from = startOfUTCDay(opts.from)
  const to = startOfUTCDay(opts.to)
  if (from > to) return []

  const stored = await readStored(symbol, from, to)

  if (stored.length === 0) {
    await fetchAndMerge(symbol, from, to)
  } else {
    const first = stored[0]
    const last = stored[stored.length - 1]
    await Promise.all([
      fetchAndMerge(symbol, from, addDays(first.date, -1)),
      fetchAndMerge(symbol, addDays(last.date, 1), to),
    ])

    const today = startOfUTCDay(new Date())
    const current = stored.find((row) => row.date.getTime() === today.getTime())
    const staleCurrent =
      current != null &&
      Date.now() - current.createdAt.getTime() > CURRENT_BAR_TTL_SECONDS * 1000
    if (staleCurrent) {
      await fetchAndMerge(symbol, today, today)
    }
  }

  const merged = await readStored(symbol, from, to)
  return merged.map(toBar)
}
