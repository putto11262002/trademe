import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { marketCompanyProfile } from "./market-company-profile"
import { tradeSlip } from "./trade-slip"

export const tradeSide = pgEnum("trade_side", ["buy", "sell"])
export const tradeSource = pgEnum("trade_source", ["manual", "slip"])
export const tradeSettlementCurrency = pgEnum("trade_settlement_currency", [
  "USD",
  "THB",
])

export const trade = pgTable(
  "trade",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    ticker: text()
      .notNull()
      .references(() => marketCompanyProfile.ticker),
    side: tradeSide().notNull(),
    quantity: numeric({ precision: 18, scale: 8 }).notNull(),
    pricePerShare: numeric("price_per_share", {
      precision: 18,
      scale: 4,
    }).notNull(),
    fees: numeric({ precision: 18, scale: 4 }).notNull().default("0"),
    /**
     * THB→USD rate paid for *this* trade. Only meaningful when
     * settlementCurrency = "THB" (broker converted THB to USD on your behalf
     * at trade time). For USD-funded trades, this is null.
     */
    fxRate: numeric("fx_rate", { precision: 18, scale: 6 }),
    /**
     * How this trade was settled:
     *  - "THB": broker took THB, converted at fxRate, executed in USD.
     *  - "USD": user already held USD; no FX conversion at trade time.
     */
    settlementCurrency: tradeSettlementCurrency("settlement_currency")
      .notNull()
      .default("THB"),
    tradedAt: timestamp("traded_at", { withTimezone: true }).notNull(),
    broker: text(),
    slipId: uuid("slip_id").references(() => tradeSlip.id, { onDelete: "set null" }),
    source: tradeSource().notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("trade_user_ticker_idx").on(t.userId, t.ticker),
    index("trade_user_traded_at_idx").on(t.userId, t.tradedAt),
  ],
)
