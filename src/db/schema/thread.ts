import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { DEFAULT_GENERAL_CHAT_MODEL, type ProviderOptions } from "@/agent/general-chat-models"
import { user } from "./user"

export const thread = pgTable(
  "thread",
  {
    id: text().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    title: text(),
    modelKey: text("model_key").notNull().default(DEFAULT_GENERAL_CHAT_MODEL),
    providerOptions: jsonb("provider_options").$type<ProviderOptions>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("thread_user_idx").on(t.userId, t.updatedAt)],
)
