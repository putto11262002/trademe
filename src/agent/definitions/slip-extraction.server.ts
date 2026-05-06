import { generateObject } from "ai"
import { createModel } from "@/agent/gateway.server"
import { BROKER_SLUGS } from "@/trade/brokers"
import { slipExtractionSchema, type SlipExtraction } from "@/slip/schemas"

const EXTRACTION_MODEL_ID = "google/gemini-3.1-flash-lite-preview"

const SYSTEM_PROMPT = `You are a financial document parser. The user uploads an image which may or may not be a trade-confirmation slip from a Thai broker (Dime, Liberator, Webull TH, BLS, KSS, Pi, etc.) for a single US stock buy or sell.

GATE: First decide if the image is a trade-confirmation slip showing one US-stock buy or sell. If it is NOT (a chat screenshot, an account-balance page, a meme, a candlestick chart, a news article, etc.), return:
  { "kind": "not_a_slip", "reason": "<short reason, e.g. 'image is an account balance, not a trade slip'>" }

If it IS a trade slip, extract the following and return the "trade" variant:
  - ticker: US stock symbol, uppercase (e.g. AAPL, NVDA, TSLA)
  - side: "buy" or "sell"
  - quantity: number of shares (can be fractional)
  - pricePerShare: price per share in USD
  - fees: total commission/fees in USD if visible (omit if unclear)
  - fxRate: USD→THB rate if printed on the slip (omit if unclear)
  - tradedAt: ISO 8601 datetime — assume Asia/Bangkok timezone if only date given; if no time, use 00:00 local
  - broker: one of [${BROKER_SLUGS.join(", ")}] inferred from logos/text, or null if unclear
  - confidence: 0..1 self-rating for the overall extraction

If a numeric field is unreadable, prefer omitting the optional fields over guessing. Never fabricate values.`

export async function runSlipExtraction(input: {
  image: Uint8Array
  contentType: string
}): Promise<{ result: SlipExtraction; modelId: string }> {
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
}
