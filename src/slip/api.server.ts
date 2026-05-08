import { and, eq } from "drizzle-orm"
import { runSlipExtraction } from "@/agent/definitions/slip-extraction.server"
import { getDb } from "@/db/index.server"
import { tradeSlip } from "@/db/schema"
import type { SlipExtractionSlip } from "./schemas"
import type { ParseSlipResult, Slip } from "./types"

type SlipRow = typeof tradeSlip.$inferSelect

function toSlip(row: SlipRow): Slip {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    extraction: row.extraction as SlipExtractionSlip,
    extractionModel: row.extractionModel,
    parsedAt: row.parsedAt,
  }
}

const MAX_IMAGE_BYTES = 8_000_000

function sniffImageFormat(bytes: Uint8Array): "png" | "jpeg" | "webp" | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png"
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg"
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp"
  }
  return null
}

function declaredFormatOf(contentType: string): "png" | "jpeg" | "webp" | null {
  if (contentType === "image/png") return "png"
  if (contentType === "image/jpeg" || contentType === "image/jpg") return "jpeg"
  if (contentType === "image/webp") return "webp"
  return null
}

function validateImageBytes(bytes: Uint8Array, contentType: string): void {
  const sniffed = sniffImageFormat(bytes)
  const declared = declaredFormatOf(contentType)
  if (sniffed === null || sniffed !== declared) {
    throw new Error("Image data doesn't match declared format")
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Image too large (max 8MB)")
  }
}

export async function parseSlip(
  input: { image: Uint8Array; contentType: string },
  userId: string,
): Promise<ParseSlipResult> {
  validateImageBytes(input.image, input.contentType)
  const { result, modelId } = await runSlipExtraction(input)

  if (result.kind === "not_a_slip") {
    return { kind: "not_a_slip", reason: result.reason }
  }

  const [row] = await getDb()
    .insert(tradeSlip)
    .values({
      userId,
      status: "parsed",
      extraction: result,
      extractionModel: modelId,
    })
    .returning()

  return { kind: "slip", slipId: row.id, extraction: result }
}

export async function getSlip(slipId: string, userId: string): Promise<Slip | null> {
  const [row] = await getDb()
    .select()
    .from(tradeSlip)
    .where(and(eq(tradeSlip.id, slipId), eq(tradeSlip.userId, userId)))
    .limit(1)
  return row ? toSlip(row) : null
}

/**
 * Server-internal helper called from `trade.addTrade` after a slip-linked
 * trade is inserted. Scoped by userId to prevent cross-account flips.
 */
export async function markSlipAttached(
  slipId: string,
  userId: string,
): Promise<void> {
  await getDb()
    .update(tradeSlip)
    .set({ status: "attached" })
    .where(and(eq(tradeSlip.id, slipId), eq(tradeSlip.userId, userId)))
}
