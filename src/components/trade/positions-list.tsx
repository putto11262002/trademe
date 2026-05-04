import type { Position } from "@/trade"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 })

export function PositionsList({ data }: { data: Array<Position> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((p) => {
        const avgCost = p.totalBought > 0 ? p.totalCost / p.totalBought : 0
        return (
          <Card key={p.ticker}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-baseline justify-between">
                <span>{p.ticker}</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {p.tradeCount} {p.tradeCount === 1 ? "trade" : "trades"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Net qty" value={qty.format(p.netQuantity)} />
              <Row label="Avg cost" value={usd.format(avgCost)} />
              <Row label="Total cost" value={usd.format(p.totalCost)} />
              {p.totalProceeds > 0 ? (
                <Row label="Proceeds" value={usd.format(p.totalProceeds)} />
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
