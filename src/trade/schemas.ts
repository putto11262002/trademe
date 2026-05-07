import { z } from "zod"
import { brokerSchema } from "./brokers"

const TRADED_AT_MIN = new Date("2000-01-01T00:00:00Z")
const FUTURE_SLOP_MS = 60 * 60 * 1000

export const addTradeSchema = z.object({
  ticker: z
    .string()
    .min(1, "Required")
    .max(10, "Too long")
    .transform((s) => s.trim().toUpperCase()),
  side: z.enum(["buy", "sell"]),
  quantity: z.coerce
    .number()
    .positive("Must be > 0")
    .max(1_000_000_000, "Unrealistically large"),
  pricePerShare: z.coerce
    .number()
    .positive("Must be > 0")
    .max(1_000_000, "Unrealistically large"),
  fees: z.coerce.number().min(0).default(0),
  tradedAt: z.coerce
    .date()
    .min(TRADED_AT_MIN, "Date too far in the past")
    .refine(
      (d) => d.getTime() <= Date.now() + FUTURE_SLOP_MS,
      "Date can't be in the future",
    ),
  broker: z.union([brokerSchema, z.literal("").transform(() => undefined)]).optional(),
  slipId: z.string().uuid().optional(),
})

export type AddTradeFormValues = z.input<typeof addTradeSchema>
export type AddTradeInput = z.output<typeof addTradeSchema>
