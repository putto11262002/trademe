import { kvCache } from "../cache/kv.server"
import type { CacheEntry } from "../cache/types"
import { finnhub } from "../vendors/finnhub.server"
import type { Quote } from "../types"

const TTL_SECONDS = 5 * 60

function cacheKey(ticker: string): string {
  return `quote:${ticker.toUpperCase()}`
}

function reviveQuote(raw: Quote): Quote {
  return { ...raw, asOf: new Date(raw.asOf) }
}

export async function getQuote(ticker: string): Promise<Quote> {
  const symbol = ticker.toUpperCase()
  const key = cacheKey(symbol)
  const cached: CacheEntry<Quote> | null = await kvCache.get<Quote>(key)
  if (cached) return reviveQuote(cached.value)

  const fresh = await finnhub.fetchQuote(symbol)
  await kvCache.set(key, fresh, TTL_SECONDS)
  return fresh
}

export async function getQuotes(tickers: Array<string>): Promise<Map<string, Quote>> {
  const results = await Promise.all(tickers.map(async (t) => [t.toUpperCase(), await getQuote(t)] as const))
  return new Map(results)
}
