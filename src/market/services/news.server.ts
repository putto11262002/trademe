import { and, desc, eq, gte } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { marketNewsArticle } from "@/db/schema"
import { finnhub } from "../vendors/finnhub.server"
import type { NewsItem } from "../types"

type NewsRow = typeof marketNewsArticle.$inferSelect

function toNewsItem(row: NewsRow): NewsItem {
  return {
    id: row.id,
    ticker: row.ticker,
    headline: row.headline,
    summary: row.summary ?? undefined,
    url: row.url,
    source: row.source,
    publishedAt: row.publishedAt,
    sentiment: row.sentiment ?? undefined,
  }
}

function toRow(item: NewsItem): typeof marketNewsArticle.$inferInsert {
  return {
    id: item.id,
    ticker: item.ticker,
    headline: item.headline,
    summary: item.summary ?? null,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    sentiment: item.sentiment ?? null,
  }
}

export async function getNews(
  ticker: string,
  opts?: { days?: number },
): Promise<Array<NewsItem>> {
  const symbol = ticker.toUpperCase()
  const days = opts?.days ?? 7
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const stored = await getDb()
    .select()
    .from(marketNewsArticle)
    .where(
      and(
        eq(marketNewsArticle.ticker, symbol),
        gte(marketNewsArticle.publishedAt, since),
      ),
    )
    .orderBy(desc(marketNewsArticle.publishedAt))

  // Treat as fresh if newest article is < 1h old.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const newest = stored.at(0)?.publishedAt
  if (newest && newest >= oneHourAgo) {
    return stored.map(toNewsItem)
  }

  const fresh = await finnhub.fetchNews(symbol, days)
  if (fresh.length > 0) {
    await getDb()
      .insert(marketNewsArticle)
      .values(fresh.map(toRow))
      .onConflictDoNothing()
  }

  // Re-query merged set so callers always see canonical, deduped, sorted list.
  const merged = await getDb()
    .select()
    .from(marketNewsArticle)
    .where(
      and(
        eq(marketNewsArticle.ticker, symbol),
        gte(marketNewsArticle.publishedAt, since),
      ),
    )
    .orderBy(desc(marketNewsArticle.publishedAt))

  return merged.map(toNewsItem)
}
