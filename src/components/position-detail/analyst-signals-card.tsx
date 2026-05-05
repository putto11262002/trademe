import type { PriceTarget, Quote, RecommendationTrend } from "@/market"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { dash, fmt, usd2 } from "./format"

const BAR_COLOR = {
  buy: "bg-green-600",
  hold: "bg-amber-500",
  sell: "bg-destructive",
} as const

function RatingBar({
  buy,
  hold,
  sell,
}: {
  buy: number
  hold: number
  sell: number
}) {
  const total = buy + hold + sell
  if (total === 0) {
    return (
      <p className="text-muted-foreground text-xs">No analyst ratings.</p>
    )
  }
  const pctOf = (n: number) => (n / total) * 100
  return (
    <div className="space-y-2">
      <div className="bg-muted flex h-2.5 w-full overflow-hidden rounded-full">
        <div
          className={BAR_COLOR.buy}
          style={{ width: `${pctOf(buy)}%` }}
        />
        <div
          className={BAR_COLOR.hold}
          style={{ width: `${pctOf(hold)}%` }}
        />
        <div
          className={BAR_COLOR.sell}
          style={{ width: `${pctOf(sell)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums">
        <span className="text-foreground">Buy {buy}</span>
        <span className="text-muted-foreground">Hold {hold}</span>
        <span className="text-destructive">Sell {sell}</span>
      </div>
    </div>
  )
}

export function AnalystSignalsCard({
  quote,
  priceTarget,
  recommendation,
}: {
  quote: Quote
  priceTarget: PriceTarget | null
  recommendation: RecommendationTrend | null
}) {
  const meanUpsidePct =
    priceTarget?.targetMean != null
      ? ((priceTarget.targetMean - quote.price) / quote.price) * 100
      : null
  const buy = (recommendation?.buy ?? 0) + (recommendation?.strongBuy ?? 0)
  const hold = recommendation?.hold ?? 0
  const sell = (recommendation?.sell ?? 0) + (recommendation?.strongSell ?? 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="text-muted-foreground text-xs">Price target (12-month)</h3>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-2xl font-semibold tabular-nums">
              {fmt(priceTarget?.targetMean, (n) => usd2.format(n))}
            </span>
            {meanUpsidePct != null ? (
              <Badge
                variant={meanUpsidePct >= 0 ? "default" : "destructive"}
                className={
                  meanUpsidePct >= 0
                    ? "bg-green-600 text-white hover:bg-green-600/90"
                    : ""
                }
              >
                <span className="tabular-nums">
                  {meanUpsidePct >= 0 ? "+" : ""}
                  {meanUpsidePct.toFixed(1)}% vs current
                </span>
              </Badge>
            ) : null}
          </div>
          <div className="text-muted-foreground mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums">
            <div>
              <div>Low</div>
              <div className="text-foreground">
                {fmt(priceTarget?.targetLow, (n) => usd2.format(n))}
              </div>
            </div>
            <div>
              <div>Median</div>
              <div className="text-foreground">
                {fmt(priceTarget?.targetMedian, (n) => usd2.format(n))}
              </div>
            </div>
            <div>
              <div>High</div>
              <div className="text-foreground">
                {fmt(priceTarget?.targetHigh, (n) => usd2.format(n))}
              </div>
            </div>
          </div>
          {priceTarget?.numberOfAnalysts ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Based on {priceTarget.numberOfAnalysts} analyst
              {priceTarget.numberOfAnalysts === 1 ? "" : "s"}.
            </p>
          ) : null}
          {!priceTarget ||
          (priceTarget.targetMean == null &&
            priceTarget.targetLow == null &&
            priceTarget.targetHigh == null) ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Price target unavailable. {dash}
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="text-muted-foreground mb-2 text-xs">
            Recommendation breakdown
            {recommendation?.period
              ? ` (${recommendation.period.toISOString().slice(0, 7)})`
              : ""}
          </h3>
          <RatingBar buy={buy} hold={hold} sell={sell} />
        </div>
      </CardContent>
    </Card>
  )
}
