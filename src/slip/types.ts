import type { SlipExtractionSlip } from "./schemas"

export type SlipStatus = "parsed" | "attached"

export type Slip = {
  id: string
  userId: string
  status: SlipStatus
  extraction: SlipExtractionSlip
  extractionModel: string
  parsedAt: Date
}

/**
 * Discriminated result returned by `parseSlipFn` to the client. Only the
 * `slip` variant has a stored slipId; `not_a_slip` is not persisted.
 */
export type ParseSlipResult =
  | { kind: "slip"; slipId: string; extraction: SlipExtractionSlip }
  | { kind: "not_a_slip"; reason: string }
