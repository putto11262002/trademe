import { kvCache } from "../cache/kv.server"
import type { CacheEntry } from "../cache/types"
import { frankfurter } from "../vendors/frankfurter.server"
import type { Currency, FXRate } from "../types"

const TTL_SECONDS = 5 * 60

function cacheKey(from: Currency, to: Currency): string {
  return `fx:${from}:${to}`
}

function reviveFXRate(raw: FXRate): FXRate {
  return { ...raw, asOf: new Date(raw.asOf) }
}

export async function getFXRate(from: Currency, to: Currency): Promise<FXRate> {
  const key = cacheKey(from, to)
  const cached: CacheEntry<FXRate> | null = await kvCache.get<FXRate>(key)
  if (cached) return reviveFXRate(cached.value)

  const fresh = await frankfurter.fetchLatest(from, to)
  await kvCache.set(key, fresh, TTL_SECONDS)
  return fresh
}
