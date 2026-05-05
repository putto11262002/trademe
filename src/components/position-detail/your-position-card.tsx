import { TrendingDown, TrendingUp } from "lucide-react"
import type { EnrichedPosition } from "@/trade"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { pct, qty, thb0, usd2 } from "./format"

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
      {sub ? <div className="text-muted-foreground text-xs tabular-nums">{sub}</div> : null}
    </div>
  )
}

export function YourPositionCard({
  position,
  fxRate,
}: {
  position: EnrichedPosition | null
  fxRate: number
}) {
  if (!position) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your position</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You have no open position in this ticker.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isUp = position.unrealizedPnLUSD >= 0
  const Icon = isUp ? TrendingUp : TrendingDown
  const pnlTHB = position.unrealizedPnLUSD * fxRate
  const costUSD = position.avgCost * position.netQuantity

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Your position</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="text-muted-foreground text-xs">Market value</div>
            <div className="text-2xl font-semibold tabular-nums">
              {thb0.format(position.valueTHB)}
            </div>
            <div className="text-muted-foreground text-sm tabular-nums">
              {usd2.format(position.valueUSD)}
            </div>
            <div className="pt-1">
              <Badge
                variant={isUp ? "default" : "destructive"}
                className={cn("gap-1", isUp && "bg-green-600 text-white hover:bg-green-600/90")}
              >
                <Icon className="size-3" />
                <span className="tabular-nums">
                  {usd2.format(position.unrealizedPnLUSD)} ({pct(position.unrealizedPnLPct)})
                </span>
              </Badge>
              <div className="text-muted-foreground mt-1 text-xs tabular-nums">
                {thb0.format(pnlTHB)} unrealized
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 text-sm">
            <Stat label="Quantity" value={`${qty.format(position.netQuantity)} sh`} />
            <Stat label="Avg cost" value={usd2.format(position.avgCost)} />
            <Stat label="Cost basis" value={usd2.format(costUSD)} />
            <Stat
              label="Trades"
              value={position.tradeCount.toString()}
              sub={`bought ${qty.format(position.totalBought)} · sold ${qty.format(position.totalSold)}`}
            />
            <Stat label="Last price" value={usd2.format(position.currentPriceUSD)} />
            <Stat label="USD/THB" value={position.fxRate.toFixed(2)} sub="Current rate" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
