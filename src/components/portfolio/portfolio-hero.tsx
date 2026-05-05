import { formatDistanceToNow } from "date-fns"
import { TrendingDown, TrendingUp } from "lucide-react"
import type { PortfolioSummary } from "@/trade"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { pct, thb, usd } from "./format"

export function PortfolioHero({ summary }: { summary: PortfolioSummary }) {
  const isUp = summary.unrealizedPnLUSD >= 0
  const Icon = isUp ? TrendingUp : TrendingDown
  const pnlTHB = summary.unrealizedPnLUSD * summary.fxRate

  return (
    <Card>
      <CardContent className="space-y-3">
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
          className={cn("gap-1", isUp && "bg-green-600 text-white hover:bg-green-600/90")}
        >
          <Icon className="size-3" />
          <span className="tabular-nums">{pct(summary.unrealizedPnLPct)}</span>
          <span className="opacity-80 tabular-nums">
            ({thb.format(pnlTHB)})
          </span>
        </Badge>
        <div className="text-muted-foreground text-xs">
          USD/THB {summary.fxRate.toFixed(2)} · updated{" "}
          {formatDistanceToNow(summary.fxAsOf, { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  )
}
