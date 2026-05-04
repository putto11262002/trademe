import { env } from "cloudflare:workers"
import type { CacheEntry, MarketCache } from "./types"

class KVMarketCache implements MarketCache {
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const raw = await env.MARKET_CACHE.get(key)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as CacheEntry<T>
      return parsed
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const entry: CacheEntry<T> = { value, asOf: Date.now() }
    // CF KV minimum TTL is 60s
    const ttl = Math.max(60, Math.floor(ttlSeconds))
    await env.MARKET_CACHE.put(key, JSON.stringify(entry), { expirationTtl: ttl })
  }

  async delete(key: string): Promise<void> {
    await env.MARKET_CACHE.delete(key)
  }
}

export const kvCache: MarketCache = new KVMarketCache()
