import { z } from "zod"

export const addTradeSchema = z.object({
  ticker: z
    .string()
    .min(1, "Required")
    .max(10, "Too long")
    .transform((s) => s.trim().toUpperCase()),
  side: z.enum(["buy", "sell"]),
  quantity: z.coerce.number().positive("Must be > 0"),
  pricePerShare: z.coerce.number().positive("Must be > 0"),
  fees: z.coerce.number().min(0).default(0),
  fxRate: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
  tradedAt: z.coerce.date(),
})

export type AddTradeFormValues = z.input<typeof addTradeSchema>
export type AddTradeInput = z.output<typeof addTradeSchema>
