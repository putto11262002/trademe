import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
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

  const config: ChartConfig = Object.fromEntries(
    allocation.map((a, i) => [
      a.sector,
      {
        label: a.sector,
        color: i < CHART_COLORS.length ? CHART_COLORS[i] : FALLBACK_COLOR,
      },
    ]),
  )

  const chartData = allocation.map((a, i) => ({
    sector: a.sector,
    pct: Number(a.pct.toFixed(1)),
    valueTHB: a.valueTHB,
    fill: i < CHART_COLORS.length ? CHART_COLORS[i] : FALLBACK_COLOR,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector allocation</CardTitle>
        <CardDescription>How your holdings split across sectors</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="w-full" style={{ height: Math.max(allocation.length * 40 + 16, 80) }}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 32, bottom: 0, left: 8 }}
          >
            <YAxis
              dataKey="sector"
              type="category"
              tickLine={false}
              axisLine={false}
              width={110}
              tick={{ fontSize: 12 }}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
            />
            <ChartTooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) =>
                    `${value}% · ${thb.format(item.payload.valueTHB)}`
                  }
                  hideIndicator
                />
              }
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
              {chartData.map((d) => (
                <Cell key={d.sector} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
