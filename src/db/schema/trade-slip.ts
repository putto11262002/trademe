import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const tradeSlipStatus = pgEnum("trade_slip_status", ["parsed", "attached"])

export const tradeSlip = pgTable(
  "trade_slip",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    status: tradeSlipStatus().notNull().default("parsed"),
    extraction: jsonb().notNull(),
    extractionModel: text("extraction_model").notNull(),
    parsedAt: timestamp("parsed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trade_slip_user_idx").on(t.userId, t.parsedAt)],
)
