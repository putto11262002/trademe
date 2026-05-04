import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const marketCompanyProfile = pgTable("market_company_profile", {
  ticker: text().primaryKey(),
  name: text().notNull(),
  exchange: text().notNull(),
  sector: text(),
  industry: text(),
  logoUrl: text("logo_url"),
  website: text(),
  description: text(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
