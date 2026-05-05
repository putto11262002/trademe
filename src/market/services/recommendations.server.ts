import { kvCache } from "../cache/kv.server"
import { finnhub } from "../vendors/finnhub.server"
import type { RecommendationTrend } from "../types"

const TTL_SECONDS = 24 * 60 * 60

function key(ticker: string): string {
  return `recommendations:${ticker}`
}

function revive(raw: RecommendationTrend): RecommendationTrend {
  return { ...raw, period: new Date(raw.period) }
}

export async function getRecommendationTrends(
  ticker: string,
): Promise<Array<RecommendationTrend>> {
  const symbol = ticker.toUpperCase()
  const cached = await kvCache.get<Array<RecommendationTrend>>(key(symbol))
  if (cached) return cached.value.map(revive)

  const fresh = await finnhub.fetchRecommendationTrends(symbol)
  await kvCache.set(key(symbol), fresh, TTL_SECONDS)
  return fresh
}

/**
 * Returns the most recent recommendation trend (largest period date), or null.
 */
export async function getLatestRecommendation(
  ticker: string,
): Promise<RecommendationTrend | null> {
  const trends = await getRecommendationTrends(ticker)
  if (trends.length === 0) return null
  return [...trends].sort(
    (a, b) => b.period.getTime() - a.period.getTime(),
  )[0]
}
