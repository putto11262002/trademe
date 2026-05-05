import type { SectorAllocation } from "@/trade"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { thb } from "./format"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

const FALLBACK_COLOR = "var(--color-muted-foreground)"

export function SectorAllocationCard({
  allocation,
}: {
  allocation: Array<SectorAllocation>
}) {
  if (allocation.length === 0) {
    return null
  }

  const total = allocation.reduce((s, a) => s + a.valueTHB, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector allocation</CardTitle>
        <CardDescription>How your holdings split across sectors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
          {allocation.map((a, i) => (
            <div
              key={a.sector}
              className="h-full"
              style={{
                width: `${a.pct}%`,
                backgroundColor:
                  i < CHART_COLORS.length ? CHART_COLORS[i] : FALLBACK_COLOR,
              }}
              title={`${a.sector} · ${a.pct.toFixed(1)}%`}
            />
          ))}
        </div>
        <ul className="space-y-2 text-sm">
          {allocation.map((a, i) => (
            <li
              key={a.sector}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      i < CHART_COLORS.length
                        ? CHART_COLORS[i]
                        : FALLBACK_COLOR,
                  }}
                />
                <span className="text-foreground truncate">{a.sector}</span>
              </span>
              <span className="text-muted-foreground tabular-nums shrink-0">
                <span className="text-foreground font-medium">
                  {a.pct.toFixed(1)}%
                </span>
                <span className="ml-2 text-xs">{thb.format(a.valueTHB)}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="text-muted-foreground text-xs tabular-nums">
          Total {thb.format(total)}
        </div>
      </CardContent>
    </Card>
  )
}
