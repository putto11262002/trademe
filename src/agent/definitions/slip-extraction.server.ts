import { NoObjectGeneratedError, generateObject } from "ai"
import { createModel } from "@/agent/gateway.server"
import { slipExtractionSchema, type SlipExtraction } from "@/slip/schemas"

const EXTRACTION_MODEL_ID = "google/gemini-3.1-flash-lite-preview"

const SYSTEM_PROMPT = `You parse images of single-trade confirmation slips from Thai brokers (Dime, Liberator, Webull TH, BLS, KSS, Pi, etc.) for US-stock buys and sells.

OUTPUT FORMAT — return one JSON object (never an array, never wrapped). Always include "kind" as the FIRST field. Use exactly one of these two shapes.

For a filled/matched stock trade:
{
  "kind": "trade",
  "ticker": "SOFI",
  "side": "buy",
  "quantity": 5.7051428,
  "pricePerShare": 17.50,
  "fees": 0.16,
  "tradedAt": "2026-04-14T20:30:00+07:00",
  "broker": "dime",
  "confidence": 0.95
}

For anything else (not a trade slip, OR a pending/waiting order, OR core fields unreadable):
{
  "kind": "not_a_slip",
  "reason": "order pending — upload after Dime shows quantity and executed price"
}

FIELD MAPPING (slip label → our field):
  - "Buy <SYMBOL>" / "Sell <SYMBOL>" → side + ticker (uppercase)
  - "Shares" / "Quantity" / "Qty" → quantity (JSON number, fractional allowed)
  - "Executed Price" / "Avg Price" / "Price" → pricePerShare (USD, JSON number)
  - "Commission" + "VAT" / "Tax" → fees (sum them; omit if neither shown)
  - "FX Rate" / "USD/THB" → fxRate (omit if not on slip)
  - "Completion date" if present, else "Submission Date" → tradedAt (ISO 8601, Asia/Bangkok +07:00 if no zone)
  - Dime / Dime! / Dime Fast → broker "dime" (always lowercase, use the enum slug)

GATE — return "not_a_slip" when:
  - Image is not a stock-trade slip (chat, balance, currency-exchange slip, watchlist, chart, article, etc.)
  - Slip status is "Waiting" / "Pending" / "Submitted" with no executed price or shares (notional market order not yet filled)
  - ticker, side, quantity, OR pricePerShare cannot be read

RULES:
  - Numbers are JSON numbers (5.7051428, 17.50, 0.16) — never strings ("17.50") and never null.
  - Broker is always the lowercase enum slug (e.g. "dime"), never display text ("Dime!").
  - Never fabricate values. Omit optional fields (fees, fxRate) rather than guess.`

export async function runSlipExtraction(input: {
  image: Uint8Array
  contentType: string
}): Promise<{ result: SlipExtraction; modelId: string }> {
  try {
    const { object } = await generateObject({
      model: createModel(EXTRACTION_MODEL_ID),
      schema: slipExtractionSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Parse this image per your instructions." },
            { type: "image", image: input.image, mediaType: input.contentType },
          ],
        },
      ],
    })
    return { result: object, modelId: EXTRACTION_MODEL_ID }
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("[slip-extraction] schema validation failed", {
        text: err.text,
        cause: err.cause instanceof Error ? err.cause.message : err.cause,
        finishReason: err.finishReason,
        usage: err.usage,
      })
    }
    throw err
  }
}
