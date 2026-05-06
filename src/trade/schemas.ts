import { z } from "zod"
import { brokerSchema } from "./brokers"

export const settlementCurrencySchema = z.enum(["USD", "THB"])
export type SettlementCurrency = z.infer<typeof settlementCurrencySchema>

export const addTradeSchema = z
  .object({
    ticker: z
      .string()
      .min(1, "Required")
      .max(10, "Too long")
      .transform((s) => s.trim().toUpperCase()),
    side: z.enum(["buy", "sell"]),
    quantity: z.coerce.number().positive("Must be > 0"),
    pricePerShare: z.coerce.number().positive("Must be > 0"),
    fees: z.coerce.number().min(0).default(0),
    settlementCurrency: settlementCurrencySchema.default("THB"),
    fxRate: z
      .union([z.coerce.number().positive(), z.literal("").transform(() => undefined)])
      .optional(),
    tradedAt: z.coerce.date(),
    broker: z
      .union([brokerSchema, z.literal("").transform(() => undefined)])
      .optional(),
    slipId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    // THB-funded trade: fxRate is what the broker charged you to convert.
    if (data.settlementCurrency === "THB" && data.fxRate == null) {
      ctx.addIssue({
        code: "custom",
        path: ["fxRate"],
        message: "Required for THB-funded trades",
      })
    }
  })
  .transform((data) => {
    // USD-funded trade: no FX happened, drop any stale fxRate value.
    if (data.settlementCurrency === "USD") {
      return { ...data, fxRate: undefined }
    }
    return data
  })

export type AddTradeFormValues = z.input<typeof addTradeSchema>
export type AddTradeInput = z.output<typeof addTradeSchema>
