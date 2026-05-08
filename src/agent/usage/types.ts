import type { aiRun } from "@/db/schema"

export type AiRun = typeof aiRun.$inferSelect
export type NewAiRun = typeof aiRun.$inferInsert
