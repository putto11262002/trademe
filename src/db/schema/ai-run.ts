import { index, integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { user } from "./user"

export const aiRun = pgTable(
  "ai_run",
  {
    id: text().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    threadId: text("thread_id"),
    type: text().notNull(),
    model: text().notNull(),
    stepCount: integer("step_count").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull(),
    reasoningTokens: integer("reasoning_tokens").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 12, scale: 8 }).notNull(),
    durationMs: integer("duration_ms").notNull(),
    finishReason: text("finish_reason").notNull(),
    toolsUsed: text("tools_used").array().notNull().default([]),
    meta: jsonb().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_run_user_idx").on(t.userId, t.createdAt),
    index("ai_run_thread_idx").on(t.threadId),
  ],
)
