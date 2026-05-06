import type { SlipExtractionTrade } from "./schemas"

export type SlipStatus = "parsed" | "attached"

export type Slip = {
  id: string
  userId: string
  status: SlipStatus
  extraction: SlipExtractionTrade
  extractionModel: string
  parsedAt: Date
}

/**
 * Discriminated result returned by `parseSlipFn` to the client. Only the
 * `trade` variant has a stored slipId; `not_a_slip` is not persisted.
 */
export type ParseSlipResult =
  | { kind: "trade"; slipId: string; extraction: SlipExtractionTrade }
  | { kind: "not_a_slip"; reason: string }
