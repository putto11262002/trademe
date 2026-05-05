import { kvCache } from "../cache/kv.server"
import { getDb } from "@/db/index.server"
import { marketEarningsEvent } from "@/db/schema"
import { finnhub } from "../vendors/finnhub.server"
import type { EarningsEvent } from "../types"

const TTL_SECONDS = 24 * 60 * 60

function key(ticker: string): string {
  return `earnings:next:${ticker}`
}

function reviveEvent(raw: EarningsEvent): EarningsEvent {
  return { ...raw, date: new Date(raw.date) }
}

export async function getNextEarnings(
  ticker: string,
): Promise<EarningsEvent | null> {
  const symbol = ticker.toUpperCase()
  const cached = await kvCache.get<EarningsEvent | null>(key(symbol))
  if (cached) return cached.value ? reviveEvent(cached.value) : null

  const now = new Date()
  const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const events = await finnhub.fetchEarnings(symbol, { from: now, to: horizon })

  // Archive past events that may have come back in the window
  const past = events.filter((e) => e.date < now)
  if (past.length > 0) {
    await getDb()
      .insert(marketEarningsEvent)
      .values(
        past.map((e) => ({
          ticker: symbol,
          date: e.date,
          estimatedEPS: e.estimatedEPS != null ? e.estimatedEPS.toString() : null,
          actualEPS: e.actualEPS != null ? e.actualEPS.toString() : null,
        })),
      )
      .onConflictDoNothing()
  }

  const upcoming = events
    .filter((e) => e.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  const next = upcoming[0] ?? null

  await kvCache.set(key(symbol), next, TTL_SECONDS)
  return next
}
