export type CacheEntry<T> = {
  value: T
  asOf: number
}

export interface MarketCache {
  get<T>(key: string): Promise<CacheEntry<T> | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<void>
}
