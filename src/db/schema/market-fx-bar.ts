import {
  date,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const marketFxBar = pgTable(
  "market_fx_bar",
  {
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    date: date({ mode: "date" }).notNull(),
    rate: numeric({ precision: 18, scale: 6 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.fromCurrency, t.toCurrency, t.date] })],
)
