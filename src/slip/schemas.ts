import { z } from "zod"
import { brokerSchema } from "@/trade/brokers"

/**
 * Output contract of the slip-extraction agent. Discriminated union:
 *  - `trade`: image was a US-stock trade slip; fields extracted.
 *  - `not_a_slip`: image was something else (chat, balance screen, FX slip, etc.)
 *    or fields could not be read.
 *
 * Per-field `.describe()` hints flow into the JSON Schema sent to the model;
 * Gemini reads them as authoritative guidance. The system prompt only covers
 * the gate decision and global rules.
 */
export const slipExtractionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z
      .literal("trade")
      .describe(
        "Use this variant only when the image is a stock-trade confirmation AND ticker, side, quantity, and pricePerShare are all readable.",
      ),
    ticker: z
      .string()
      .min(1)
      .max(10)
      .describe("Uppercase US-stock symbol, e.g. AAPL, NVDA, TSLA."),
    side: z
      .enum(["buy", "sell"])
      .describe(
        "Trade direction. 'buy' if the user purchased shares; 'sell' if they sold.",
      ),
    quantity: z
      .coerce
      .number()
      .positive()
      .describe(
        "Number of shares (fractional allowed). Must be > 0. JSON number, never a string or null.",
      ),
    pricePerShare: z
      .coerce
      .number()
      .positive()
      .describe(
        "Price per share in USD. JSON number, never a string or null.",
      ),
    fees: z
      .coerce
      .number()
      .min(0)
      .optional()
      .describe(
        "Total commission/fees in USD if printed on the slip. Omit when not visible; never guess.",
      ),
    fxRate: z
      .coerce
      .number()
      .positive()
      .optional()
      .describe(
        "USD→THB exchange rate if printed on the slip. Omit when not shown; never guess.",
      ),
    tradedAt: z
      .string()
      .describe(
        "Trade timestamp as ISO 8601, e.g. 2025-11-13T14:39:00+07:00. Assume Asia/Bangkok (+07:00) when no zone is given; use 00:00 local when no time is shown.",
      ),
    broker: brokerSchema
      .nullable()
      .describe(
        "Broker slug inferred from logos or text on the slip. Use null when not identifiable. Pick the closest match from the enum.",
      ),
    confidence: z
      .coerce
      .number()
      .min(0)
      .max(1)
      .describe(
        "Self-rated extraction confidence on a 0..1 scale (NOT a percentage; e.g. 0.9, not 90).",
      ),
  }),
  z.object({
    kind: z
      .literal("not_a_slip")
      .describe(
        "Use this variant when (a) the image is not a stock-trade confirmation (chat, balance page, currency-exchange slip, watchlist, chart, article, etc.) OR (b) it is a trade slip but ticker, side, quantity, or pricePerShare cannot be read with reasonable confidence.",
      ),
    reason: z
      .string()
      .describe(
        "One short sentence explaining why this isn't usable, e.g. 'currency exchange slip, not a stock trade' or 'quantity not visible on the slip'.",
      ),
  }),
])

export type SlipExtraction = z.infer<typeof slipExtractionSchema>
export type SlipExtractionTrade = Extract<SlipExtraction, { kind: "trade" }>
