import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import type { Quote } from "@/market"
import { getPositionPriceHistoryFn, type Trade } from "@/trade"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { usd2 } from "./format"

type ChartRange = "1M" | "3M" | "YTD" | "1Y" | "All"

const RANGES: Array<ChartRange> = ["1M", "3M", "YTD", "1Y", "All"]
const DAY_MS = 24 * 60 * 60 * 1000
const Y_AXIS_WIDTH = 64

const chartConfig = {
  close: {
    label: "Close",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

function startOfUTCDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, days: number): Date {
  return new Date(startOfUTCDay(d).getTime() + days * DAY_MS)
}

function isoDate(d: Date): string {
  return startOfUTCDay(d).toISOString().slice(0, 10)
}

function formatTick(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function formatTooltipDate(value: unknown): string {
  if (typeof value !== "string") return ""
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function formatAxisPrice(value: number): string {
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function earliestTradeDate(trades: Array<Trade>): Date | null {
  if (trades.length === 0) return null
  return trades.reduce<Date | null>((earliest, trade) => {
    const tradedAt = new Date(trade.tradedAt)
    return earliest == null || tradedAt < earliest ? tradedAt : earliest
  }, null)
}

function rangeToDates(range: ChartRange, trades: Array<Trade>, now = new Date()) {
  const to = startOfUTCDay(now)
  const allFrom = earliestTradeDate(trades) ?? addDays(to, -365 * 5)

  switch (range) {
    case "1M":
      return { from: addDays(to, -31), to }
    case "3M":
      return { from: addDays(to, -93), to }
    case "YTD":
      return { from: new Date(Date.UTC(to.getUTCFullYear(), 0, 1)), to }
    case "1Y":
      return { from: addDays(to, -365), to }
    case "All":
      return { from: startOfUTCDay(allFrom), to }
  }
}

export function PriceHistoryChart({
  ticker,
  quote,
  trades,
}: {
  ticker: string
  quote: Quote
  trades: Array<Trade>
}) {
  const [range, setRange] = useState<ChartRange>("1Y")
  const dates = useMemo(() => rangeToDates(range, trades), [range, trades])
  const from = isoDate(dates.from)
  const to = isoDate(dates.to)

  const { data, isPending, isError } = useQuery({
    queryKey: ["position-price-history", ticker, from, to],
    queryFn: () =>
      getPositionPriceHistoryFn({
        data: { ticker, from, to },
      }),
    staleTime: range === "All" ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000,
  })

  const chartData = useMemo(
    () =>
      (data ?? []).map((bar) => ({
        date: isoDate(new Date(bar.date)),
        close: bar.close,
      })),
    [data],
  )

  const first = chartData.at(0)?.close
  const last = chartData.at(-1)?.close ?? quote.price
  const change = first != null && first > 0 ? ((last - first) / first) * 100 : 0

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-base font-medium">Price history</h2>
          <p className="text-sm text-muted-foreground">
            {usd2.format(last)}
            {first != null ? (
              <span
                className={cn(
                  "ml-2 tabular-nums",
                  change >= 0 ? "text-emerald-600" : "text-destructive",
                )}
              >
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            ) : null}
          </p>
        </div>
        <div>
          <ButtonGroup>
            {RANGES.map((r) => (
              <Button
                key={r}
                type="button"
                size="xs"
                variant={range === r ? "secondary" : "outline"}
                aria-pressed={range === r}
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-[320px] w-full" />
      ) : isError ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Price history unavailable.
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          No price history found for this range.
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[320px] w-[calc(100%+theme(spacing.8))] -translate-x-8"
          initialDimension={{ width: 760, height: 320 }}
        >
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: 12 }}
          >
            <defs>
              <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-close)"
                  stopOpacity={0.22}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-close)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              minTickGap={28}
              tickMargin={10}
              tickFormatter={formatTick}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={Y_AXIS_WIDTH}
              domain={["dataMin", "dataMax"]}
              tickMargin={8}
              tickFormatter={(value) => formatAxisPrice(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={formatTooltipDate}
                  formatter={(value) => usd2.format(Number(value))}
                />
              }
            />
            <Area
              dataKey="close"
              type="monotone"
              stroke="var(--color-close)"
              strokeWidth={2}
              fill="url(#price-fill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </section>
  )
}
