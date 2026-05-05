import { kvCache } from "../cache/kv.server"
import { finnhub } from "../vendors/finnhub.server"
import type { PriceTarget } from "../types"

const TTL_SECONDS = 24 * 60 * 60

function key(ticker: string): string {
  return `price-target:${ticker}`
}

function revive(raw: PriceTarget): PriceTarget {
  return {
    ...raw,
    lastUpdated: raw.lastUpdated ? new Date(raw.lastUpdated) : undefined,
  }
}

export async function getPriceTarget(ticker: string): Promise<PriceTarget> {
  const symbol = ticker.toUpperCase()
  const cached = await kvCache.get<PriceTarget>(key(symbol))
  if (cached) return revive(cached.value)

  const fresh = await finnhub.fetchPriceTarget(symbol)
  await kvCache.set(key(symbol), fresh, TTL_SECONDS)
  return fresh
}
