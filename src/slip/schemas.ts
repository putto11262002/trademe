import { z } from "zod"
import { brokerSchema } from "@/trade/brokers"

/**
 * Output contract of the slip-extraction agent. Discriminated union:
 *  - `slip`: image is a stock-trade confirmation. Fields are reported per
 *    what is visible — unreadable fields are `null`. The LLM never infers,
 *    calculates, or fabricates; the application layer applies defaults
 *    (e.g. fees → 0, tradedAt → now) and decides what's complete enough.
 *  - `not_a_slip`: image is something else (chat, balance, FX slip, watchlist,
 *    chart, article) OR a pending/unfilled order with no executed values.
 *
 * Per-field `.describe()` hints flow into the JSON Schema sent to the model.
 * Each field's hint includes its slip-label aliases so the prompt itself
 * stays focused on rules, gating, and cross-field interpretation.
 */
export const slipExtractionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z
      .literal("slip")
      .describe(
        "Use this variant when the image IS a stock-trade confirmation, even if some fields are unreadable. Set unreadable fields to null rather than refusing.",
      ),
    ticker: z
      .string()
      .min(1)
      .max(10)
      .nullish()
      .describe(
        'Uppercase US-stock symbol read from labels like "Buy <SYMBOL>" / "Sell <SYMBOL>", e.g. AAPL, NVDA, TSLA. Null if not readable.',
      ),
    side: z
      .enum(["buy", "sell"])
      .nullish()
      .describe(
        'Trade direction. "buy" if the slip says Buy <SYMBOL>; "sell" if Sell <SYMBOL>. Null if not readable.',
      ),
    quantity: z
      .coerce
      .number()
      .positive()
      .nullish()
      .describe(
        'Number of shares (fractional allowed). Read from "Shares" / "Quantity" / "Qty". Must be > 0. JSON number, never a string. Null if not readable.',
      ),
    pricePerShare: z
      .coerce
      .number()
      .positive()
      .nullish()
      .describe(
        'Price per share in USD. Read from "Executed Price" / "Avg Price" / "Price". JSON number, never a string. Null if not readable.',
      ),
    fees: z
      .coerce
      .number()
      .min(0)
      .nullish()
      .describe(
        'Total commission/fees in USD. If the slip shows both "Commission" and "VAT"/"Tax", sum them. Null when neither is visible — never guess.',
      ),
    tradedAt: z
      .string()
      .nullish()
      .describe(
        'Trade timestamp as ISO 8601, e.g. 2025-11-13T14:39:00+07:00. Prefer "Completion date" over "Submission Date". Assume Asia/Bangkok (+07:00) when no zone is shown; use 00:00 local when no time is shown. Null if no date readable.',
      ),
    broker: brokerSchema
      .nullish()
      .describe(
        'Broker enum slug inferred from logos or text on the slip — always lowercase (e.g. "dime"), never display text ("Dime!"). Null when not identifiable.',
      ),
    confidence: z
      .coerce
      .number()
      .min(0)
      .max(1)
      .nullish()
      .describe(
        "Self-rated extraction confidence on a 0..1 scale (NOT a percentage; e.g. 0.9, not 90).",
      ),
  }),
  z.object({
    kind: z
      .literal("not_a_slip")
      .describe(
        "Use this variant only when the image is NOT a stock-trade confirmation (chat, balance page, FX slip, watchlist, chart, article, etc.) OR is a pending/waiting order with no executed values. If it IS a trade slip but some fields are unreadable, use kind:slip with nulls instead.",
      ),
    reason: z
      .string()
      .describe(
        'One short sentence explaining why this isn\'t a trade slip, e.g. "currency exchange slip, not a stock trade" or "order pending — no executed price or shares yet".',
      ),
  }),
])

export type SlipExtraction = z.infer<typeof slipExtractionSchema>
export type SlipExtractionSlip = Extract<SlipExtraction, { kind: "slip" }>
