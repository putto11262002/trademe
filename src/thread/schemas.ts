import { z } from "zod"
import { DEFAULT_GENERAL_CHAT_MODEL } from "@/agent/general-chat-models"

const providerOptionsSchema = z.record(
  z.string(),
  z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
)

export const createThreadSchema = z.object({
  userId: z.string().min(1),
  title: z.string().max(120).optional(),
  modelKey: z.string().default(DEFAULT_GENERAL_CHAT_MODEL),
  providerOptions: providerOptionsSchema.default({}),
})

export const updateThreadSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(120).optional(),
  modelKey: z.string().optional(),
  providerOptions: providerOptionsSchema.optional(),
})
