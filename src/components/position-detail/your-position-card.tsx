import { TrendingDown, TrendingUp } from "lucide-react"
import type { EnrichedPosition } from "@/trade"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { pct, qty, usd2 } from "./format"

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
}: {
  position: EnrichedPosition | null
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
  const costUSD = position.avgCost * position.netQuantity

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-8">
          <div className="space-y-0.5">
            <div className="text-muted-foreground text-xs">Market value</div>
            <div className="text-2xl font-semibold tabular-nums">
              {usd2.format(position.valueUSD)}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-muted-foreground text-xs">Unrealized P&amp;L</div>
            <Badge
              variant={isUp ? "default" : "destructive"}
              className={cn("gap-1", isUp && "bg-green-600 text-white hover:bg-green-600/90")}
            >
              <Icon className="size-3" />
              <span className="tabular-nums">
                {usd2.format(position.unrealizedPnLUSD)} ({pct(position.unrealizedPnLPct)})
              </span>
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm sm:grid-cols-5">
          <Stat label="Quantity" value={`${qty.format(position.netQuantity)} sh`} />
          <Stat label="Avg cost" value={usd2.format(position.avgCost)} />
          <Stat label="Cost basis" value={usd2.format(costUSD)} />
          <Stat
            label="Trades"
            value={position.tradeCount.toString()}
            sub={`bought ${qty.format(position.totalBought)} · sold ${qty.format(position.totalSold)}`}
          />
          <Stat label="Last price" value={usd2.format(position.currentPriceUSD)} />
        </div>
      </CardContent>
    </Card>
  )
}
