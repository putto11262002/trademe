import type { thread } from "@/db/schema"

export type Thread = typeof thread.$inferSelect
export type NewThread = typeof thread.$inferInsert
