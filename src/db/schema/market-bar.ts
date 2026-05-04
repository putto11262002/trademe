import {
  bigint,
  date,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const marketBar = pgTable(
  "market_bar",
  {
    ticker: text().notNull(),
    date: date({ mode: "date" }).notNull(),
    open: numeric({ precision: 18, scale: 4 }).notNull(),
    high: numeric({ precision: 18, scale: 4 }).notNull(),
    low: numeric({ precision: 18, scale: 4 }).notNull(),
    close: numeric({ precision: 18, scale: 4 }).notNull(),
    volume: bigint({ mode: "bigint" }).notNull(),
    adjustedClose: numeric("adjusted_close", { precision: 18, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.ticker, t.date] })],
)
