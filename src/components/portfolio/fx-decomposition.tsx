import type { PortfolioSummary } from "@/trade"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { thb } from "./format"

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${thb.format(n)}`
}

function tone(n: number): string {
  if (n === 0) return "text-muted-foreground"
  return n > 0 ? "text-green-600" : "text-destructive"
}

export function FxDecompositionCard({
  summary,
}: {
  summary: PortfolioSummary
}) {
  const total = summary.unrealizedPnLTHB
  const stockPct =
    summary.totalCostTHB > 0
      ? (summary.stockPnLTHB / summary.totalCostTHB) * 100
      : 0
  const fxPct =
    summary.totalCostTHB > 0
      ? (summary.fxPnLTHB / summary.totalCostTHB) * 100
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock vs FX</CardTitle>
        <CardDescription>
          Where your unrealized P&amp;L is coming from
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground text-sm">Total unrealized</span>
          <span className={cn("text-lg font-semibold tabular-nums", tone(total))}>
            {signed(total)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Stock gain</div>
            <div
              className={cn(
                "mt-1 text-base font-semibold tabular-nums",
                tone(summary.stockPnLTHB),
              )}
            >
              {signed(summary.stockPnLTHB)}
            </div>
            <div
              className={cn(
                "text-xs tabular-nums",
                tone(summary.stockPnLTHB),
              )}
            >
              {stockPct >= 0 ? "+" : ""}
              {stockPct.toFixed(2)}%
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-xs">
              FX {summary.fxPnLTHB >= 0 ? "boost" : "drag"}
            </div>
            <div
              className={cn(
                "mt-1 text-base font-semibold tabular-nums",
                tone(summary.fxPnLTHB),
              )}
            >
              {signed(summary.fxPnLTHB)}
            </div>
            <div
              className={cn(
                "text-xs tabular-nums",
                tone(summary.fxPnLTHB),
              )}
            >
              {fxPct >= 0 ? "+" : ""}
              {fxPct.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          Stock = USD price moves at your blended entry rate. FX = USD/THB drift
          since you bought.
        </div>
      </CardContent>
    </Card>
  )
}
