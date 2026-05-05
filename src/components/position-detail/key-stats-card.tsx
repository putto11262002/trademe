import type { Fundamentals, Quote } from "@/market"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  compactMarketCapMillions,
  dash,
  fmt,
  usd2,
} from "./format"

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function KeyStatsCard({
  quote,
  fundamentals,
}: {
  quote: Quote
  fundamentals: Fundamentals | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key stats</CardTitle>
      </CardHeader>
      <CardContent className="py-0">
        <StatRow label="Last price" value={usd2.format(quote.price)} />
        <StatRow label="Previous close" value={usd2.format(quote.previousClose)} />
        <StatRow label="52w high" value={fmt(fundamentals?.week52High, (n) => usd2.format(n))} />
        <StatRow label="52w low" value={fmt(fundamentals?.week52Low, (n) => usd2.format(n))} />
        <StatRow label="Market cap" value={fmt(fundamentals?.marketCap, (n) => compactMarketCapMillions(n))} />
        <StatRow label="P/E (TTM)" value={fmt(fundamentals?.peRatio, (n) => n.toFixed(2))} />
        <StatRow label="EPS (TTM)" value={fmt(fundamentals?.eps, (n) => usd2.format(n))} />
        <StatRow label="Dividend yield" value={fmt(fundamentals?.dividendYield, (n) => `${n.toFixed(2)}%`)} />
        <StatRow label="Beta" value={fmt(fundamentals?.beta, (n) => n.toFixed(2))} />
        {!fundamentals ? (
          <p className="text-muted-foreground py-3 text-xs">Fundamentals unavailable. {dash}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
