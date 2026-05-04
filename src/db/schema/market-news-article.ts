import { desc } from "drizzle-orm"
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const marketSentiment = pgEnum("market_sentiment", [
  "positive",
  "negative",
  "neutral",
])

export const marketNewsArticle = pgTable(
  "market_news_article",
  {
    id: text().primaryKey(),
    ticker: text().notNull(),
    headline: text().notNull(),
    summary: text(),
    url: text().notNull(),
    source: text().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    sentiment: marketSentiment(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("market_news_article_ticker_published_idx").on(
      t.ticker,
      desc(t.publishedAt),
    ),
  ],
)
