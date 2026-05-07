import { and, eq } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { marketCompanyProfile, trade, tradeSlip } from "@/db/schema"
import type { AddTradeInput } from "./schemas"

export type TradeValidationIssue = {
  field?: keyof AddTradeInput
  code:
    | "ticker_unknown"
    | "slip_not_found"
    | "slip_already_attached"
    | "oversell"
  message: string
}

export type TradeValidationResult = { errors: Array<TradeValidationIssue> }

export class TradeValidationFailed extends Error {
  readonly issues: Array<TradeValidationIssue>
  constructor(issues: Array<TradeValidationIssue>) {
    super(issues[0]?.message ?? "Trade validation failed")
    this.name = "TradeValidationFailed"
    this.issues = issues
  }
}

export async function validateAddTrade(
  input: AddTradeInput,
  userId: string,
): Promise<TradeValidationResult> {
  const errors: Array<TradeValidationIssue> = []
  const ticker = input.ticker.toUpperCase()

  const [profile] = await getDb()
    .select({ ticker: marketCompanyProfile.ticker })
    .from(marketCompanyProfile)
    .where(eq(marketCompanyProfile.ticker, ticker))
    .limit(1)
  if (!profile) {
    errors.push({
      field: "ticker",
      code: "ticker_unknown",
      message: `Ticker ${ticker} not found in catalog`,
    })
  }

  if (input.slipId) {
    const [slip] = await getDb()
      .select({ status: tradeSlip.status })
      .from(tradeSlip)
      .where(and(eq(tradeSlip.id, input.slipId), eq(tradeSlip.userId, userId)))
      .limit(1)
    if (!slip) {
      errors.push({
        field: "slipId",
        code: "slip_not_found",
        message: "Slip not found",
      })
    } else if (slip.status !== "parsed") {
      errors.push({
        field: "slipId",
        code: "slip_already_attached",
        message: "Slip already attached to a trade",
      })
    }
  }

  if (input.side === "sell") {
    const rows = await getDb()
      .select({ side: trade.side, quantity: trade.quantity })
      .from(trade)
      .where(and(eq(trade.userId, userId), eq(trade.ticker, ticker)))
    let netQuantity = 0
    for (const r of rows) {
      const q = parseFloat(r.quantity)
      if (r.side === "buy") netQuantity += q
      else netQuantity -= q
    }
    if (input.quantity > netQuantity) {
      errors.push({
        field: "quantity",
        code: "oversell",
        message: `Sell quantity (${input.quantity}) exceeds your position (${netQuantity})`,
      })
    }
  }

  return { errors }
}
