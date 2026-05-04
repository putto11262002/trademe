import {
  date,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const marketEarningsEvent = pgTable(
  "market_earnings_event",
  {
    ticker: text().notNull(),
    date: date({ mode: "date" }).notNull(),
    estimatedEPS: numeric("estimated_eps", { precision: 18, scale: 4 }),
    actualEPS: numeric("actual_eps", { precision: 18, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.ticker, t.date] })],
)
