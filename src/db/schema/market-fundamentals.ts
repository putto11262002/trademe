import {
  date,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const marketFundamentals = pgTable(
  "market_fundamentals",
  {
    ticker: text().notNull(),
    asOf: date("as_of", { mode: "date" }).notNull(),
    marketCap: numeric("market_cap", { precision: 20, scale: 2 }),
    peRatio: numeric("pe_ratio", { precision: 18, scale: 4 }),
    eps: numeric({ precision: 18, scale: 4 }),
    revenue: numeric({ precision: 20, scale: 2 }),
    week52High: numeric("week_52_high", { precision: 18, scale: 4 }),
    week52Low: numeric("week_52_low", { precision: 18, scale: 4 }),
    dividendYield: numeric("dividend_yield", { precision: 10, scale: 6 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.ticker, t.asOf] })],
)
