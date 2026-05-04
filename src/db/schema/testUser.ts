import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

export const testUser = pgTable("test_user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
