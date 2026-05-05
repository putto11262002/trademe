import { formatDistanceToNow } from "date-fns"
import { TrendingDown, TrendingUp } from "lucide-react"
import type { PortfolioSummary } from "@/trade"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { thb, usd } from "./format"

function signedTHB(n: number): string {
  return `${n > 0 ? "+" : ""}${thb.format(n)}`
}

function signedPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`
}

function tone(n: number): string {
  if (n === 0) return "text-muted-foreground"
  return n > 0 ? "text-green-600" : "text-destructive"
}

function StatRow({
  label,
  thbValue,
  pctValue,
}: {
  label: string
  thbValue: number
  pctValue: number | null
}) {
  const valueIsZeroFlat = thbValue === 0 && pctValue === null
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-3 tabular-nums">
        <span className={cn("font-medium", tone(thbValue))}>
          {valueIsZeroFlat ? "—" : signedTHB(thbValue)}
        </span>
        <span
          className={cn(
            "w-16 text-right text-xs",
            pctValue === null ? "text-muted-foreground" : tone(pctValue),
          )}
        >
          {pctValue === null ? "—" : signedPct(pctValue)}
        </span>
      </div>
    </div>
  )
}

export function PortfolioHero({ summary }: { summary: PortfolioSummary }) {
  // Use the THB P&L derived from THB cost basis vs THB value (entry FX for
  // cost, current FX for value). This captures FX drift; converting USD P&L
  // at today's FX would understate it for a Thai investor.
  const pnlTHB = summary.unrealizedPnLTHB
  const pnlPct =
    summary.totalCostTHB > 0
      ? (summary.unrealizedPnLTHB / summary.totalCostTHB) * 100
      : 0
  const isUp = pnlTHB >= 0
  const Icon = isUp ? TrendingUp : TrendingDown

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
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold tabular-nums">
              {thb.format(summary.totalValueTHB)}
            </div>
            <div className="text-muted-foreground tabular-nums">
              {usd.format(summary.totalValueUSD)}
            </div>
          </div>
          <Badge
            variant={isUp ? "default" : "destructive"}
            className={cn(
              "gap-1",
              isUp && "bg-green-600 text-white hover:bg-green-600/90",
            )}
          >
            <Icon className="size-3" />
            <span className="tabular-nums">{signedPct(pnlPct)}</span>
            <span className="opacity-80 tabular-nums">
              ({signedTHB(pnlTHB)})
            </span>
          </Badge>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <StatRow
            label="Stock gain"
            thbValue={summary.stockPnLTHB}
            pctValue={stockPct}
          />
          <StatRow
            label="Currency impact"
            thbValue={summary.fxPnLTHB}
            pctValue={fxPct}
          />
          <StatRow
            label="Locked-in P&L"
            thbValue={summary.realizedPnLTHB}
            pctValue={null}
          />
        </div>

        <div className="text-muted-foreground text-xs">
          USD/THB {summary.fxRate.toFixed(2)} · updated{" "}
          {formatDistanceToNow(summary.fxAsOf, { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  )
}
