/**
 * Smoke-test the slip extraction prompt + schema against a real image.
 *
 * Usage:
 *   pnpm tsx --env-file=.dev.vars scripts/test-slip-extraction.ts <path-to-image>
 *
 * Mirrors src/agent/definitions/slip-extraction.server.ts but constructs the
 * model client directly from process.env (the production code path uses
 * `cloudflare:workers` env, which won't resolve in Node). Exercises the same
 * prompt + schema + vision call so we can verify end-to-end before shipping UI.
 */
import { readFile } from "node:fs/promises"
import { extname } from "node:path"
import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { BROKER_SLUGS } from "@/trade/brokers"
import { slipExtractionSchema } from "@/slip/schemas"

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

function contentTypeFor(path: string): string {
  const ext = extname(path).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".webp") return "image/webp"
  throw new Error(`Unsupported image extension: ${ext}`)
}

async function main() {
  const imagePath = process.argv[2]
  if (!imagePath) {
    console.error("Usage: tsx scripts/test-slip-extraction.ts <path-to-image>")
    process.exit(1)
  }
  const apiKey = process.env.VERCEL_AI_GATEWAY_KEY
  if (!apiKey) throw new Error("VERCEL_AI_GATEWAY_KEY is not set")

  const buf = await readFile(imagePath)
  const image = new Uint8Array(buf)
  const contentType = contentTypeFor(imagePath)

  const gateway = createOpenAI({ baseURL: "https://ai-gateway.vercel.sh/v1", apiKey })
  const model = gateway.chat(EXTRACTION_MODEL_ID)

  console.log(`Parsing ${imagePath} (${contentType}, ${image.byteLength} bytes)...`)
  const t0 = Date.now()
  const { object } = await generateObject({
    model,
    schema: slipExtractionSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Parse this image per your instructions." },
          { type: "image", image, mediaType: contentType },
        ],
      },
    ],
  })
  const ms = Date.now() - t0

  console.log(`\nModel: ${EXTRACTION_MODEL_ID}  (${ms}ms)`)
  console.log(JSON.stringify(object, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
