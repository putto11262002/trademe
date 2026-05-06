import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { SlipUploader } from "@/components/trade/slip-uploader"
import { TradeForm } from "@/components/trade/trade-form"
import { Button } from "@/components/ui/button"
import type { SlipExtractionTrade } from "@/slip"
import type { AddTradeFormValues } from "@/trade"

export const Route = createFileRoute("/trades/new")({ component: NewTradePage })

type Prefill = {
  slipId: string
  values: Partial<AddTradeFormValues>
}

function extractionToFormValues(
  extraction: SlipExtractionTrade,
): Partial<AddTradeFormValues> {
  const parsedDate = new Date(extraction.tradedAt)
  const tradedAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  return {
    ticker: extraction.ticker,
    side: extraction.side,
    quantity: extraction.quantity,
    pricePerShare: extraction.pricePerShare,
    fees: extraction.fees ?? 0,
    fxRate: extraction.fxRate,
    tradedAt,
    broker: extraction.broker ?? undefined,
  }
}

function NewTradePage() {
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/trades">
          <ArrowLeft className="size-4" />
          Back to trades
        </Link>
      </Button>
      <header>
        <h1 className="text-2xl font-semibold">Add trade</h1>
        <p className="text-muted-foreground text-sm">
          Upload a slip to autofill, or enter a US-stock buy/sell manually.
        </p>
      </header>
      <SlipUploader
        onParsed={(extraction, slipId) =>
          setPrefill({ slipId, values: extractionToFormValues(extraction) })
        }
      />
      <TradeForm
        key={prefill?.slipId ?? "manual"}
        defaultValues={
          prefill ? { ...prefill.values, slipId: prefill.slipId } : undefined
        }
      />
    </div>
  )
}
