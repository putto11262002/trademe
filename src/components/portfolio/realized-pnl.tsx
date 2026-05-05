import { TrendingDown, TrendingUp } from "lucide-react"
import type { PortfolioSummary } from "@/trade"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { thb, usd } from "./format"

export function RealizedPnLCard({ summary }: { summary: PortfolioSummary }) {
  const isUp = summary.realizedPnLUSD >= 0
  const Icon = isUp ? TrendingUp : TrendingDown
  const isFlat = summary.realizedPnLUSD === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realized P&amp;L</CardTitle>
        <CardDescription>From positions you've sold (avg cost)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className={cn(
            "text-2xl font-semibold tabular-nums",
            !isFlat && (isUp ? "text-green-600" : "text-destructive"),
          )}
        >
          {isUp && !isFlat ? "+" : ""}
          {thb.format(summary.realizedPnLTHB)}
        </div>
        <div className="text-muted-foreground tabular-nums text-sm">
          {isUp && !isFlat ? "+" : ""}
          {usd.format(summary.realizedPnLUSD)}
        </div>
        {!isFlat ? (
          <Badge
            variant={isUp ? "default" : "destructive"}
            className={cn(
              "gap-1",
              isUp && "bg-green-600 text-white hover:bg-green-600/90",
            )}
          >
            <Icon className="size-3" />
            {isUp ? "Gain" : "Loss"}
          </Badge>
        ) : (
          <Badge variant="secondary">No closed positions</Badge>
        )}
      </CardContent>
    </Card>
  )
}
