import { Cell, Pie, PieChart } from "recharts"
import type { EnrichedPosition } from "@/trade"
import { Card, CardContent } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { thb } from "./format"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

const TOP_N = 5

export function CompositionDonut({
  positions,
}: {
  positions: Array<EnrichedPosition>
}) {
  const sorted = [...positions].sort((a, b) => b.valueTHB - a.valueTHB)
  const top = sorted.slice(0, TOP_N)
  const rest = sorted.slice(TOP_N)
  const restValue = rest.reduce((s, p) => s + p.valueTHB, 0)

  const slices = [
    ...top.map((p, i) => ({
      name: p.ticker,
      value: p.valueTHB,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    ...(rest.length > 0
      ? [
          {
            name: `Other (${rest.length})`,
            value: restValue,
            color: "var(--color-muted-foreground)",
          },
        ]
      : []),
  ]

  const config: ChartConfig = Object.fromEntries(
    slices.map((s) => [s.name, { label: s.name, color: s.color }]),
  )

  const total = slices.reduce((s, x) => s + x.value, 0)

  return (
    <Card>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => thb.format(Number(value))}
                />
              }
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={2}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="text-muted-foreground mt-4 space-y-1 text-sm">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-foreground">{s.name}</span>
              </span>
              <span className="tabular-nums">
                {((s.value / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
