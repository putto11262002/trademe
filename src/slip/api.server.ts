import { and, eq } from "drizzle-orm"
import { runSlipExtraction } from "@/agent/definitions/slip-extraction.server"
import { requireUser } from "@/auth/api.server"
import { getDb } from "@/db/index.server"
import { tradeSlip } from "@/db/schema"
import type { SlipExtractionTrade } from "./schemas"
import type { ParseSlipResult, Slip } from "./types"

type SlipRow = typeof tradeSlip.$inferSelect

function toSlip(row: SlipRow): Slip {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    extraction: row.extraction as SlipExtractionTrade,
    extractionModel: row.extractionModel,
    parsedAt: row.parsedAt,
  }
}

export async function parseSlip(input: {
  image: Uint8Array
  contentType: string
}): Promise<ParseSlipResult> {
  const user = await requireUser()
  const { result, modelId } = await runSlipExtraction(input)

  if (result.kind === "not_a_slip") {
    return { kind: "not_a_slip", reason: result.reason }
  }

  const [row] = await getDb()
    .insert(tradeSlip)
    .values({
      userId: user.id,
      status: "parsed",
      extraction: result,
      extractionModel: modelId,
    })
    .returning()

  return { kind: "trade", slipId: row.id, extraction: result }
}

export async function getSlip(slipId: string): Promise<Slip | null> {
  const user = await requireUser()
  const [row] = await getDb()
    .select()
    .from(tradeSlip)
    .where(and(eq(tradeSlip.id, slipId), eq(tradeSlip.userId, user.id)))
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
