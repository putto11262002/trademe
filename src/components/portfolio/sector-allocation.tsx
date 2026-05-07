import { Cell, Pie, PieChart } from "recharts"
import type { SectorAllocation } from "@/trade"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { usd } from "./format"

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

  const slices = allocation.map((a, i) => ({
    name: a.sector,
    value: a.valueUSD,
    pct: a.pct,
    color: i < CHART_COLORS.length ? CHART_COLORS[i] : FALLBACK_COLOR,
  }))

  const config: ChartConfig = Object.fromEntries(
    slices.map((s) => [s.name, { label: s.name, color: s.color }]),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector allocation</CardTitle>
        <CardDescription>How your holdings split across sectors</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <ChartContainer config={config} className="aspect-square h-48 shrink-0">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => usd.format(Number(value))}
                />
              }
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              strokeWidth={2}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-foreground truncate">{s.name}</span>
              </span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {s.pct.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
