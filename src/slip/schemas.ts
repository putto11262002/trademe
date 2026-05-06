import { z } from "zod"
import { brokerSchema } from "@/trade/brokers"

/**
 * Output contract of the slip-extraction agent. Discriminated union:
 *  - `trade`: image was a US-stock trade slip; fields extracted.
 *  - `not_a_slip`: image was something else (chat, balance screen, meme, etc.).
 *
 * Only the `trade` variant is persisted; `not_a_slip` is returned to the
 * client and discarded.
 */
export const slipExtractionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("trade"),
    ticker: z.string().min(1).max(10),
    side: z.enum(["buy", "sell"]),
    quantity: z.number().positive(),
    pricePerShare: z.number().positive(),
    fees: z.number().min(0).optional(),
    fxRate: z.number().positive().optional(),
    tradedAt: z.string(),
    broker: brokerSchema.nullable(),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal("not_a_slip"),
    reason: z.string(),
  }),
])

export type SlipExtraction = z.infer<typeof slipExtractionSchema>
export type SlipExtractionTrade = Extract<SlipExtraction, { kind: "trade" }>
