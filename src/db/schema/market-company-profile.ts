import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const marketCompanyProfile = pgTable("market_company_profile", {
  ticker: text().primaryKey(),
  name: text().notNull(),
  exchange: text().notNull(),
  sector: text(),
  industry: text(),
  country: text(),
  currency: text(),
  ipoDate: date("ipo_date", { mode: "date" }),
  logoUrl: text("logo_url"),
  website: text(),
  description: text(),
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
