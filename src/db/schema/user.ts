import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const user = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
